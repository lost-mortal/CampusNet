const router = require('express').Router();
const Club = require('../models/Club');
const Post = require('../models/Post');
const Application = require('../models/Application');
const Registration = require('../models/Registration');
const ClubAnnouncement = require('../models/ClubAnnouncement');
const ClubMessage = require('../models/ClubMessage');
const ClubInsight = require('../models/ClubInsight');
const User = require('../models/User');
const { generateClubInsights } = require('../services/gemini');
const requireAuth = require('../middleware/auth');
const { notify } = require('../lib/notify');

const CLUB_ICONS = {
  'Robotics Club': '🤖', 'GDSC': '💻', 'Music Club': '🎵',
  'AI/ML Club': '🧠', 'Sports Club': '🏅',
};
const clubLogo = (club) => club.logoEmoji || CLUB_ICONS[club.name] || '🏆';

const DEPT_EMOJI = { COMP: '💻', ENTC: '⚡', IT: '🌐', MECH: '⚙️' };
function userAvatar(u) { return DEPT_EMOJI[u.department] || '👤'; }
function userName(u) { return `${u.firstName} ${u.lastName}`; }

// Prioritize presidency over membership — defensive against any data drift
// where a president might accidentally appear in another club's members[].
async function findMyClub(userId) {
  const asPres = await Club.findOne({ president: userId });
  if (asPres) return asPres;
  return Club.findOne({ members: userId });
}

function isPresident(club, userId) {
  return club.president.toString() === userId.toString();
}

function isMemberOrPresident(club, userId) {
  const uid = userId.toString();
  return club.president.toString() === uid || club.members.some(m => m.toString() === uid);
}

