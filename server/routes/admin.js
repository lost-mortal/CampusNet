const router = require('express').Router();
const User = require('../models/User');
const Club = require('../models/Club');
const Community = require('../models/Community');
const Announcement = require('../models/Announcement');
const Post = require('../models/Post');
const Registration = require('../models/Registration');
const Connection = require('../models/Connection');
const Application = require('../models/Application');
const ClubInsight = require('../models/ClubInsight');
const CommunityInsight = require('../models/CommunityInsight');
const AdminProfile = require('../models/AdminProfile');
const { generateCommunityInsights } = require('../services/gemini');
const requireAuth = require('../middleware/auth');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const { uniqueEmail, parseJoinYear } = require('../utils/studentIdentity');

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// ─── USERS ───────────────────────────────────────────────────────────────────

router.get('/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student', year: { $ne: 'Alumni' } })
      .select('firstName lastName email rollNumber department year joinYear phone createdAt isRestricted restrictionReason')
      .sort({ year: 1, department: 1, rollNumber: 1 });
    res.json(students);
  } catch (err) {
    next(err);
  }
});

// Alumni — graduated students (year === 'Alumni'), kept out of the active directory.
router.get('/alumni', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const alumni = await User.find({ role: 'student', year: 'Alumni' })
      .select('firstName lastName email rollNumber department year joinYear phone createdAt isRestricted restrictionReason')
      .sort({ joinYear: 1, department: 1, rollNumber: 1 });
    res.json(alumni);
  } catch (err) {
    next(err);
  }
});

// ─── BULK IMPORT ─────────────────────────────────────────────────────────────

const HEADER_MAP = {
  firstname: 'firstName', first_name: 'firstName',
  lastname: 'lastName', last_name: 'lastName',
  name: 'name', fullname: 'name',
  rollnumber: 'rollNumber', rollno: 'rollNumber', roll: 'rollNumber',
  department: 'department', dept: 'department',
  year: 'year',
  mothername: 'motherName', mothersname: 'motherName',
  birthdate: 'birthDate', dateofbirth: 'birthDate', dob: 'birthDate',
  phone: 'phone', phonenumber: 'phone', mobile: 'phone', mobileno: 'phone', contact: 'phone',
  email: 'email', emailid: 'email', mail: 'email',
};

