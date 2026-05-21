require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
const mongoose = require('mongoose');

const User = require('../models/User');
const Club = require('../models/Club');

const ROLL = 'fe2025it001';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ rollNumber: ROLL });
  if (!user) {
    console.error(`No user with rollNumber=${ROLL}`);
    process.exit(1);
  }
  console.log(`Found user: ${user.firstName} ${user.lastName} (${user._id})`);

  const clubsWithHer = await Club.find({ members: user._id }).select('name');
  if (clubsWithHer.length === 0) {
    console.log('She is not in any Club.members[] — nothing to do.');
  } else {
    console.log(`She appears in ${clubsWithHer.length} club(s): ${clubsWithHer.map(c => c.name).join(', ')}`);
  }

  const presidentOf = await Club.find({ president: user._id }).select('name');
  if (presidentOf.length) {
    console.warn(`WARNING: she is president of: ${presidentOf.map(c => c.name).join(', ')} — leaving president field alone.`);
  }

  const pullRes = await Club.updateMany(
    { members: user._id },
    { $pull: { members: user._id } }
  );
  console.log(`Pulled from members[]: matched=${pullRes.matchedCount}, modified=${pullRes.modifiedCount}`);

  const after = await Club.find({ members: user._id }).select('name');
  console.log(`Post-check: she now appears in ${after.length} club(s)`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
