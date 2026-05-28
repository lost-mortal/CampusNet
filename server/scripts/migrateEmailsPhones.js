// One-off migration: switch existing students to the joining-year email scheme and
// give each a phone number. SAFE BY DESIGN:
//   - dry-run by default; prints the full before -> after table and writes NOTHING
//   - writes only with the explicit  --commit  flag
//   - touches ONLY the `email` and `phone` fields ($set), nothing else
//   - codes are deterministic (seeded from roll number) so the dry-run preview is
//     exactly what --commit will write; re-running is idempotent
//
// Usage (run from the server/ directory):
//   node scripts/migrateEmailsPhones.js            # dry-run, shows the plan
//   node scripts/migrateEmailsPhones.js --commit   # actually writes email + phone

require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('../models/User');
const { deterministicEmail, fakePhone, parseJoinYear } = require('../utils/studentIdentity');

const COMMIT = process.argv.includes('--commit');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Emails we must NOT collide with: every non-student account (e.g. admin).
  // Students' current emails are being replaced, so they are not "taken".
  const others = await User.find({ role: { $ne: 'student' } }).select('email').lean();
  const taken = new Set(others.map(u => (u.email || '').toLowerCase()));

  // Stable order → stable, reproducible output.
  const students = await User.find({ role: 'student' })
    .select('firstName lastName rollNumber email phone joinYear')
    .sort({ rollNumber: 1 })
    .lean();

  if (students.length === 0) {
    console.log('No students found. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const plan = students.map(s => {
    const joinYear = s.joinYear || parseJoinYear(s.rollNumber);
    const newEmail = deterministicEmail(s.firstName, joinYear, s.rollNumber, taken);
    const newPhone = fakePhone(s.rollNumber);
    return {
      _id: s._id,
      roll: s.rollNumber,
      name: `${s.firstName} ${s.lastName}`,
      oldEmail: s.email,
      newEmail,
      oldPhone: s.phone || '(none)',
      newPhone,
    };
  });

  // Print the plan.
  console.log(`${COMMIT ? 'COMMITTING' : 'DRY RUN'} — ${plan.length} students\n`);
  for (const p of plan) {
    console.log(`  ${p.roll.padEnd(16)} ${p.name}`);
    console.log(`     email: ${p.oldEmail}  ->  ${p.newEmail}`);
    console.log(`     phone: ${p.oldPhone}  ->  ${p.newPhone}`);
  }

  // Sanity: every new email must be unique.
  const uniq = new Set(plan.map(p => p.newEmail.toLowerCase()));
  if (uniq.size !== plan.length) {
    console.error('\nABORT: generated emails are not unique. No writes performed.');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (!COMMIT) {
    console.log('\nDry run only. Re-run with  --commit  to apply (writes email + phone only).');
    await mongoose.disconnect();
    return;
  }

  // Write — ONLY email + phone, one student at a time.
  let updated = 0;
  for (const p of plan) {
    await User.updateOne({ _id: p._id }, { $set: { email: p.newEmail, phone: p.newPhone } });
    updated++;
  }
  console.log(`\n✓ Done. Updated email + phone on ${updated} students. No other fields touched.`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Migration failed:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