// 10-digit Indian mobile, tolerant of +91 / leading 0 / spaces / dashes.
function normPhone(raw) {
  let d = String(raw || '').replace(/[^0-9]/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}
function formatPhone(d) {
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
const SINHGAD_EMAIL = /^[a-z0-9._%+-]+@sinhgad\.edu$/i;

function normalizeHeader(key) {
  return key.toLowerCase().replace(/[^a-z]/g, '');
}

router.post('/import-students', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { fileData } = req.body;
    if (!fileData) return res.status(400).json({ error: 'No file data' });

    const buffer = Buffer.from(fileData, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawRows.length === 0) return res.status(400).json({ error: 'File is empty or has no data rows' });

    // Normalize column names
    const rows = rawRows.map(raw => {
      const norm = {};
      for (const key of Object.keys(raw)) {
        const mapped = HEADER_MAP[normalizeHeader(key)];
        if (mapped) norm[mapped] = String(raw[key]).trim();
      }
      return norm;
    });

    const VALID_DEPTS = new Set(['COMP', 'ENTC', 'IT', 'MECH']);
    const VALID_YEARS = new Set(['FE', 'SE', 'TE', 'BE']);

    // mode 'provided' = college supplies the email column; 'generated' = we build it.
    const mode = req.body.mode === 'provided' ? 'provided' : 'generated';

    const errors = [];
    const validRows = [];
    const fileRollNumbers = new Set();
    const fileEmails = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = { ...rows[i] };
      const rowNum = i + 2; // +1 for header, +1 for 1-index

      // Split "name" field into firstName / lastName
      if (row.name && !row.firstName) {
        const parts = row.name.split(/\s+/);
        row.firstName = parts[0] || '';
        row.lastName = parts.slice(1).join(' ');
      }

      const rn = row.rollNumber || '';
      const label = rn ? `Row ${rowNum} (${rn})` : `Row ${rowNum}`;
      let bad = false;

      if (!row.firstName)  { errors.push(`${label}: Missing First Name`); bad = true; }
      if (!row.lastName)   { errors.push(`${label}: Missing Last Name`); bad = true; }
      if (!rn)             { errors.push(`Row ${rowNum}: Missing Roll Number`); bad = true; }

      const dept = (row.department || '').toUpperCase();
      if (!dept)           { errors.push(`${label}: Missing Department`); bad = true; }
      else if (!VALID_DEPTS.has(dept)) {
        errors.push(`${label}: Invalid Department "${row.department}" — must be COMP, ENTC, IT or MECH`); bad = true;
      }

      const yr = (row.year || '').toUpperCase();
      if (!yr)             { errors.push(`${label}: Missing Year`); bad = true; }
      else if (!VALID_YEARS.has(yr)) {
        errors.push(`${label}: Invalid Year "${row.year}" — must be FE, SE, TE or BE`); bad = true;
      }

      if (!row.motherName) { errors.push(`${label}: Missing Mother's Name`); bad = true; }

      // birthDate: strip non-digits, must be 6 digits (DDMMYY)
      const bd = (row.birthDate || '').toString().replace(/[^0-9]/g, '');
      if (!bd)             { errors.push(`${label}: Missing Birth Date`); bad = true; }
      else if (bd.length !== 6) {
        errors.push(`${label}: Birth Date must be 6 digits DDMMYY (got "${row.birthDate}")`); bad = true;
      }

      // phone: required in BOTH modes
      const phoneDigits = normPhone(row.phone);
      if (!row.phone)      { errors.push(`${label}: Missing Phone`); bad = true; }
      else if (!(phoneDigits.length === 10 && /^[6-9]/.test(phoneDigits))) {
        errors.push(`${label}: Invalid Phone "${row.phone}" — must be a 10-digit Indian mobile`); bad = true;
      }

      // email: required + validated only in 'provided' mode
      let emailLower = '';
      if (mode === 'provided') {
        const em = (row.email || '').trim();
        if (!em)                       { errors.push(`${label}: Missing Email`); bad = true; }
        else if (!SINHGAD_EMAIL.test(em)) {
          errors.push(`${label}: Invalid Email "${row.email}" — must be a @sinhgad.edu address`); bad = true;
        } else emailLower = em.toLowerCase();
      }

      if (bad) continue;

      const rnLower = rn.toLowerCase();
      if (fileRollNumbers.has(rnLower)) {
        errors.push(`${label}: Duplicate roll number within the file`);
        continue;
      }
      if (mode === 'provided' && fileEmails.has(emailLower)) {
        errors.push(`${label}: Duplicate email within the file`);
        continue;
      }
      fileRollNumbers.add(rnLower);
      if (emailLower) fileEmails.add(emailLower);
      validRows.push({
        ...row, department: dept, year: yr, birthDate: bd,
        rollNumber: rnLower, phone: formatPhone(phoneDigits), email: emailLower, rowNum,
      });
    }

    // DB duplicate roll-number check (rows that passed local validation)
    if (validRows.length > 0) {
      const existing = await User.find({
        rollNumber: { $in: validRows.map(r => r.rollNumber) },
      }).select('rollNumber');
      const existingSet = new Set(existing.map(u => u.rollNumber));
      validRows.forEach(r => {
        if (existingSet.has(r.rollNumber))
          errors.push(`Row ${r.rowNum} (${r.rollNumber}): Duplicate roll number — already exists in DB`);
      });
    }

    // DB duplicate email check (provided mode) — case-insensitive (emails stored lowercase)
    if (mode === 'provided' && validRows.length > 0) {
      const lowers = validRows.map(r => r.email).filter(Boolean);
      const existingE = await User.find({ email: { $in: lowers } }).select('email');
      const eSet = new Set(existingE.map(u => (u.email || '').toLowerCase()));
      validRows.forEach(r => {
        if (r.email && eSet.has(r.email))
          errors.push(`Row ${r.rowNum} (${r.rollNumber}): Email ${r.email} already exists`);
      });
    }

    if (errors.length > 0) return res.status(422).json({ errors });

    // Resolve emails. Generated mode draws unique random codes against all existing
    // emails + the rest of this batch.
    let emails;
    if (mode === 'provided') {
      emails = validRows.map(r => r.email);
    } else {
      const allEmails = await User.find({}).select('email').lean();
      const taken = new Set(allEmails.map(u => (u.email || '').toLowerCase()));
      emails = validRows.map(r => uniqueEmail(r.firstName, parseJoinYear(r.rollNumber), taken));
    }

    // All clear — create accounts
    const toCreate = await Promise.all(validRows.map(async (row, idx) => {
      const joinYear = parseJoinYear(row.rollNumber);
      const password = `${row.motherName.toLowerCase()}@${row.birthDate}`;
      const passwordHash = await bcrypt.hash(password, 10);
      return {
        rollNumber: row.rollNumber,
        email: emails[idx],
        passwordHash,
        firstName: row.firstName,
        lastName: row.lastName,
        role: 'student',
        department: row.department,
        year: row.year,
        joinYear,
        phone: row.phone,
        motherName: row.motherName,
        birthDate: row.birthDate,
        mustChangePassword: true,
        college: 'SINHGAD_ENGINEERING',
      };
    }));

    await User.insertMany(toCreate);
    res.json({ imported: toCreate.length, mode });
  } catch (err) {
    next(err);
  }
});

