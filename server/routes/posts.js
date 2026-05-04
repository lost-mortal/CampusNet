const router = require('express').Router();
const Post = require('../models/Post');
const Club = require('../models/Club');
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
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const posts = await Post.find({ college: 'SINHGAD_ENGINEERING' })
      .sort({ createdAt: -1 })
      .populate('author', 'firstName lastName')
      .populate('club', 'name')
      .populate('community', 'name');

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
      location: p.venue || null,
      paymentConfig: p.paymentConfig,
      communityName: p.community?.name || null,
      authorName: p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Unknown',
    }));

    res.json(shaped);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts — president creates a Recruitment or Event post
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { type, title, body, image, eventDate, venue, tag } = req.body;

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
      college: 'SINHGAD_ENGINEERING',
    });

    res.status(201).json(post);
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