// ─── GET /api/clubs/my ─── sidebar data
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });

    // Active first, then closed by createdAt desc — so closed posts with pending apps remain
    // accessible to the president even after applications are closed.
    const recruitmentPosts = await Post.find({ club: club._id, type: 'Recruitment' })
      .sort({ isActive: -1, createdAt: -1 });
    const eventPosts = await Post.find({ club: club._id, type: 'Event', isActive: true })
      .sort({ eventDate: 1 });

    const recruitmentIds = recruitmentPosts.map(p => p._id);
    const counts = recruitmentIds.length
      ? await Application.aggregate([
          { $match: { post: { $in: recruitmentIds } } },
          { $group: { _id: { post: '$post', status: '$status' }, n: { $sum: 1 } } },
        ])
      : [];
    const tally = new Map(); // postId -> { total, pending }
    for (const c of counts) {
      const key = c._id.post.toString();
      const cur = tally.get(key) || { total: 0, pending: 0 };
      cur.total += c.n;
      if (c._id.status === 'pending') cur.pending += c.n;
      tally.set(key, cur);
    }

    const activeRecruit = recruitmentPosts.find(p => p.isActive);
    const recruitments = recruitmentPosts.map(p => {
      const t = tally.get(p._id.toString()) || { total: 0, pending: 0 };
      return {
        _id: p._id,
        title: p.title,
        isActive: !!p.isActive,
        count: t.total,
        pendingCount: t.pending,
      };
    });

    res.json({
      club: {
        _id: club._id,
        name: club.name,
        logo: clubLogo(club),
        isPresident: isPresident(club, req.user._id),
        memberCount: club.members.length + 1,
      },
      // Legacy field — points at the active post if any, else the most recent (backward compat)
      recruitment: activeRecruit
        ? recruitments.find(r => r._id.toString() === activeRecruit._id.toString())
        : (recruitments[0] || null),
      recruitments,
      events: await Promise.all(eventPosts.map(async p => ({
        _id: p._id,
        title: p.title,
        eventDate: p.eventDate,
        registrationDeadline: p.registrationDeadline || null,
        isExpired: !!(p.registrationDeadline && new Date(p.registrationDeadline).getTime() < Date.now()),
        approvedPaymentsCount: p.isPaid
          ? await Registration.countDocuments({ post: p._id, paymentStatus: 'approved' })
          : 0,
      }))),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/clubs/my/members ─── member list sidebar
router.get('/my/members', requireAuth, async (req, res, next) => {
  try {
    const base = await findMyClub(req.user._id);
    if (!base) return res.status(404).json({ error: 'No club found' });
    const club = await Club.findById(base._id)
      .populate('president', 'firstName lastName department year')
      .populate('members', 'firstName lastName department year');

    const fmt = (u, role) => ({
      _id: u._id,
      name: userName(u),
      avatar: userAvatar(u),
      role,
      dept: u.department,
      year: u.year,
    });

    const presId = club.president._id.toString();
    res.json([
      fmt(club.president, 'President'),
      // exclude president if they were also added to the members array in seed data
      ...club.members
        .filter(m => m._id.toString() !== presId)
        .map(m => fmt(m, 'Member')),
    ]);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/clubs/my/members/:userId ─── president removes a club member
router.delete('/my/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isPresident(club, req.user._id)) return res.status(403).json({ error: 'President only' });

    const targetId = req.params.userId;
    if (targetId === club.president.toString()) {
      return res.status(400).json({ error: 'President cannot be removed' });
    }

    const before = club.members.length;
    club.members = club.members.filter(m => m.toString() !== targetId);
    if (club.members.length === before) {
      return res.status(404).json({ error: 'User is not a member of this club' });
    }
    await club.save();

    const reason = (req.body?.reason || '').toString().trim();
    const suffix = reason ? ` Reason: ${reason}` : '';
    await notify(
      targetId,
      `You have been removed from ${club.name}.${suffix}`,
      'club_removed'
    );

    res.json({ ok: true, memberCount: club.members.length });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/clubs/my/channels ─── list static + custom channels
router.get('/my/channels', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isMemberOrPresident(club, req.user._id)) return res.status(403).json({ error: 'Not a member' });

    const custom = (club.channels || []).map(name => ({ id: name, name, isStatic: false }));
    res.json([
      { id: 'announcements', name: 'announcements', isStatic: true },
      { id: 'general', name: 'general', isStatic: true },
      ...custom,
    ]);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/clubs/my/channels ─── president creates custom channel
router.post('/my/channels', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isPresident(club, req.user._id)) return res.status(403).json({ error: 'President only' });

    const { name } = req.body;
    const slug = (name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) return res.status(400).json({ error: 'Invalid channel name' });
    if (slug === 'announcements' || slug === 'general') return res.status(409).json({ error: 'Channel already exists' });
    if ((club.channels || []).includes(slug)) return res.status(409).json({ error: 'Channel already exists' });

    club.channels = club.channels || [];
    club.channels.push(slug);
    await club.save();

    res.json({ id: slug, name: slug, isStatic: false });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/clubs/my/announcements ─── list announcements
router.get('/my/announcements', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isMemberOrPresident(club, req.user._id)) return res.status(403).json({ error: 'Not a member' });

    const items = await ClubAnnouncement.find({ club: club._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'firstName lastName department');

    res.json(items.map(a => ({
      _id: a._id,
      body: a.body,
      authorName: userName(a.author),
      authorAvatar: userAvatar(a.author),
      createdAt: a.createdAt,
    })));
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/clubs/my/announcements ─── president posts announcement
router.post('/my/announcements', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isPresident(club, req.user._id)) return res.status(403).json({ error: 'President only' });

    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Body required' });

    const ann = await ClubAnnouncement.create({ club: club._id, author: req.user._id, body: body.trim() });
    await ann.populate('author', 'firstName lastName department');

    res.json({
      _id: ann._id,
      body: ann.body,
      authorName: userName(ann.author),
      authorAvatar: userAvatar(ann.author),
      createdAt: ann.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/clubs/my/channels/:channelId/messages ─── chat messages
router.get('/my/channels/:channelId/messages', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isMemberOrPresident(club, req.user._id)) return res.status(403).json({ error: 'Not a member' });

    const messages = await ClubMessage.find({ club: club._id, channel: req.params.channelId })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('author', 'firstName lastName department');

    res.json(messages.map(m => ({
      _id: m._id,
      body: m.body,
      authorName: userName(m.author),
      authorAvatar: userAvatar(m.author),
      createdAt: m.createdAt,
    })));
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/clubs/my/channels/:channelId/messages ─── send chat message
router.post('/my/channels/:channelId/messages', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isMemberOrPresident(club, req.user._id)) return res.status(403).json({ error: 'Not a member' });

    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Body required' });

    const msg = await ClubMessage.create({
      club: club._id,
      channel: req.params.channelId,
      author: req.user._id,
      body: body.trim(),
    });
    await msg.populate('author', 'firstName lastName department');

    res.json({
      _id: msg._id,
      body: msg.body,
      authorName: userName(msg.author),
      authorAvatar: userAvatar(msg.author),
      createdAt: msg.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/clubs/my/profile ─── president edits club profile
router.patch('/my/profile', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isPresident(club, req.user._id)) return res.status(403).json({ error: 'President only' });

    const allowed = ['description', 'tags', 'logoEmoji', 'profilePhoto', 'bannerImage'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) club[field] = req.body[field];
    }
    await club.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Stats snapshot helper (used by both /my/insights endpoints) ─────────────
function topKey(obj) {
  let best = null, max = -1;
  for (const [k, v] of Object.entries(obj)) {
    if (v > max) { max = v; best = k; }
  }
  return best;
}

function countBy(items, field) {
  return items.reduce((acc, it) => {
    const k = it?.[field] || 'Unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

async function computeClubStatsSnapshot(clubId) {
  const club = await Club.findById(clubId)
    .populate('president', 'firstName lastName department year')
    .populate('members', 'firstName lastName department year');
  if (!club) return null;

  const presId = club.president?._id?.toString();
  const memberDocs = (club.members || []).filter(m => m._id.toString() !== presId);
  const everyone = [club.president, ...memberDocs].filter(Boolean);

  const memberStats = {
    total: everyone.length,
    byDepartment: countBy(everyone, 'department'),
    byYear: countBy(everyone, 'year'),
  };

  // ── Recruitment ────────────────────────────────────────────────────────
  const recruitPosts = await Post.find({ club: clubId, type: 'Recruitment' }).sort({ createdAt: -1 });
  const recruitmentDetails = [];
  let totalApps = 0, totalAccepted = 0, totalRejected = 0, totalPending = 0;
  const recruitDeptTally = {};
  const recruitYearTally = {};

  for (const post of recruitPosts) {
    const apps = await Application.find({ post: post._id }).populate('applicant', 'department year');
    const byDept = {}, byYear = {};
    let accepted = 0, rejected = 0, pending = 0;

    for (const a of apps) {
      const dept = a.applicant?.department || 'Unknown';
      const year = a.applicant?.year || 'Unknown';
      byDept[dept] = (byDept[dept] || 0) + 1;
      byYear[year] = (byYear[year] || 0) + 1;
      recruitDeptTally[dept] = (recruitDeptTally[dept] || 0) + 1;
      recruitYearTally[year] = (recruitYearTally[year] || 0) + 1;
      if (a.status === 'accepted') accepted++;
      else if (a.status === 'rejected') rejected++;
      else pending++;
    }

    totalApps += apps.length;
    totalAccepted += accepted;
    totalRejected += rejected;
    totalPending += pending;

    recruitmentDetails.push({
      title: post.title,
      isActive: !!post.isActive,
      createdAt: post.createdAt,
      totalApplicants: apps.length,
      accepted, rejected, pending,
      byDepartment: byDept,
      byYear,
    });
  }

  // ── Events ────────────────────────────────────────────────────────────
  const eventPosts = await Post.find({ club: clubId, type: 'Event' }).sort({ eventDate: -1 });
  const eventDetails = [];
  let totalRegs = 0, totalAttended = 0, paidRevenue = 0, paidEventsCount = 0;
  let bestEventName = null, bestEventRate = -1;
  const loyaltyByStudent = new Map(); // studentId -> Set(eventIds)
  const now = new Date();

  for (const post of eventPosts) {
    const regs = await Registration.find({ post: post._id }).populate('registrant', 'department year');
    const totalReg = regs.length;
    const attended = regs.filter(r => r.attended).length;
    const approved = regs.filter(r => r.paymentStatus === 'approved').length;
    const isPast = post.eventDate && new Date(post.eventDate) < now;
    const rate = totalReg > 0 ? Math.round((attended / totalReg) * 100) : 0;
    const revenue = post.isPaid && post.amount ? approved * post.amount : 0;

    const byDept = {}, byYear = {};
    for (const r of regs) {
      const dept = r.registrant?.department || 'Unknown';
      const year = r.registrant?.year || 'Unknown';
      byDept[dept] = (byDept[dept] || 0) + 1;
      byYear[year] = (byYear[year] || 0) + 1;
      if (r.registrant?._id) {
        const key = r.registrant._id.toString();
        if (!loyaltyByStudent.has(key)) loyaltyByStudent.set(key, new Set());
        loyaltyByStudent.get(key).add(post._id.toString());
      }
    }

    if (post.isPaid) paidEventsCount++;
    paidRevenue += revenue;
    totalRegs += totalReg;
    totalAttended += attended;
    // Best attended event = highest rate among PAST events with any registrations
    if (isPast && totalReg > 0 && rate > bestEventRate) {
      bestEventName = post.title;
      bestEventRate = rate;
    }

    eventDetails.push({
      title: post.title,
      description: post.body || '',
      date: post.eventDate,
      isPaid: !!post.isPaid,
      amount: post.amount || 0,
      totalRegistered: totalReg,
      totalAttended: attended,
      attendanceRate: rate,
      revenue,
      byDepartment: byDept,
      byYear,
    });
  }

  const avgAttendanceRate = totalRegs > 0 ? Math.round((totalAttended / totalRegs) * 100) : 0;
  const studentsWith2Plus = [...loyaltyByStudent.values()].filter(s => s.size >= 2).length;
  const totalUniqueAttendees = loyaltyByStudent.size;
  const loyaltyRate = totalUniqueAttendees > 0 ? Math.round((studentsWith2Plus / totalUniqueAttendees) * 100) : 0;

  return {
    club: { name: club.name, tags: club.tags || [], description: club.description || '' },
    members: memberStats,
    recruitment: recruitmentDetails,
    recruitmentTotals: {
      totalApplications: totalApps,
      accepted: totalAccepted,
      rejected: totalRejected,
      pending: totalPending,
      acceptanceRate: totalApps > 0 ? Math.round((totalAccepted / totalApps) * 100) : 0,
      topDepartment: topKey(recruitDeptTally),
      topYear: topKey(recruitYearTally),
    },
    events: eventDetails,
    eventTotals: {
      totalEvents: eventDetails.length,
      totalRegistrations: totalRegs,
      totalAttended,
      avgAttendanceRate,
      paidEvents: paidEventsCount,
      paidRevenue,
      bestAttendedEvent: bestEventName ? { name: bestEventName, attendanceRate: bestEventRate } : null,
    },
    loyalty: {
      studentsWith2PlusEvents: studentsWith2Plus,
      totalUniqueAttendees,
      loyaltyRate,
    },
  };
}

function safeParseInsight(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

// ─── GET /api/clubs/my/insights ─── live snapshot + saved Gemini insight (if any)
router.get('/my/insights', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });

    const snapshot = await computeClubStatsSnapshot(club._id);
    const saved = await ClubInsight.findOne({ clubId: club._id });
    const presidentFlag = isPresident(club, req.user._id);

    if (!saved) {
      return res.json({ exists: false, snapshot, isPresident: presidentFlag });
    }

    res.json({
      exists: true,
      snapshot,
      isPresident: presidentFlag,
      generatedAt: saved.generatedAt,
      insight: safeParseInsight(saved.insightText),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/clubs/my/insights/generate ─── president regenerates insight via Gemini
router.post('/my/insights/generate', requireAuth, async (req, res, next) => {
  try {
    const club = await findMyClub(req.user._id);
    if (!club) return res.status(404).json({ error: 'No club found' });
    if (!isPresident(club, req.user._id)) return res.status(403).json({ error: 'President only' });

    const snapshot = await computeClubStatsSnapshot(club._id);
    const insight = await generateClubInsights(snapshot);

    const doc = await ClubInsight.findOneAndUpdate(
      { clubId: club._id },
      {
        clubId: club._id,
        generatedAt: new Date(),
        statsSnapshot: snapshot,
        insightText: JSON.stringify(insight),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      exists: true,
      snapshot,
      isPresident: true,
      generatedAt: doc.generatedAt,
      insight,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/clubs/:id ─── public club profile
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id).populate('president', 'firstName lastName rollNumber');
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const now = new Date();
    const [activeRecruitment, upcomingEvents, recentPosts] = await Promise.all([
      Post.findOne({ club: club._id, type: 'Recruitment', isActive: true }).sort({ createdAt: -1 }),
      Post.find({ club: club._id, type: 'Event', eventDate: { $gte: now } }).sort({ eventDate: 1 }).limit(10),
      Post.find({ club: club._id, type: 'General' }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      _id: club._id,
      name: club.name,
      logoEmoji: clubLogo(club),
      profilePhoto: club.profilePhoto || '',
      bannerImage: club.bannerImage || '',
      description: club.description || '',
      tags: club.tags || [],
      memberCount: club.members.length + 1,
      president: club.president ? {
        _id: club.president._id,
        name: `${club.president.firstName} ${club.president.lastName}`,
        rollNumber: club.president.rollNumber,
      } : null,
      activeRecruitment: activeRecruitment ? {
        _id: activeRecruitment._id,
        title: activeRecruitment.title,
        body: activeRecruitment.body,
      } : null,
      upcomingEvents: upcomingEvents.map(e => ({
        _id: e._id,
        title: e.title,
        body: e.body,
        eventDate: e.eventDate,
        venue: e.venue,
        image: e.image || null,
      })),
      recentPosts: recentPosts.map(p => ({
        _id: p._id,
        title: p.title,
        body: p.body,
        image: p.image || null,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