// ─── ACADEMIC YEAR ROLLOVER ──────────────────────────────────────────────────
// Promote every student one study-year: FE→SE→TE→BE→Alumni. Only `year` and the
// roll-number prefix (fe→se→te→be→al) change; joinYear / department / numeric roll
// / email / password are untouched. Alumni are the final state and are skipped.
router.post('/advance-year', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const NEXT_YEAR = { FE: 'SE', SE: 'TE', TE: 'BE', BE: 'Alumni' };
    const NEXT_PREFIX = { FE: 'se', SE: 'te', TE: 'be', BE: 'al' };

    const students = await User.find({
      role: 'student',
      year: { $in: ['FE', 'SE', 'TE', 'BE'] },
    }).select('rollNumber year');

    const ops = [];
    let promoted = 0, graduated = 0;
    for (const s of students) {
      const next = NEXT_YEAR[s.year];
      if (!next) continue;
      const set = { year: next };
      if (s.rollNumber && s.rollNumber.length >= 2) {
        set.rollNumber = NEXT_PREFIX[s.year] + s.rollNumber.slice(2);
      }
      ops.push({ updateOne: { filter: { _id: s._id }, update: { $set: set } } });
      if (next === 'Alumni') graduated++; else promoted++;
    }

    if (ops.length) await User.bulkWrite(ops);
    res.json({ ok: true, promoted, graduated, total: ops.length });
  } catch (err) {
    next(err);
  }
});

// ─── CLUBS ───────────────────────────────────────────────────────────────────

router.get('/clubs', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const clubs = await Club.find({ college: 'SINHGAD_ENGINEERING' })
      .populate('president', 'firstName lastName rollNumber department year')
      .sort({ name: 1 });
    res.json(clubs.map(c => {
      // De-dupe: seeded data stores the president inside members[] too,
      // so counting unique IDs across president + members is the only safe way.
      const presId = c.president?._id?.toString();
      const uniqueIds = new Set((c.members || []).map(m => m.toString()));
      if (presId) uniqueIds.add(presId);
      const memberIds = (c.members || [])
        .map(m => m.toString())
        .filter(id => id !== presId);
      return {
        _id: c._id,
        name: c.name,
        logoEmoji: c.logoEmoji || '🏆',
        description: c.description || '',
        memberCount: uniqueIds.size,
        memberIds,
        president: c.president ? {
          _id: c.president._id,
          name: `${c.president.firstName} ${c.president.lastName}`,
          rollNumber: c.president.rollNumber,
          department: c.president.department,
          year: c.president.year,
        } : null,
      };
    }));
  } catch (err) {
    next(err);
  }
});

