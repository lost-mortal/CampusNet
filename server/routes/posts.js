const router = require('express').Router();
const Post = require('../models/Post');
const Club = require('../models/Club');
const Registration = require('../models/Registration');
const Connection = require('../models/Connection');
const Application = require('../models/Application');
require('../models/Community');
const requireAuth = require('../middleware/auth');

const CLUB_ICONS = {
  'Robotics Club': '🤖',
  'GDSC': '💻',
  'Music Club': '🎵',
  'AI/ML Club': '🧠',
  'Sports Club': '🏅',
};

// GET /api/posts — full feed for logged-in user
//
// Feed order:
//   1) Active deadlined posts (Recruitment/Event with future deadline,
//      Recruitment also needs isActive=true) — sorted by deadline ASC
//      so "closing soonest" floats to the top.
//   2) Non-deadlined posts (General, Collab) — sorted by createdAt DESC.
//   3) Closed posts (deadline passed, or Recruitment with isActive=false)
//      — sorted by deadline DESC so most-recently-closed comes first.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    // Optional filters: ?type=Collab and ?author=me (the only two used today)
    const filter = { college: 'SINHGAD_ENGINEERING' };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.author === 'me') filter.author = req.user._id;

    const posts = await Post.find(filter)
      .populate('author', 'firstName lastName')
      .populate('club', 'name')
      .populate('community', 'name');

    const now = Date.now();
    const bucketOf = (p) => {
      const hasDeadline = !!p.registrationDeadline;
      if (!hasDeadline) return 1; // General / Collab / anything without deadline
      const deadlineMs = new Date(p.registrationDeadline).getTime();
      const closed = deadlineMs < now || (p.type === 'Recruitment' && p.isActive === false);
      return closed ? 2 : 0;
    };

    posts.sort((a, b) => {
      const ba = bucketOf(a);
      const bb = bucketOf(b);
      if (ba !== bb) return ba - bb;

      if (ba === 0) {
        // Active deadlined: soonest deadline first
        return new Date(a.registrationDeadline) - new Date(b.registrationDeadline);
      }
      if (ba === 1) {
        // No deadline: newest createdAt first
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // Closed: most-recently-closed first (largest deadline first)
      return new Date(b.registrationDeadline) - new Date(a.registrationDeadline);
    });

    // Tag event posts that the current user has already registered for, in a single query.
    // Also surface paymentStatus so the feed can distinguish pending_verification from approved/free.
    const eventPostIds = posts.filter(p => p.type === 'Event').map(p => p._id);
    const myRegs = eventPostIds.length
      ? await Registration.find({ post: { $in: eventPostIds }, registrant: req.user._id }).select('post paymentStatus')
      : [];
    const regByPost = new Map(myRegs.map(r => [r.post.toString(), r.paymentStatus]));

    // If the caller asked for their own posts, also surface a per-post
    // connection count so the Activity → My Collab Posts section can show it.
    let connectionCountByPost = new Map();
    if (req.query.author === 'me') {
      const collabIds = posts.filter(p => p.type === 'Collab').map(p => p._id);
      if (collabIds.length) {
        const rows = await Connection.aggregate([
          { $match: { sourcePost: { $in: collabIds } } },
          { $group: { _id: '$sourcePost', n: { $sum: 1 } } },
        ]);
        connectionCountByPost = new Map(rows.map(r => [r._id.toString(), r.n]));
      }
    }

    const shaped = posts.map(p => ({
      _id: p._id,
      type: p.type.toLowerCase(),
      title: p.title,
      description: p.body,
      image: p.image || null,
      tag: p.tag,
      isActive: p.isActive,
      createdAt: p.createdAt,
      clubName: p.club?.name || null,
      clubLogo: p.club ? (CLUB_ICONS[p.club.name] || '🏆') : null,
      date: p.eventDate || p.createdAt,
      eventDate: p.eventDate || null,
      registrationDeadline: p.registrationDeadline || null,
      isExpired: !!(p.registrationDeadline && new Date(p.registrationDeadline).getTime() < now),
      location: p.venue || null,
      isPaid: !!p.isPaid,
      amount: p.amount || 0,
      paymentQrImage: p.paymentQrImage || null,
      paymentConfig: p.paymentConfig,
      alreadyRegistered: p.type === 'Event' ? regByPost.has(p._id.toString()) : false,
      myRegistrationStatus: p.type === 'Event' ? (regByPost.get(p._id.toString()) || null) : null,
      communityName: p.community?.name || null,
      communityId: p.community?._id || null,
      authorName: p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Unknown',
      authorId: p.author?._id || null,
      skills: p.skills || [],
      connectionCount: connectionCountByPost.get(p._id.toString()) || 0,
    }));

    res.json(shaped);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts — president creates a Recruitment or Event post
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      type, title, body, image, eventDate, venue, tag,
      registrationDeadline, isPaid, amount, paymentQrImage,
    } = req.body;

    if (!['Recruitment', 'Event'].includes(type)) {
      return res.status(400).json({ error: 'Invalid post type' });
    }
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const club = await Club.findOne({ president: req.user._id });
    if (!club) return res.status(403).json({ error: 'Only club presidents can create posts' });

    if (type === 'Recruitment') {
      const existing = await Post.findOne({ club: club._id, type: 'Recruitment', isActive: true });
      if (existing) return res.status(409).json({ error: 'An active recruitment post already exists' });
    }

    if (type === 'Event' && !eventDate) {
      return res.status(400).json({ error: 'Event date is required' });
    }
    if (!registrationDeadline) {
      return res.status(400).json({ error: 'Registration deadline is required' });
    }

    const paid = type === 'Event' && !!isPaid;
    if (paid) {
      if (!paymentQrImage) return res.status(400).json({ error: 'Payment QR image is required for paid events' });
      if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Amount must be greater than 0 for paid events' });
    }

    const post = await Post.create({
      type,
      title: title.trim(),
      body: body?.trim() || '',
      image: image?.trim() || '',
      author: req.user._id,
      club: club._id,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      venue: venue?.trim() || '',
      tag: tag || (type === 'Recruitment' ? 'Recruitment' : 'Technical'),
      isActive: true,
      registrationDeadline: new Date(registrationDeadline),
      isPaid: paid,
      amount: paid ? Number(amount) : 0,
      paymentQrImage: paid ? paymentQrImage : '',
      college: 'SINHGAD_ENGINEERING',
    });

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/collab — any authenticated student posts a general collab request
router.post('/collab', requireAuth, async (req, res, next) => {
  try {
    const { title, description, lookingFor, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!description?.trim()) return res.status(400).json({ error: 'Description is required' });
    if (!lookingFor?.trim()) return res.status(400).json({ error: 'Looking for description is required' });

    const body = `${description.trim()}\n\nLooking for: ${lookingFor.trim()}`;
    const skillTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    const primaryTag = skillTags[0] || 'Other';

    const post = await Post.create({
      type: 'Collab',
      title: title.trim(),
      body,
      author: req.user._id,
      community: null,
      skills: skillTags,
      tag: primaryTag,
      college: 'SINHGAD_ENGINEERING',
    });

    await post.populate('author', 'firstName lastName');
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id
//
// Two authorization paths depending on post type:
//   • Collab: author-only. Cascade: Connection docs whose sourcePost = this post.
//   • Event / Recruitment: must be the president of the owning club.
//       Event → cascade Registration docs
//       Recruitment → cascade Application docs
//   • General: not deletable via this endpoint.
//
// For Events with `paymentStatus: 'approved'` registrations we DON'T block —
// the brief asked for a warning instead. We include a `warning` field in the
// response so the UI can flag it after the fact (and the confirm modal can
// already pre-warn before the call).
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.type === 'Collab') {
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Only the author can delete this post' });
      }
      await Connection.deleteMany({ sourcePost: post._id });
      await post.deleteOne();
      return res.json({ deleted: true });
    }

    if (post.type !== 'Event' && post.type !== 'Recruitment') {
      return res.status(403).json({ error: 'This post type cannot be deleted' });
    }

    // Event / Recruitment — president of owning club only.
    if (!post.club) {
      return res.status(400).json({ error: 'Post is not attached to a club' });
    }
    const club = await Club.findById(post.club);
    if (!club) return res.status(404).json({ error: 'Owning club not found' });
    if (club.president.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the club president can delete this post' });
    }

    let warning;
    if (post.type === 'Event') {
      const approvedCount = await Registration.countDocuments({
        post: post._id,
        paymentStatus: 'approved',
      });
      if (approvedCount > 0) {
        warning = `${approvedCount} approved paid registration${approvedCount === 1 ? '' : 's'} were also deleted.`;
      }
      await Registration.deleteMany({ post: post._id });
    } else {
      await Application.deleteMany({ post: post._id });
    }

    await post.deleteOne();
    return res.json({ deleted: true, ...(warning ? { warning } : {}) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/posts/:id/close — president closes a recruitment post
router.patch('/:id/close', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('club');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.club.president.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    post.isActive = false;
    await post.save();
    res.json({ _id: post._id, isActive: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
