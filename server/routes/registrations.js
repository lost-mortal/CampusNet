const router = require('express').Router();
const crypto = require('crypto');
const Registration = require('../models/Registration');
const Post = require('../models/Post');
const Club = require('../models/Club');
const requireAuth = require('../middleware/auth');
const { notify } = require('../lib/notify');

// POST /api/registrations — student registers for an event
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { postId, paymentScreenshot } = req.body;
    if (!postId) return res.status(400).json({ error: 'postId is required' });

    const post = await Post.findById(postId).populate('club');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.type !== 'Event') return res.status(400).json({ error: 'This post is not an event' });

    if (post.registrationDeadline && new Date() > new Date(post.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    const existing = await Registration.findOne({ post: postId, registrant: req.user._id });
    if (existing) return res.status(409).json({ error: 'You have already registered for this event' });

    if (post.isPaid) {
      if (!paymentScreenshot) {
        return res.status(400).json({ error: 'Payment screenshot is required for paid events' });
      }
      const reg = await Registration.create({
        post: postId,
        registrant: req.user._id,
        club: post.club?._id,
        // No ticketId — issued after a club member approves payment
        paymentStatus: 'pending_verification',
        paymentScreenshot,
        college: 'SINHGAD_ENGINEERING',
      });
      try {
        await notify(req.user._id, `Registration submitted for ${post.title} — pending payment verification.`, 'event_registered_paid');
      } catch (_e) {}
      return res.status(201).json(reg);
    }

    const reg = await Registration.create({
      post: postId,
      registrant: req.user._id,
      club: post.club?._id,
      ticketId: crypto.randomUUID(),
      paymentStatus: 'free',
      college: 'SINHGAD_ENGINEERING',
    });
    try {
      await notify(req.user._id, `You're registered for ${post.title}! Check Activity Hub for your ticket.`, 'event_registered_free');
    } catch (_e) {}
    res.status(201).json(reg);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'You have already registered for this event' });
    next(err);
  }
});