router.post('/clubs', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, logoEmoji, description, presidentId } = req.body;
    if (!name) return res.status(400).json({ error: 'Club name required' });
    if (!presidentId) return res.status(400).json({ error: 'President required' });

    const president = await User.findById(presidentId);
    if (!president || president.role !== 'student')
      return res.status(400).json({ error: 'Invalid president' });

    const club = await Club.create({
      name,
      logoEmoji: logoEmoji || '🏆',
      description: description || '',
      president: presidentId,
      members: [],
      college: 'SINHGAD_ENGINEERING',
    });

    await club.populate('president', 'firstName lastName rollNumber department year');
    res.status(201).json({
      _id: club._id,
      name: club.name,
      logoEmoji: club.logoEmoji,
      description: club.description,
      memberCount: 1,
      president: {
        _id: club.president._id,
        name: `${club.president.firstName} ${club.president.lastName}`,
        rollNumber: club.president.rollNumber,
        department: club.president.department,
        year: club.president.year,
      },
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Club name already exists' });
    next(err);
  }
});

router.patch('/clubs/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, logoEmoji, description, presidentId } = req.body;
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    if (name) club.name = name;
    if (logoEmoji) club.logoEmoji = logoEmoji;
    if (description !== undefined) club.description = description;
    if (presidentId && presidentId !== club.president?.toString()) {
      const newPres = await User.findById(presidentId);
      if (!newPres || newPres.role !== 'student')
        return res.status(400).json({ error: 'Invalid president' });
      club.president = presidentId;
    }
    await club.save();
    await club.populate('president', 'firstName lastName rollNumber department year');

    const presId = club.president?._id?.toString();
    const uniqueIds = new Set((club.members || []).map(m => m.toString()));
    if (presId) uniqueIds.add(presId);
    const memberIds = (club.members || [])
      .map(m => m.toString())
      .filter(id => id !== presId);
    res.json({
      _id: club._id,
      name: club.name,
      logoEmoji: club.logoEmoji,
      description: club.description,
      memberCount: uniqueIds.size,
      memberIds,
      president: club.president ? {
        _id: club.president._id,
        name: `${club.president.firstName} ${club.president.lastName}`,
        rollNumber: club.president.rollNumber,
        department: club.president.department,
        year: club.president.year,
      } : null,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Club name already exists' });
    next(err);
  }
});

router.delete('/clubs/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── COMMUNITIES ─────────────────────────────────────────────────────────────

router.get('/communities', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const communities = await Community.find({
      college: 'SINHGAD_ENGINEERING',
      status: 'pending',
    })
      .populate('manager', 'firstName lastName rollNumber department year')
      .sort({ createdAt: 1 });

    res.json(communities.map(c => ({
      _id: c._id,
      name: c.name,
      description: c.description || '',
      tags: c.tags || [],
      isPrivate: !!c.isPrivate,
      reason: c.reason || '',
      createdAt: c.createdAt,
      requestedBy: c.manager ? {
        _id: c.manager._id,
        name: `${c.manager.firstName} ${c.manager.lastName}`,
        rollNumber: c.manager.rollNumber,
        department: c.manager.department,
        year: c.manager.year,
      } : null,
    })));
  } catch (err) {
    next(err);
  }
});

router.get('/communities/approved', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const communities = await Community.find({
      college: 'SINHGAD_ENGINEERING',
      status: 'approved',
    })
      .populate('manager', 'firstName lastName rollNumber department year')
      .sort({ name: 1 });

    res.json(communities.map(c => ({
      _id: c._id,
      name: c.name,
      icon: c.icon || '🌐',
      description: c.description || '',
      tags: c.tags || [],
      isPrivate: !!c.isPrivate,
      memberCount: (c.members || []).length + 1,
      manager: c.manager ? {
        _id: c.manager._id,
        name: `${c.manager.firstName} ${c.manager.lastName}`,
        department: c.manager.department,
        year: c.manager.year,
      } : null,
    })));
  } catch (err) {
    next(err);
  }
});

router.patch('/communities/:id/approve', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    community.status = 'approved';
    await community.save();
    res.json({ ok: true, status: 'approved' });
  } catch (err) {
    next(err);
  }
});

router.patch('/communities/:id/reject', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    community.status = 'rejected';
    community.joinRequests = [];
    await community.save();
    res.json({ ok: true, status: 'rejected' });
  } catch (err) {
    next(err);
  }
});

