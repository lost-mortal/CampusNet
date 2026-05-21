const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Club = require('../models/Club');
const AdminProfile = require('../models/AdminProfile');
const requireAuth = require('../middleware/auth');

const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };
const CLUB_ICONS = {
  'Robotics Club': '🤖',
  'GDSC': '💻',
  'Music Club': '🎵',
  'AI/ML Club': '🧠',
  'Sports Club': '🏅',
};

// Look up a student's club, prioritizing presidency over membership.
// (A student should never be both, but if data drifts, presidency wins.)
async function findUserClub(userId) {
  const asPres = await Club.findOne({ president: userId });
  if (asPres) return asPres;
  return Club.findOne({ members: userId });
}

function buildProfile(user, club) {
  const isAdmin = user.role === 'admin';
  let frontendRole = 'fresher';
  let clubName = null;
  let clubLogo = null;
  let isClubMember = false;

  if (club) {
    isClubMember = true;
    clubName = club.name;
    clubLogo = CLUB_ICONS[club.name] || '🏆';
    frontendRole = club.president.toString() === user._id.toString() ? 'president' : 'member';
  }

  return {
    _id: user._id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    avatar: isAdmin ? '🛡️' : (DEPT_AVATARS[user.department] || '👤'),
    role: isAdmin ? 'admin' : frontendRole,
    details: isAdmin ? 'Campus Admin' : `${user.year} / ${user.department}`,
    department: user.department,
    year: user.year,
    rollNumber: user.rollNumber,
    bio: user.bio || '',
    profilePic: user.profilePic || '',
    bannerImage: user.bannerImage || '',
    isClubMember,
    clubName,
    clubLogo,
    mustChangePassword: user.mustChangePassword,
  };
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Gate restricted students BEFORE issuing a token. Send the admin contact
    // payload so the login modal can show "Contact Campus Admin" with details.
    if (user.role === 'student' && user.isRestricted) {
      const admin = await AdminProfile.findOne({ scope: 'campus' });
      return res.status(403).json({
        error: 'ACCESS_RESTRICTED',
        reason: user.restrictionReason || '',
        admin: admin ? { name: admin.name, email: admin.email, phone: admin.phone } : null,
      });
    }

    let club = null;
    if (user.role === 'student') {
      club = await findUserClub(user._id);
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: buildProfile(user, club) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password  (requires token)
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { passwordHash, mustChangePassword: false },
      { new: true }
    );

    let club = null;
    if (user.role === 'student') {
      club = await findUserClub(user._id);
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: buildProfile(user, club) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me  (verify token + refresh profile)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let club = null;
    if (user.role === 'student') {
      club = await findUserClub(user._id);
    }

    res.json({ user: buildProfile(user, club) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/me — current user updates their own profile fields.
// Currently only used for banner + profile photo upload (base64 strings).
// Other profile fields (bio, skills, etc.) are still client-local — we don't
// touch them here so we don't disturb the existing edit-modal behavior.
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const allowed = ['profilePic', 'bannerImage', 'bio'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let club = null;
    if (user.role === 'student') club = await findUserClub(user._id);
    res.json({ user: buildProfile(user, club) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
