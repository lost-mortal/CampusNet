const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const Registration = require('../models/Registration');
const Application = require('../models/Application');
const Connection = require('../models/Connection');

// GET /api/activity/me — aggregated activity for the current student
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const me = req.user._id;

    const [regs, apps, collabSent, collabReceived, genSent, genReceived] = await Promise.all([
      // Event tickets
      Registration.find({ registrant: me })
        .sort({ createdAt: -1 })
        .populate({
          path: 'post',
          select: 'title eventDate venue',
          populate: { path: 'club', select: 'name' },
        }),

      // Recruitment applications
      Application.find({ applicant: me })
        .sort({ createdAt: -1 })
        .populate('post', 'title')
        .populate('club', 'name'),

      // Collab connections I initiated (I clicked Connect on someone's post)
      Connection.find({ requester: me, type: 'collab' })
        .sort({ createdAt: -1 })
        .populate('recipient', 'firstName lastName _id')
        .populate({
          path: 'sourcePost',
          select: 'title community',
          populate: { path: 'community', select: 'name' },
        }),

      // Collab connections sent TO me (someone clicked Connect on MY post)
      Connection.find({ recipient: me, type: 'collab' })
        .sort({ createdAt: -1 })
        .populate('requester', 'firstName lastName _id')
        .populate({
          path: 'sourcePost',
          select: 'title community',
          populate: { path: 'community', select: 'name' },
        }),

      // General connections I sent
      Connection.find({ requester: me, type: 'general' })
        .sort({ createdAt: -1 })
        .populate('recipient', 'firstName lastName _id'),

      // General connections sent to me
      Connection.find({ recipient: me, type: 'general' })
        .sort({ createdAt: -1 })
        .populate('requester', 'firstName lastName _id'),
    ]);

    // Paid-event regs awaiting club approval are NOT tickets yet
    const tickets = regs
      .filter(r => r.paymentStatus !== 'pending_verification')
      .map(r => ({
        _id: r._id,
        ticketId: r.ticketId,
        attended: r.attended,
        registeredAt: r.createdAt,
        eventTitle: r.post?.title,
        eventDate: r.post?.eventDate,
        venue: r.post?.venue,
        clubName: r.post?.club?.name,
      }));

    const applications = apps.map(a => ({
      _id: a._id,
      postTitle: a.post?.title,
      clubName: a.club?.name,
      status: a.status,
      appliedAt: a.createdAt,
    }));

    const collabConnections = {
      sent: collabSent.map(c => ({
        _id: c._id,
        status: c.status,
        postTitle: c.sourcePost?.title,
        communityName: c.sourcePost?.community?.name,
        recipient: c.recipient
          ? { _id: c.recipient._id, name: `${c.recipient.firstName} ${c.recipient.lastName}` }
          : null,
        sentAt: c.createdAt,
      })),
      received: collabReceived.map(c => ({
        _id: c._id,
        status: c.status,
        postTitle: c.sourcePost?.title,
        communityName: c.sourcePost?.community?.name,
        requester: c.requester
          ? { _id: c.requester._id, name: `${c.requester.firstName} ${c.requester.lastName}` }
          : null,
        receivedAt: c.createdAt,
      })),
    };

    const generalConnections = {
      sent: genSent.map(c => ({
        _id: c._id,
        status: c.status,
        recipient: c.recipient
          ? { _id: c.recipient._id, name: `${c.recipient.firstName} ${c.recipient.lastName}` }
          : null,
        sentAt: c.createdAt,
      })),
      received: genReceived.map(c => ({
        _id: c._id,
        status: c.status,
        requester: c.requester
          ? { _id: c.requester._id, name: `${c.requester.firstName} ${c.requester.lastName}` }
          : null,
        receivedAt: c.createdAt,
      })),
    };

    res.json({ tickets, applications, collabConnections, generalConnections });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
