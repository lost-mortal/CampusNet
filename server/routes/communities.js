const router = require('express').Router();
const mongoose = require('mongoose');
const Community = require('../models/Community');
const Post = require('../models/Post');
const CommunityAnnouncement = require('../models/CommunityAnnouncement');
const CommunityMessage = require('../models/CommunityMessage');
const Discussion = require('../models/Discussion');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const { notify } = require('../lib/notify');

// ─── Helpers ────────────────────────────────────────────────────────────────
// Works whether community.manager is a raw ObjectId OR a populated User document.
function managerId(community) {
  if (!community.manager) return null;
  return (community.manager._id ?? community.manager).toString();
}
function isManager(community, userId) {
  const mid = managerId(community);
  return !!mid && mid === userId.toString();
}
function isMemberOrManager(community, userId) {
  const u = userId.toString();
  if (managerId(community) === u) return true;
  return community.members.some(m => (m._id ?? m).toString() === u);
}

// Reject non-ObjectId `:id` (e.g. legacy "comm_001") with 404 instead of letting
// the CastError bubble up as a 500.
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Community not found' });
  }
  next();
});

// GET /api/communities — list all approved communities (for suggestions)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const communities = await Community.find({
      college: 'SINHGAD_ENGINEERING',
      status: 'approved',
    })
      .sort({ createdAt: -1 })
      .select('name icon description tags members manager isPrivate joinRequests');

    const myId = req.user._id.toString();
    res.json(communities.map(c => ({
      _id: c._id,
      name: c.name,
      icon: c.icon || '🌐',
      description: c.description || '',
      tags: c.tags || [],
      memberCount: c.members?.length || 0,
      isPrivate: !!c.isPrivate,
      isMember:
        (c.manager && c.manager.toString() === myId) ||
        c.members.some(m => m.toString() === myId),
      hasRequested: (c.joinRequests || []).some(r => r.user?.toString() === myId),
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/communities/mine — current student's community memberships + manager state + pending request
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const myId = req.user._id;

    const [managed, pending, memberOf] = await Promise.all([
      Community.findOne({ manager: myId, status: 'approved' })
        .select('name icon description tags members joinRequests isPrivate'),
      Community.findOne({ manager: myId, status: 'pending' })
        .select('name status createdAt'),
      Community.find({ members: myId, status: 'approved' })
        .select('name icon members manager')
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      managed: managed ? {
        _id: managed._id,
        name: managed.name,
        icon: managed.icon || '🌐',
        memberCount: managed.members?.length || 0,
        pendingRequestsCount: (managed.joinRequests || []).length,
      } : null,
      pending: pending ? {
        _id: pending._id,
        name: pending.name,
        createdAt: pending.createdAt,
      } : null,
      member: memberOf
        // exclude the community the user manages (already in `managed`)
        .filter(c => !managed || c._id.toString() !== managed._id.toString())
        .map(c => ({
          _id: c._id,
          name: c.name,
          icon: c.icon || '🌐',
          memberCount: c.members?.length || 0,
          isManager: c.manager && c.manager.toString() === myId.toString(),
        })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities — student creates a pending community request
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, description, tags, reason, isPrivate } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Community name is required' });
    if (!reason?.trim()) return res.status(400).json({ error: 'Please explain why this community should be approved' });

    // Block if user already has a pending or approved community
    const existing = await Community.findOne({
      manager: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(409).json({
        error: existing.status === 'pending'
          ? 'You already have a pending community request'
          : 'You already manage a community',
      });
    }

    const tagsArr = Array.isArray(tags)
      ? tags.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim())
      : (typeof tags === 'string'
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : []);

    const community = await Community.create({
      name: name.trim(),
      description: (description || '').trim(),
      tags: tagsArr,
      reason: reason.trim(),
      isPrivate: !!isPrivate,
      status: 'pending',
      manager: req.user._id,
      members: [req.user._id],
      college: 'SINHGAD_ENGINEERING',
    });

    res.status(201).json({
      _id: community._id,
      name: community.name,
      status: community.status,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/communities/:id — public community profile
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('manager', 'firstName lastName rollNumber');
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const myId = req.user._id.toString();
    const isMember = community.members.some(m => m.toString() === myId)
      || (community.manager && community.manager._id.toString() === myId);
    const isManagerFlag = community.manager && community.manager._id.toString() === myId;

    const recentActivity = await Post.find({ community: community._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('author', 'firstName lastName');

    const hasRequested = (community.joinRequests || []).some(r => r.user?.toString() === myId);

    res.json({
      _id: community._id,
      name: community.name,
      icon: community.icon || '🌐',
      profilePhoto: community.profilePhoto || '',
      bannerImage: community.bannerImage || '',
      description: community.description || '',
      tags: community.tags || [],
      memberCount: community.members.length,
      isPrivate: !!community.isPrivate,
      isMember,
      isManager: !!isManagerFlag,
      hasRequested,
      manager: community.manager ? {
        _id: community.manager._id,
        name: `${community.manager.firstName} ${community.manager.lastName}`,
        rollNumber: community.manager.rollNumber,
      } : null,
      recentActivity: recentActivity.map(p => ({
        _id: p._id,
        title: p.title,
        body: p.body,
        createdAt: p.createdAt,
        authorName: p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Unknown',
      })),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/communities/:id — manager-only edit of community details
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Only the community manager can edit this community' });
    }

    const { name, description, icon, tags, profilePhoto, bannerImage } = req.body;
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
      community.name = name.trim();
    }
    if (description !== undefined) community.description = description.trim();
    if (icon !== undefined) community.icon = icon.trim() || '🌐';
    if (Array.isArray(tags)) {
      community.tags = tags.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim());
    }
    if (profilePhoto !== undefined) community.profilePhoto = profilePhoto;
    if (bannerImage !== undefined) community.bannerImage = bannerImage;

    await community.save();
    res.json({
      _id: community._id,
      name: community.name,
      description: community.description,
      icon: community.icon,
      tags: community.tags,
      profilePhoto: community.profilePhoto,
      bannerImage: community.bannerImage,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/join — instant join (public communities only)
router.post('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (community.isPrivate) {
      return res.status(403).json({ error: 'This is a private community — please request to join' });
    }

    const alreadyMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (!alreadyMember) {
      community.members.push(req.user._id);
      await community.save();
    }
    res.json({ isMember: true, memberCount: community.members.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/request-join — create pending join request (private communities)
router.post('/:id/request-join', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!community.isPrivate) {
      return res.status(400).json({ error: 'This community is public — use join instead' });
    }
    const myId = req.user._id.toString();
    if (community.manager?.toString() === myId
        || community.members.some(m => m.toString() === myId)) {
      return res.status(400).json({ error: 'You are already a member' });
    }
    const already = (community.joinRequests || []).some(r => r.user?.toString() === myId);
    if (!already) {
      community.joinRequests.push({ user: req.user._id });
      await community.save();

      const me = await User.findById(req.user._id).select('firstName lastName');
      const myName = me ? `${me.firstName} ${me.lastName}` : 'A student';
      await notify(
        req.user._id,
        `Request sent for joining ${community.name}.`,
        'community_join_requested'
      );
      if (community.manager) {
        await notify(
          community.manager,
          `${myName} wants to join ${community.name} — check your community.`,
          'community_join_request_received'
        );
      }
    }
    res.status(201).json({ hasRequested: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/accept-join/:userId — manager accepts a pending request
router.post('/:id/accept-join/:userId', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Only the manager can accept join requests' });
    }
    const { userId } = req.params;
    const before = community.joinRequests.length;
    community.joinRequests = community.joinRequests.filter(r => r.user?.toString() !== userId);
    if (community.joinRequests.length === before) {
      return res.status(404).json({ error: 'No pending request for that user' });
    }
    if (!community.members.some(m => m.toString() === userId)) {
      community.members.push(userId);
    }
    await community.save();

    await notify(
      userId,
      `Your request to join ${community.name} was accepted — welcome!`,
      'community_join_accepted'
    );

    res.json({ ok: true, memberCount: community.members.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/reject-join/:userId — manager rejects a pending request
router.post('/:id/reject-join/:userId', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Only the manager can reject join requests' });
    }
    const { userId } = req.params;
    const before = community.joinRequests.length;
    community.joinRequests = community.joinRequests.filter(r => r.user?.toString() !== userId);
    if (community.joinRequests.length === before) {
      return res.status(404).json({ error: 'No pending request for that user' });
    }
    await community.save();

    await notify(
      userId,
      `Your request to join ${community.name} was not accepted this time.`,
      'community_join_rejected'
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/communities/:id/members — manager + all members, with roles
router.get('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('manager', 'firstName lastName department year rollNumber')
      .populate('members', 'firstName lastName department year rollNumber')
      .populate('joinRequests.user', 'firstName lastName department year rollNumber');
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };
    const shape = (u, role) => ({
      _id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      department: u.department,
      year: u.year,
      avatar: DEPT_AVATARS[u.department] || '👤',
      role,
    });

    const members = [];
    if (community.manager) members.push(shape(community.manager, 'manager'));
    community.members.forEach(m => {
      if (!community.manager || m._id.toString() !== community.manager._id.toString()) {
        members.push(shape(m, 'member'));
      }
    });

    const callerIsManager = isManager(community, req.user._id);
    const pendingRequests = callerIsManager
      ? (community.joinRequests || [])
          .filter(r => r.user)
          .map(r => ({
            _id: r.user._id,
            name: `${r.user.firstName} ${r.user.lastName}`,
            department: r.user.department,
            year: r.user.year,
            avatar: DEPT_AVATARS[r.user.department] || '👤',
            requestedAt: r.createdAt,
          }))
      : [];

    res.json({ members, total: members.length, pendingRequests });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/communities/:id/members/:userId — manager removes a member
router.delete('/:id/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Only the community manager can remove members' });
    }
    if (req.params.userId === community.manager.toString()) {
      return res.status(400).json({ error: 'Manager cannot be removed' });
    }

    const before = community.members.length;
    community.members = community.members.filter(m => m.toString() !== req.params.userId);
    if (community.members.length === before) {
      return res.status(404).json({ error: 'User is not a member of this community' });
    }
    await community.save();

    const reason = (req.body?.reason || '').toString().trim();
    const suffix = reason ? ` Reason: ${reason}` : '';
    await notify(
      req.params.userId,
      `You have been removed from ${community.name}.${suffix}`,
      'community_removed'
    );

    res.json({ ok: true, memberCount: community.members.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/promote/:userId — manager promotes a member to manager
router.post('/:id/promote/:userId', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Only the community manager can promote members' });
    }

    const targetId = req.params.userId;
    const oldManagerId = community.manager.toString();

    if (targetId === oldManagerId) {
      return res.status(400).json({ error: 'User is already the manager' });
    }
    const targetIsMember = community.members.some(m => m.toString() === targetId);
    if (!targetIsMember) {
      return res.status(400).json({ error: 'User is not a member of this community' });
    }

    // Project constraint (CLAUDE.md): a student may manage at most one community.
    // If the target already manages a *different* community, surface that with a
    // machine-readable code so the UI can show a structured popup.
    const otherManaged = await Community.findOne({
      manager: targetId,
      _id: { $ne: community._id },
    }).select('name');
    if (otherManaged) {
      return res.status(409).json({
        error: 'ALREADY_COMMUNITY_MANAGER',
        message: `User is already the manager of ${otherManaged.name}`,
        otherCommunityName: otherManaged.name,
      });
    }

    // Swap: target becomes manager (and exits members[]); old manager joins members[].
    community.manager = targetId;
    community.members = community.members.filter(m => m.toString() !== targetId);
    if (!community.members.some(m => m.toString() === oldManagerId)) {
      community.members.push(oldManagerId);
    }
    await community.save();

    await notify(
      targetId,
      `You have been promoted to manager of ${community.name}.`,
      'community_promoted'
    );

    res.json({
      ok: true,
      _id: community._id,
      manager: community.manager,
      memberCount: community.members.length + 1,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Announcements channel ──────────────────────────────────────────────────
router.get('/:id/announcements', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isMemberOrManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Join this community to view announcements' });
    }

    const items = await CommunityAnnouncement.find({ community: community._id })
      .sort({ createdAt: -1 })
      .populate('author', 'firstName lastName');

    res.json(items.map(a => ({
      _id: a._id,
      title: a.title,
      body: a.body,
      createdAt: a.createdAt,
      authorName: a.author ? `${a.author.firstName} ${a.author.lastName}` : 'Manager',
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/announcements', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Only the community manager can post announcements' });
    }

    const { title, body } = req.body;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const a = await CommunityAnnouncement.create({
      community: community._id,
      author: req.user._id,
      title: title.trim(),
      body: body.trim(),
    });

    res.status(201).json({ _id: a._id, title: a.title, body: a.body, createdAt: a.createdAt });
  } catch (err) {
    next(err);
  }
});

// ─── General channel (polled) ───────────────────────────────────────────────
router.get('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isMemberOrManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Join this community to view messages' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const messages = await CommunityMessage.find({ community: community._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'firstName lastName department');
    messages.reverse();

    const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };
    res.json(messages.map(m => ({
      _id: m._id,
      body: m.body,
      createdAt: m.createdAt,
      sender: m.sender ? {
        _id: m.sender._id,
        name: `${m.sender.firstName} ${m.sender.lastName}`,
        avatar: DEPT_AVATARS[m.sender.department] || '👤',
      } : null,
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isMemberOrManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Join this community to post messages' });
    }

    const body = (req.body.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Message body is required' });

    const msg = await CommunityMessage.create({
      community: community._id,
      sender: req.user._id,
      body,
    });
    res.status(201).json({ _id: msg._id, body: msg.body, createdAt: msg.createdAt });
  } catch (err) {
    next(err);
  }
});

// ─── Discussions ────────────────────────────────────────────────────────────
router.get('/:id/discussions', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const threads = await Discussion.find({ community: community._id })
      .sort({ createdAt: -1 })
      .populate('author', 'firstName lastName department');

    const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };
    res.json(threads.map(t => ({
      _id: t._id,
      title: t.title,
      body: t.body,
      upvotes: t.upvotes,
      commentCount: t.comments?.length || 0,
      createdAt: t.createdAt,
      authorName: t.author ? `${t.author.firstName} ${t.author.lastName}` : (t.authorName || 'Anonymous'),
      authorAvatar: t.author ? (DEPT_AVATARS[t.author.department] || '👤') : '👤',
    })));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/discussions/:discussionId', requireAuth, async (req, res, next) => {
  try {
    const thread = await Discussion.findById(req.params.discussionId)
      .populate('author', 'firstName lastName department')
      .populate('comments.author', 'firstName lastName department');
    if (!thread) return res.status(404).json({ error: 'Discussion not found' });

    const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };
    res.json({
      _id: thread._id,
      title: thread.title,
      body: thread.body,
      upvotes: thread.upvotes,
      createdAt: thread.createdAt,
      authorName: thread.author ? `${thread.author.firstName} ${thread.author.lastName}` : (thread.authorName || 'Anonymous'),
      authorAvatar: thread.author ? (DEPT_AVATARS[thread.author.department] || '👤') : '👤',
      comments: (thread.comments || []).map(c => ({
        _id: c._id,
        body: c.body,
        createdAt: c.createdAt,
        authorName: c.author ? `${c.author.firstName} ${c.author.lastName}` : (c.authorName || 'Anonymous'),
        authorAvatar: c.author ? (DEPT_AVATARS[c.author.department] || '👤') : '👤',
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/discussions — member creates a discussion thread
router.post('/:id/discussions', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isMemberOrManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Join this community to post discussions' });
    }
    const { title, body } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!body?.trim()) return res.status(400).json({ error: 'Body is required' });

    const thread = await Discussion.create({
      community: community._id,
      author: req.user._id,
      title: title.trim(),
      body: body.trim(),
      college: community.college,
    });
    res.status(201).json({ _id: thread._id, title: thread.title, createdAt: thread.createdAt });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/discussions/:discussionId/comments — add a comment
router.post('/:id/discussions/:discussionId/comments', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isMemberOrManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Join this community to comment' });
    }
    const body = (req.body.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Comment cannot be empty' });

    const thread = await Discussion.findById(req.params.discussionId);
    if (!thread) return res.status(404).json({ error: 'Discussion not found' });

    thread.comments.push({ author: req.user._id, body });
    await thread.save();
    const added = thread.comments[thread.comments.length - 1];
    res.status(201).json({ _id: added._id, body: added.body, createdAt: added.createdAt });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/discussions/:discussionId/upvote — toggle upvote
router.post('/:id/discussions/:discussionId/upvote', requireAuth, async (req, res, next) => {
  try {
    const thread = await Discussion.findById(req.params.discussionId);
    if (!thread) return res.status(404).json({ error: 'Discussion not found' });
    thread.upvotes = Math.max(0, (thread.upvotes || 0) + 1);
    await thread.save();
    res.json({ upvotes: thread.upvotes });
  } catch (err) {
    next(err);
  }
});

// ─── Collab requests ────────────────────────────────────────────────────────
// Reuses Post model with type='Collab' + community ref so collab posts surface
// on the home feed via the existing /api/posts query.
router.get('/:id/collabs', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const posts = await Post.find({ community: community._id, type: 'Collab' })
      .sort({ createdAt: -1 })
      .populate('author', 'firstName lastName department');

    const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };
    res.json(posts.map(p => ({
      _id: p._id,
      title: p.title,
      description: p.body,
      skills: p.skills || [],
      createdAt: p.createdAt,
      authorId: p.author ? p.author._id : null,
      authorName: p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Anonymous',
      authorAvatar: p.author ? (DEPT_AVATARS[p.author.department] || '👤') : '👤',
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/collabs', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!isMemberOrManager(community, req.user._id)) {
      return res.status(403).json({ error: 'Only community members can post collab requests' });
    }

    const { title, description, skills } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const skillsArr = Array.isArray(skills) ? skills.filter(s => s?.trim()).map(s => s.trim()) : [];

    const post = await Post.create({
      type: 'Collab',
      title: title.trim(),
      body: description.trim(),
      skills: skillsArr,
      author: req.user._id,
      community: community._id,
      tag: 'Other',
      isActive: true,
      college: 'SINHGAD_ENGINEERING',
    });

    res.status(201).json({ _id: post._id, title: post.title, body: post.body, skills: skillsArr });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