// PATCH /api/registrations/:id/approve-payment — any club member or the president can approve
router.patch('/:id/approve-payment', requireAuth, async (req, res, next) => {
  try {
    const reg = await Registration.findById(req.params.id)
      .populate({ path: 'post', select: 'club', populate: { path: 'club', select: 'president members' } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    const club = reg.post?.club;
    if (!club) return res.status(500).json({ error: 'Club data missing' });

    const uid = req.user._id.toString();
    const isPresident = club.president.toString() === uid;
    const isMember = club.members.some(m => m.toString() === uid);
    if (!isPresident && !isMember) {
      return res.status(403).json({ error: 'Only club members can approve payments' });
    }

    if (reg.paymentStatus === 'approved') {
      return res.json({ _id: reg._id, paymentStatus: reg.paymentStatus, ticketId: reg.ticketId });
    }
    if (reg.paymentStatus !== 'pending_verification') {
      return res.status(400).json({ error: 'Registration is not awaiting payment verification' });
    }

    reg.paymentStatus = 'approved';
    // Ticket is generated at approval time, not at registration time
    if (!reg.ticketId) reg.ticketId = crypto.randomUUID();
    await reg.save();

    try {
      const fullPost = await Post.findById(reg.post).select('title');
      await notify(reg.registrant, `Your payment for ${fullPost?.title || 'the event'} was approved! Check Activity Hub for your ticket.`, 'payment_approved');
    } catch (_e) {}

    res.json({ _id: reg._id, paymentStatus: reg.paymentStatus, ticketId: reg.ticketId });
  } catch (err) {
    next(err);
  }
});

// GET /api/registrations/my — current student's own registrations with ticket data
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const regs = await Registration.find({ registrant: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'post',
        select: 'title eventDate venue club',
        populate: { path: 'club', select: 'name' },
      });

    res.json(regs.map(r => ({
      _id: r._id,
      ticketId: r.ticketId,
      attended: r.attended,
      registeredAt: r.createdAt,
      eventTitle: r.post?.title,
      eventDate: r.post?.eventDate,
      venue: r.post?.venue,
      clubName: r.post?.club?.name,
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/registrations/event/:postId — all registrants for an event (club member or president)
router.get('/event/:postId', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId).populate('club');
    if (!post) return res.status(404).json({ error: 'Event not found' });
    if (post.type !== 'Event') return res.status(400).json({ error: 'Post is not an event' });

    const club = post.club;
    const isPresident = club.president.toString() === req.user._id.toString();
    const isMember = club.members.some(m => m.toString() === req.user._id.toString());
    if (!isPresident && !isMember) {
      return res.status(403).json({ error: 'Only club members can view event registrations' });
    }

    const regs = await Registration.find({ post: req.params.postId })
      .populate('registrant', 'firstName lastName rollNumber department year');

    const registrants = regs.map(r => ({
      _id: r._id,
      name: `${r.registrant.firstName} ${r.registrant.lastName}`,
      rollNumber: r.registrant.rollNumber,
      department: r.registrant.department,
      year: r.registrant.year,
      attended: r.attended,
      paymentStatus: r.paymentStatus,
      paymentScreenshot: r.paymentScreenshot || null,
    }));

    const totalRegistered = registrants.length;
    const totalAttended = registrants.filter(r => r.attended).length;

    res.json({
      eventTitle: post.title,
      eventDate: post.eventDate,
      isPaid: !!post.isPaid,
      amount: post.amount || 0,
      clubName: club.name,
      totalRegistered,
      totalAttended,
      totalNoShow: totalRegistered - totalAttended,
      registrants,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/registrations/:id/reject-payment — any club member; only valid while pending
router.delete('/:id/reject-payment', requireAuth, async (req, res, next) => {
  try {
    const reg = await Registration.findById(req.params.id)
      .populate({ path: 'post', select: 'club', populate: { path: 'club', select: 'president members' } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    const club = reg.post?.club;
    if (!club) return res.status(500).json({ error: 'Club data missing' });

    const uid = req.user._id.toString();
    const isPresident = club.president.toString() === uid;
    const isMember = club.members.some(m => m.toString() === uid);
    if (!isPresident && !isMember) {
      return res.status(403).json({ error: 'Only club members can reject payments' });
    }

    if (reg.paymentStatus !== 'pending_verification') {
      return res.status(400).json({ error: 'Only pending registrations can be rejected' });
    }

    const registrantId = reg.registrant;
    const postIdForNotif = reg.post?._id || reg.post;
    await reg.deleteOne();

    try {
      const fullPost = await Post.findById(postIdForNotif).select('title');
      await notify(registrantId, `Your payment for ${fullPost?.title || 'the event'} was not verified — please contact the club.`, 'payment_rejected');
    } catch (_e) {}

    res.json({ _id: req.params.id, rejected: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/registrations/scan — mark attendance by ticketId (club member or president)
router.post('/scan', requireAuth, async (req, res, next) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId?.trim()) return res.status(400).json({ error: 'ticketId is required' });

    const reg = await Registration.findOne({ ticketId: ticketId.trim() })
      .populate('registrant', 'firstName lastName rollNumber')
      .populate({ path: 'post', select: 'club', populate: { path: 'club', select: 'president members' } });

    if (!reg) return res.status(404).json({ error: 'No ticket found with this ID' });

    const club = reg.post?.club;
    if (!club) return res.status(500).json({ error: 'Club data missing' });

    const isPresident = club.president.toString() === req.user._id.toString();
    const isMember = club.members.some(m => m.toString() === req.user._id.toString());
    if (!isPresident && !isMember) {
      return res.status(403).json({ error: 'Not authorized to scan tickets for this event' });
    }

    if (reg.attended) {
      return res.json({
        alreadyAttended: true,
        message: 'Already marked present',
        name: `${reg.registrant.firstName} ${reg.registrant.lastName}`,
        rollNumber: reg.registrant.rollNumber,
      });
    }

    reg.attended = true;
    reg.attendedAt = new Date();
    await reg.save();

    try {
      const fullPost = await Post.findById(reg.post?._id || reg.post).select('title');
      await notify(reg.registrant._id || reg.registrant, `Your attendance for ${fullPost?.title || 'the event'} has been marked — check Activity Hub.`, 'attendance_marked');
    } catch (_e) {}

    res.json({
      alreadyAttended: false,
      message: 'Marked present',
      name: `${reg.registrant.firstName} ${reg.registrant.lastName}`,
      rollNumber: reg.registrant.rollNumber,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