router.delete('/communities/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const community = await Community.findByIdAndDelete(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

router.get('/announcements', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const announcements = await Announcement.find({ college: 'SINHGAD_ENGINEERING' })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

router.post('/announcements', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title, content, priority, targetDepartments, targetYears } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const depts = Array.isArray(targetDepartments) && targetDepartments.length > 0
      ? targetDepartments
      : ['ALL'];
    const years = Array.isArray(targetYears) && targetYears.length > 0
      ? targetYears
      : ['ALL'];

    const ann = await Announcement.create({
      title,
      body: content,
      author: req.user._id,
      priority: priority || 'normal',
      targetDepartments: depts,
      targetYears: years,
      college: 'SINHGAD_ENGINEERING',
    });
    res.status(201).json(ann);
  } catch (err) {
    next(err);
  }
});

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

// Helper: aggregate revenue collected per club (approved paid registrations).
// Returns Map<clubId-string, revenue-number>. Pass `clubFilter` to scope.
async function revenueByClub(clubFilter = {}) {
  const rows = await Registration.aggregate([
    { $match: { paymentStatus: 'approved', ...clubFilter } },
    { $lookup: { from: 'posts', localField: 'post', foreignField: '_id', as: 'post' } },
    { $unwind: '$post' },
    { $match: { 'post.isPaid': true } },
    { $group: { _id: '$post.club', revenue: { $sum: '$post.amount' } } },
  ]);
  const map = new Map();
  for (const r of rows) {
    if (r._id) map.set(r._id.toString(), r.revenue || 0);
  }
  return map;
}

// Helper: per-event attendance stats, optionally scoped by club.
// Returns array of { postId, clubId, totalRegs, attended, rate }.
async function eventAttendanceRows(matchExtra = {}) {
  return Registration.aggregate([
    { $lookup: { from: 'posts', localField: 'post', foreignField: '_id', as: 'post' } },
    { $unwind: '$post' },
    { $match: { 'post.type': 'Event', ...matchExtra } },
    {
      $group: {
        _id: '$post._id',
        clubId: { $first: '$post.club' },
        totalRegs: { $sum: 1 },
        attended: { $sum: { $cond: ['$attended', 1, 0] } },
      },
    },
  ]);
}

