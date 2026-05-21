const router = require('express').Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const { hasAcceptedConnection } = require('../utils/chat');

const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };

// GET /api/messages/conversations — list all chats with last preview
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user._id);

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: me }, { receiver: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$roomId',
          lastBody: { $first: '$body' },
          lastAt: { $first: '$createdAt' },
          lastSender: { $first: '$sender' },
          otherUser: {
            $first: {
              $cond: [{ $eq: ['$sender', me] }, '$receiver', '$sender'],
            },
          },
        },
      },
      { $sort: { lastAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'otherUser',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          roomId: '$_id',
          otherUserId: '$user._id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          department: '$user.department',
          year: '$user.year',
          lastBody: 1,
          lastAt: 1,
          lastFromMe: { $eq: ['$lastSender', me] },
        },
      },
    ]);

    const enriched = conversations.map(c => ({
      ...c,
      avatar: DEPT_AVATARS[c.department] || '👤',
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// GET /api/messages/with/:userId — connection gate check + other user's name/avatar
// Used by frontend when opening a thread via ?with=<userId> deep-link
router.get('/with/:userId', requireAuth, async (req, res, next) => {
  try {
    const otherId = req.params.userId;
    if (otherId === String(req.user._id)) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }
    const allowed = await hasAcceptedConnection(req.user._id, otherId);
    if (!allowed) {
      return res.status(403).json({ error: 'You need to connect first', connected: false });
    }
    const other = await User.findById(otherId).select('firstName lastName department year').lean();
    if (!other) return res.status(404).json({ error: 'User not found' });

    res.json({
      connected: true,
      otherUserId: other._id,
      name: `${other.firstName} ${other.lastName}`,
      department: other.department,
      year: other.year,
      avatar: DEPT_AVATARS[other.department] || '👤',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
