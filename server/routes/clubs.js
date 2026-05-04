const router = require('express').Router();
const Club = require('../models/Club');
const Post = require('../models/Post');
const Application = require('../models/Application');
const requireAuth = require('../middleware/auth');

const CLUB_ICONS = {
  'Robotics Club': '🤖', 'GDSC': '💻', 'Music Club': '🎵',
  'AI/ML Club': '🧠', 'Sports Club': '🏅',
};

// GET /api/clubs/my — current user's club data for sidebar
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const club = await Club.findOne({
      $or: [{ president: req.user._id }, { members: req.user._id }],
    });
    if (!club) return res.status(404).json({ error: 'No club found' });

    // Latest recruitment post regardless of active status
    const recruitmentPost = await Post.findOne({ club: club._id, type: 'Recruitment' })
      .sort({ createdAt: -1 });

    // All active event posts sorted by event date
    const eventPosts = await Post.find({ club: club._id, type: 'Event', isActive: true })
      .sort({ eventDate: 1 });

    let recruitmentCount = 0;
    if (recruitmentPost) {
      recruitmentCount = await Application.countDocuments({ post: recruitmentPost._id });
    }

    res.json({
      club: {
        _id: club._id,
        name: club.name,
        logo: CLUB_ICONS[club.name] || '🏆',
        isPresident: club.president.toString() === req.user._id.toString(),
        memberCount: club.members.length,
      },
      recruitment: recruitmentPost ? {
        _id: recruitmentPost._id,
        title: recruitmentPost.title,
        isActive: recruitmentPost.isActive,
        count: recruitmentCount,
      } : null,
      events: eventPosts.map(p => ({
        _id: p._id,
        title: p.title,
        eventDate: p.eventDate,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
