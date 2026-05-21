// One-off backfill for Event/Recruitment posts that were seeded without a
// registrationDeadline. Run with: node server/patchDeadlines.js
//
// Policy:
//   - eventDate in the past   -> deadline = eventDate - 3 days
//   - eventDate in the future -> deadline = eventDate - 2 days
//   - Deadline is never after eventDate (the subtraction guarantees this).
//   - Posts without eventDate are skipped (no anchor to compute from).

require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
const mongoose = require('mongoose');

const Post = require('./models/Post');

const DAY = 24 * 60 * 60 * 1000;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const candidates = await Post.find({
    type: { $in: ['Event', 'Recruitment'] },
    $or: [{ registrationDeadline: null }, { registrationDeadline: { $exists: false } }],
  });

  console.log(`Found ${candidates.length} post(s) missing registrationDeadline`);

  const now = Date.now();
  let updated = 0;
  let skipped = 0;

  for (const p of candidates) {
    if (!p.eventDate) {
      skipped++;
      continue;
    }
    const eventMs = new Date(p.eventDate).getTime();
    const offsetDays = eventMs < now ? 3 : 2;
    const deadline = new Date(eventMs - offsetDays * DAY);
    p.registrationDeadline = deadline;
    await p.save();
    updated++;
  }

  console.log(`Updated: ${updated}, Skipped (no eventDate): ${skipped}`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
