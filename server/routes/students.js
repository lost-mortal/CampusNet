const router = require('express').Router();
const User = require('../models/User');
const Club = require('../models/Club');
const Community = require('../models/Community');
const requireAuth = require('../middleware/auth');

const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };

// GET /api/students/:id — public student profile
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const [clubs, communities] = await Promise.all([
      Club.find({ $or: [{ president: student._id }, { members: student._id }] }, 'name logoEmoji president'),
      Community.find({ $or: [{ manager: student._id }, { members: student._id }] }, 'name icon manager'),
    ]);

    res.json({
      _id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      avatar: DEPT_AVATARS[student.department] || '👤',
      profilePic: student.profilePic || '',
      bannerImage: student.bannerImage || '',
      rollNumber: student.rollNumber,
      department: student.department,
      year: student.year,
      bio: student.bio || '',
      skills: student.skills || [],
      isSelf: student._id.toString() === req.user._id.toString(),
      clubs: clubs.map(c => ({
        _id: c._id,
        name: c.name,
        logoEmoji: c.logoEmoji || '🏆',
        role: c.president && c.president.toString() === student._id.toString() ? 'President' : 'Member',
      })),
      communities: communities.map(c => ({
        _id: c._id,
        name: c.name,
        icon: c.icon || '🌐',
        role: c.manager && c.manager.toString() === student._id.toString() ? 'Manager' : 'Member',
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
