const router = require('express').Router();
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// GET /api/admin/users — all students, no sensitive fields
router.get('/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('firstName lastName email rollNumber department year joinYear createdAt')
      .sort({ year: 1, department: 1, rollNumber: 1 });
    res.json(students);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
