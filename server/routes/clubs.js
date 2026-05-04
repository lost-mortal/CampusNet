const router = require('express').Router();
const Club = require('../models/Club');
const Post = require('../models/Post');
const Application = require('../models/Application');
const requireAuth = require('../middleware/auth');

const CLUB_ICONS = {
  'Robotics Club': '🤖', 'GDSC': '💻', 'Music Club': '🎵',
  'AI/ML Club': '🧠', 'Sports Club': '🏅',
};

// GET /api/clubs/my — current user's club + active posts (for sidebar)
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const club = await Club.findOne({
      $or: [{ president: req.user._id }, { members: req.user._id }],
    });
    if (!club) return res.status(404).json({ error: 'No club found' });

    const posts = await Post.find({ club: club._id, isActive: true }).sort({ createdAt: -1 });

    const postsWithCounts = await Promise.all(posts.map(async p => {
      const count = p.type === 'Recruitment'
        ? await Application.countDocuments({ post: p._id })
        : 0;
      return { _id: p._id, type: p.type.toLowerCase(), title: p.title, count };
    }));

    res.json({
      club: {
        _id: club._id,
        name: club.name,
        logo: CLUB_ICONS[club.name] || '🏆',
        isPresident: club.president.toString() === req.user._id.toString(),
        memberCount: club.members.length,
      },
      posts: postsWithCounts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
