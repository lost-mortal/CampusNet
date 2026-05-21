const router = require('express').Router();
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

// GET /api/announcements/me — announcements targeted to the current student
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id).select('department year');
    if (!student) return res.status(404).json({ error: 'User not found' });
    const { department, year } = student;
    const announcements = await Announcement.find({
      college: 'SINHGAD_ENGINEERING',
      $and: [
        { $or: [{ targetDepartments: 'ALL' }, { targetDepartments: department }] },
        { $or: [{ targetYears: 'ALL' }, { targetYears: year }] },
      ],
    }).sort({ createdAt: -1 }).limit(50);
    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
