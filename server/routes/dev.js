// TEMP: verification-only route — remove before Phase 1.3 auth goes live
const router = require('express').Router();
const User = require('../models/User');

router.get('/students', async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('firstName lastName email rollNumber department year')
      .sort({ year: 1, department: 1 });
    res.json({ count: students.length, students });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
