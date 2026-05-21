const router = require('express').Router();
const Post = require('../models/Post');
const Club = require('../models/Club');
const Application = require('../models/Application');
const requireAuth = require('../middleware/auth');
const { notify } = require('../lib/notify');

// POST /api/posts/:id/apply
router.post('/posts/:id/apply', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.type !== 'Recruitment') {
      return res.status(404).json({ error: 'Recruitment post not found' });
    }
    if (!post.isActive) return res.status(400).json({ error: 'Applications are closed' });
    if (post.registrationDeadline && new Date() > new Date(post.registrationDeadline)) {
      return res.status(400).json({ error: 'Application deadline has passed' });
    }

    const existingClub = await Club.findOne({
      $or: [{ president: req.user._id }, { members: req.user._id }],
    });
    if (existingClub) {
      return res.status(400).json({ error: `You are already a member of ${existingClub.name}` });
    }

    const application = await Application.create({
      post: post._id,
      applicant: req.user._id,
      club: post.club,
    });

    try {
      const club = await Club.findById(post.club).select('name');
      await notify(req.user._id, `You applied to ${club?.name || 'the club'} — good luck!`, 'recruitment_applied');
    } catch (_e) {}

    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'You have already applied' });
    next(err);
  }
});

// GET /api/posts/:id/applicants — any club member (read) or president (accept/reject)
router.get('/posts/:id/applicants', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('club');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const uid = req.user._id.toString();
    const isPresident = post.club.president.toString() === uid;
    const isMember = post.club.members.some(m => m.toString() === uid);
    if (!isPresident && !isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const applications = await Application.find({ post: post._id })
      .populate('applicant', 'firstName lastName rollNumber department year')
      .sort({ createdAt: -1 });

    const byDept = {};
    const byYear = {};
    for (const app of applications) {
      const { department, year } = app.applicant;
      byDept[department] = (byDept[department] || 0) + 1;
      byYear[year] = (byYear[year] || 0) + 1;
    }

    res.json({
      post: { title: post.title, isActive: post.isActive },
      applications: applications.map(a => ({
        _id: a._id,
        status: a.status,
        appliedAt: a.createdAt,
        applicant: {
          _id: a.applicant._id,
          name: `${a.applicant.firstName} ${a.applicant.lastName}`,
          rollNumber: a.applicant.rollNumber,
          department: a.applicant.department,
          year: a.applicant.year,
        },
      })),
      aggregation: { byDept, byYear },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/accept — president only
router.patch('/applications/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate({
      path: 'post',
      populate: { path: 'club' },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (application.post.club.president.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    application.status = 'accepted';
    await application.save();

    await Club.findByIdAndUpdate(application.club, {
      $addToSet: { members: application.applicant },
    });

    // Remove this student's pending applications to any other clubs
    await Application.deleteMany({
      applicant: application.applicant,
      club: { $ne: application.club },
      status: 'pending',
    });

    try {
      const clubName = application.post?.club?.name || 'the club';
      await notify(application.applicant, `Your application to ${clubName} was accepted — welcome to the club!`, 'recruitment_accepted');
    } catch (_e) {}

    res.json({ _id: application._id, status: application.status });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/reject — president only
router.patch('/applications/:id/reject', requireAuth, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate({
      path: 'post',
      populate: { path: 'club' },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (application.post.club.president.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    application.status = 'rejected';
    await application.save();

    try {
      const clubName = application.post?.club?.name || 'the club';
      await notify(application.applicant, `Your application to ${clubName} was not accepted this time.`, 'recruitment_rejected');
    } catch (_e) {}

    res.json({ _id: application._id, status: application.status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
