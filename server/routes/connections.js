const router = require('express').Router();
const Connection = require('../models/Connection');
const Post = require('../models/Post');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const { notify } = require('../lib/notify');

// POST /api/connections — send a general OR collab connection request
// Body: { recipientId, type?: 'general' | 'collab', sourcePostId? }
// For collab: pass sourcePostId; recipientId is inferred from the post's author.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { type = 'general', sourcePostId } = req.body;
    let { recipientId } = req.body;
    let sourcePost = null;

    if (type === 'collab') {
      if (!sourcePostId) return res.status(400).json({ error: 'sourcePostId is required for collab connections' });
      sourcePost = await Post.findById(sourcePostId);
      if (!sourcePost) return res.status(404).json({ error: 'Source collab post not found' });
      if (sourcePost.type !== 'Collab') return res.status(400).json({ error: 'Source post must be a Collab post' });
      recipientId = sourcePost.author.toString();
    }

    if (!recipientId) return res.status(400).json({ error: 'recipientId is required' });
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot connect to yourself' });
    }

    const conn = await Connection.create({
      requester: req.user._id,
      recipient: recipientId,
      type,
      status: 'pending',
      sourcePost: sourcePost?._id,
    });

    try {
      if (type === 'collab') {
        await notify(recipientId, 'New connection request on your collab post — check Activity Hub.', 'collab_request_received');
        await notify(req.user._id, 'Collab connection request sent.', 'collab_request_sent');
      } else {
        const sender = await User.findById(req.user._id).select('firstName lastName');
        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Someone';
        await notify(recipientId, `${senderName} wants to connect — check Activity Hub.`, 'connection_received');
      }
    } catch (_e) {}

    res.status(201).json(conn);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Connection request already sent' });
    next(err);
  }
});

// GET /api/connections/status/:userId — connection state between current user and target
router.get('/status/:userId', requireAuth, async (req, res, next) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.user._id.toString()) {
      return res.json({ status: 'self' });
    }

    const [outgoing, incoming] = await Promise.all([
      Connection.findOne({ requester: req.user._id, recipient: targetId }),
      Connection.findOne({ requester: targetId, recipient: req.user._id }),
    ]);

    if (outgoing?.status === 'accepted' || incoming?.status === 'accepted') {
      return res.json({ status: 'connected' });
    }
    if (outgoing?.status === 'pending') return res.json({ status: 'sent' });
    if (incoming?.status === 'pending') return res.json({ status: 'received' });
    return res.json({ status: 'none' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/connections/:id/accept — recipient accepts a pending connection
router.patch('/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const conn = await Connection.findById(req.params.id);
    if (!conn) return res.status(404).json({ error: 'Connection not found' });
    if (conn.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the recipient can accept this request' });
    }
    if (conn.status !== 'pending') {
      return res.status(400).json({ error: 'Connection is not pending' });
    }
    conn.status = 'accepted';
    await conn.save();
    res.json({ _id: conn._id, status: conn.status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