router.get('/dashboard/stats', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalStudents,
      totalClubs,
      approvedCommunities,
      totalEventsEver,
      activeRecruitments,
      totalConnections,
      revenueMap,
      attendanceRows,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Club.countDocuments({}),
      Community.countDocuments({ status: 'approved' }),
      Post.countDocuments({ type: 'Event' }),
      Post.countDocuments({
        type: 'Recruitment',
        isActive: true,
        $or: [{ registrationDeadline: null }, { registrationDeadline: { $gt: now } }],
      }),
      Connection.countDocuments({ status: 'accepted' }),
      revenueByClub(),
      eventAttendanceRows(),
    ]);

    const campusRevenue = [...revenueMap.values()].reduce((s, v) => s + v, 0);

    let avgSum = 0, avgN = 0;
    for (const r of attendanceRows) {
      if (r.totalRegs > 0) {
        avgSum += (r.attended / r.totalRegs) * 100;
        avgN++;
      }
    }
    const campusAvgAttendance = avgN > 0 ? Math.round(avgSum / avgN) : 0;

    res.json({
      totalStudents,
      totalClubs,
      approvedCommunities,
      totalEventsEver,
      activeRecruitments,
      campusRevenue,
      campusAvgAttendance,
      totalConnections,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/clubs', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date();
    const clubs = await Club.find({ college: 'SINHGAD_ENGINEERING' }).sort({ name: 1 });

    const [eventCounts, activeRecruitsByClub, revenueMap, attendanceRows, insights] = await Promise.all([
      Post.aggregate([
        { $match: { type: 'Event' } },
        { $group: { _id: '$club', n: { $sum: 1 } } },
      ]),
      Post.aggregate([
        {
          $match: {
            type: 'Recruitment',
            isActive: true,
            $or: [{ registrationDeadline: null }, { registrationDeadline: { $gt: now } }],
          },
        },
        { $group: { _id: '$club', n: { $sum: 1 } } },
      ]),
      revenueByClub(),
      eventAttendanceRows(),
      ClubInsight.find({}, 'clubId generatedAt').lean(),
    ]);

    const eventsByClub = new Map(eventCounts.map(e => [e._id?.toString(), e.n]));
    const activeRecruitSet = new Set(
      activeRecruitsByClub.filter(r => r._id).map(r => r._id.toString())
    );
    const insightByClub = new Map(insights.map(i => [i.clubId.toString(), i]));

    // attendance per club: average over that club's events that had any regs
    const attendanceByClub = new Map();
    for (const r of attendanceRows) {
      if (!r.clubId || r.totalRegs <= 0) continue;
      const key = r.clubId.toString();
      const cur = attendanceByClub.get(key) || { sum: 0, n: 0 };
      cur.sum += (r.attended / r.totalRegs) * 100;
      cur.n += 1;
      attendanceByClub.set(key, cur);
    }

    res.json(clubs.map(c => {
      const id = c._id.toString();
      const att = attendanceByClub.get(id);
      const ins = insightByClub.get(id);
      // De-dupe president from members (same fix as /admin/clubs)
      const presId = c.president?.toString();
      const uniqueIds = new Set((c.members || []).map(m => m.toString()));
      if (presId) uniqueIds.add(presId);
      return {
        _id: c._id,
        name: c.name,
        logoEmoji: c.logoEmoji || '🏆',
        memberCount: uniqueIds.size,
        eventsCount: eventsByClub.get(id) || 0,
        avgAttendance: att && att.n > 0 ? Math.round(att.sum / att.n) : 0,
        activeRecruitment: activeRecruitSet.has(id),
        revenueCollected: revenueMap.get(id) || 0,
        hasInsight: !!ins,
        insightGeneratedAt: ins?.generatedAt || null,
      };
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/clubs/:id/insights', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('president', 'firstName lastName department year')
      .populate('members', 'firstName lastName department year');
    if (!club) return res.status(404).json({ error: 'Club not found' });

    // Always send basic club info — the modal renders it whether or not an insight exists.
    const presId = club.president?._id?.toString();
    const membersList = [];
    if (club.president) {
      membersList.push({
        _id: club.president._id,
        name: `${club.president.firstName} ${club.president.lastName}`,
        dept: club.president.department,
        year: club.president.year,
        role: 'President',
      });
    }
    for (const m of club.members || []) {
      if (m._id?.toString() === presId) continue;
      membersList.push({
        _id: m._id,
        name: `${m.firstName} ${m.lastName}`,
        dept: m.department,
        year: m.year,
        role: 'Member',
      });
    }

    const clubInfo = {
      _id: club._id,
      name: club.name,
      logoEmoji: club.logoEmoji || '🏆',
      description: club.description || '',
      tags: club.tags || [],
      members: membersList,
    };

    const saved = await ClubInsight.findOne({ clubId: club._id });
    if (!saved) {
      return res.json({ exists: false, club: clubInfo });
    }

    let insight = null;
    try { insight = JSON.parse(saved.insightText); } catch {}

    res.json({
      exists: true,
      club: clubInfo,
      generatedAt: saved.generatedAt,
      statsSnapshot: saved.statsSnapshot || {},
      insight,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/community-insights', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const saved = await CommunityInsight.findOne({ scope: 'campus' });
    if (!saved) return res.json({ exists: false });
    let insight = null;
    try { insight = JSON.parse(saved.insightText); } catch {}
    res.json({
      exists: true,
      generatedAt: saved.generatedAt,
      insight,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/dashboard/community-insights/generate', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const communities = await Community.find({ status: 'approved' })
      .select('_id name description tags members')
      .lean();

    const shapedCommunities = communities.map(c => ({
      _id: c._id,
      name: c.name,
      description: c.description || '',
      tags: c.tags || [],
      memberCount: (c.members || []).length,
    }));

    const collabs = await Post.find({ type: 'Collab' })
      .select('title body community')
      .lean();

    const communityNameById = new Map(communities.map(c => [c._id.toString(), c.name]));
    const collabsByCommunity = {};
    for (const p of collabs) {
      const name = p.community ? (communityNameById.get(p.community.toString()) || 'Unknown') : 'General';
      if (!collabsByCommunity[name]) collabsByCommunity[name] = [];
      collabsByCommunity[name].push({ title: p.title, description: p.body || '' });
    }

    const insight = await generateCommunityInsights({
      communities: shapedCommunities,
      collabsByCommunity,
    });

    const doc = await CommunityInsight.findOneAndUpdate(
      { scope: 'campus' },
      {
        scope: 'campus',
        generatedAt: new Date(),
        insightText: JSON.stringify(insight),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      exists: true,
      generatedAt: doc.generatedAt,
      insight,
    });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN PROFILE ───────────────────────────────────────────────────────────
// GET is open to any logged-in user — student-facing pages need it too
// (Announcements page contact card, restriction modal on login).
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    let doc = await AdminProfile.findOne({ scope: 'campus' });
    if (!doc) doc = await AdminProfile.create({ scope: 'campus' });
    res.json({
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      designation: doc.designation,
      bio: doc.bio,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'phone', 'designation', 'bio'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const doc = await AdminProfile.findOneAndUpdate(
      { scope: 'campus' },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      designation: doc.designation,
      bio: doc.bio,
    });
  } catch (err) {
    next(err);
  }
});

// ─── STUDENT ADMIN ACTIONS ───────────────────────────────────────────────────

// Reset password: just flag mustChangePassword. The existing login flow
// (mustChangePassword → /change-password screen) does the rest on next login.
router.post('/students/:id/reset-password', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u || u.role !== 'student') return res.status(404).json({ error: 'Student not found' });
    u.mustChangePassword = true;
    await u.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/students/:id/restrict', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const reason = (req.body?.reason || '').toString().trim();
    if (!reason) return res.status(400).json({ error: 'Reason is required' });

    const u = await User.findById(req.params.id);
    if (!u || u.role !== 'student') return res.status(404).json({ error: 'Student not found' });

    u.isRestricted = true;
    u.restrictionReason = reason;
    await u.save();
    res.json({ ok: true, isRestricted: true, restrictionReason: reason });
  } catch (err) {
    next(err);
  }
});

router.patch('/students/:id/unrestrict', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u || u.role !== 'student') return res.status(404).json({ error: 'Student not found' });

    u.isRestricted = false;
    u.restrictionReason = '';
    await u.save();
    res.json({ ok: true, isRestricted: false });
  } catch (err) {
    next(err);
  }
});

router.get('/students/:id/check-deletable', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u || u.role !== 'student') return res.status(404).json({ error: 'Student not found' });

    const presClub = await Club.findOne({ president: u._id }).select('name');
    if (presClub) {
      return res.json({ deletable: false, reason: `Student is president of ${presClub.name}` });
    }
    const mgrCommunity = await Community.findOne({ manager: u._id }).select('name');
    if (mgrCommunity) {
      return res.json({ deletable: false, reason: `Student is manager of ${mgrCommunity.name}` });
    }
    res.json({ deletable: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/students/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u || u.role !== 'student') return res.status(404).json({ error: 'Student not found' });

    // Guard against deleting a president / manager — same check the UI runs,
    // but enforced server-side too so it can't be bypassed.
    const presClub = await Club.findOne({ president: u._id }).select('name');
    if (presClub) {
      return res.status(409).json({ error: `Student is president of ${presClub.name}` });
    }
    const mgrCommunity = await Community.findOne({ manager: u._id }).select('name');
    if (mgrCommunity) {
      return res.status(409).json({ error: `Student is manager of ${mgrCommunity.name}` });
    }

    // Cascade in the documented order.
    await Club.updateMany({ members: u._id }, { $pull: { members: u._id } });
    await Community.updateMany({ members: u._id }, { $pull: { members: u._id } });
    await Connection.deleteMany({ $or: [{ requester: u._id }, { recipient: u._id }] });
    await Application.deleteMany({ applicant: u._id });
    await Registration.deleteMany({ registrant: u._id });
    await u.deleteOne();

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
