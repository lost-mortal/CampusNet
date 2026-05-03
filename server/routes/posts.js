const router = require('express').Router();
const Post = require('../models/Post');
require('../models/Club');       // must be imported so Mongoose can populate refs
require('../models/Community');  // must be imported so Mongoose can populate refs
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
      tag: p.tag,
      isActive: p.isActive,
      createdAt: p.createdAt,
      // Club posts
      clubName: p.club?.name || null,
      clubLogo: p.club ? (CLUB_ICONS[p.club.name] || '🏆') : null,
      // Event fields
      date: p.eventDate || p.createdAt,
      location: p.venue || null,
      paymentConfig: p.paymentConfig,
      // Community/collab fields
      communityName: p.community?.name || null,
      authorName: p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Unknown',
    }));

    res.json(shaped);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
