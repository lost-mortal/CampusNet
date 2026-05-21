const router = require('express').Router();
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

// GET /api/notifications/me — newest first
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const notifs = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifs);
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/unread-counts — { notifications, announcements }
router.get('/unread-counts', requireAuth, async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id).select('department year lastAnnouncementsReadAt role');
    const notifCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    let announcementCount = 0;
    if (student && student.role === 'student') {
      const filter = {
        college: 'SINHGAD_ENGINEERING',
        $and: [
          { $or: [{ targetDepartments: 'ALL' }, { targetDepartments: student.department }] },
          { $or: [{ targetYears: 'ALL' }, { targetYears: student.year }] },
        ],
      };
      if (student.lastAnnouncementsReadAt) {
        filter.createdAt = { $gt: student.lastAnnouncementsReadAt };
      }
      announcementCount = await Announcement.countDocuments(filter);
    }

    res.json({ notifications: notifCount, announcements: announcementCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/mark-read — marks ALL notifications for current user as read
router.patch('/mark-read', requireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/announcements-read — bump lastAnnouncementsReadAt to now
router.patch('/announcements-read', requireAuth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { lastAnnouncementsReadAt: new Date() } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Helper for other routes — fire-and-forget; never throws
async function notify(recipientId, message, type = 'generic') {
  try {
    if (!recipientId || !message) return;
    await Notification.create({ recipient: recipientId, message, type });
  } catch (_err) {
    // silent
  }
}

router.notify = notify;
module.exports = router;
