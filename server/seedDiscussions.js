/**
 * seedDiscussions.js — adds 2-3 discussion threads (with comments) to every
 * approved community. Safe to run multiple times: skips communities that
 * already have discussions.
 *
 * Usage:  node server/seedDiscussions.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const Community = require('./models/Community');
const User = require('./models/User');
const Discussion = require('./models/Discussion');

// ─── Discussion templates ───────────────────────────────────────────────────
// Three pools — rotated per-community so each feels different.
const POOLS = [
  [
    {
      title: 'Introduce yourself!',
      body: "Welcome to the community! Drop a quick intro — who you are, what branch/year you're in, and what brought you here. Let's get to know each other 👋",
      comments: [
        "Hey everyone! I'm Arjun, FE COMP. Joined because I want to explore this space beyond the classroom.",
        "SE ENTC here — been lurking for a while, finally joined. Excited to collaborate!",
        "TE MECH checking in. Bit of an outsider but genuinely curious about what you all are building.",
      ],
      upvotes: 12,
    },
    {
      title: 'Best resources to get started — share your list',
      body: 'Drop links, books, YouTube channels, or courses that actually helped you. Keep it relevant to our community focus. No spam.',
      comments: [
        'MIT OpenCourseWare has been a game changer for me — free and surprisingly deep.',
        "CS50 is the classic answer but it genuinely holds up. Don't skip the problem sets.",
      ],
      upvotes: 8,
    },
    {
      title: 'What project idea are you most excited about this semester?',
      body: "Share what you're planning to build or research. Maybe someone here can collaborate, or at least give useful feedback before you start.",
      comments: [
        "Working on a smart attendance system using OpenCV. Happy to pair up if anyone has ML experience.",
        "I want to build a peer-study scheduler — basically Calendly but for study groups. Low-tech but useful.",
        "Planning an IoT greenhouse monitor for my final year project. Still figuring out the hardware stack.",
      ],
      upvotes: 15,
    },
  ],
  [
    {
      title: 'Weekly discussion: what did you learn this week?',
      body: "Even one thing counts. Could be a new concept, a debugging trick, a tool you discovered. Let's keep each other accountable and share the knowledge.",
      comments: [
        "Learned that Python's `zip` is lazy — it stops at the shortest iterable. Caught a subtle bug because of that.",
        "Finally understood what a race condition actually is after debugging one in my OS assignment for 3 hours.",
      ],
      upvotes: 9,
    },
    {
      title: 'Imposter syndrome — does it ever go away?',
      body: "Genuinely asking. Sometimes I look at what others are building and feel like I'm way behind. Anyone else feel this? How do you handle it?",
      comments: [
        "All the time. What helped me was realising everyone Googles the basics. Even seniors.",
        "The gap between 'I know nothing' and 'I'm doing okay' is often just a few consistent weeks of practice.",
        "Comparison is the thief of joy. Focus on where YOU were 6 months ago instead.",
      ],
      upvotes: 21,
    },
    {
      title: 'Suggest a topic for our next collab session',
      body: "We want to organise a community-led session next month. What topic do you all think would be most useful? Vote with upvotes or drop a suggestion in the comments.",
      comments: [
        "Git & GitHub for teams — half my batchmates still commit directly to main.",
        "System design basics. Nobody teaches this but it comes up in every internship interview.",
      ],
      upvotes: 6,
    },
  ],
  [
    {
      title: 'Share a project you are proud of',
      body: "Doesn't have to be groundbreaking. Could be a semester assignment that actually worked, a small tool you wrote for yourself, or anything you built from scratch. Drop a description or a link.",
      comments: [
        "Built a terminal-based task manager in C last semester. Ugly but functional — and I finally understood pointers.",
        "Made a WhatsApp bot that sends exam timetable reminders. Saved my entire hostel wing.",
        "Nothing fancy but I wrote a script that auto-generates my college report cover pages. Saves 10 min every submission.",
      ],
      upvotes: 18,
    },
    {
      title: 'What is the one skill you wish you had learned earlier?',
      body: "Looking back, what would you tell your first-year self to start learning immediately? Let's build a real list, not just the obvious answers.",
      comments: [
        "Touch typing. Sounds trivial but it freed up so much cognitive bandwidth.",
        "Reading documentation instead of always searching for tutorials. Tutorials skip the edge cases.",
      ],
      upvotes: 14,
    },
    {
      title: 'Internship season — tips, rejections, and wins',
      body: "It's that time of year. Share what's working, what bombed, companies worth applying to, and anything that helped you get through interviews.",
      comments: [
        "Applied to 40 companies, heard back from 8, cleared 3 rounds in 2. It's a numbers game — just keep going.",
        "LeetCode matters less than they say if you can explain your thinking clearly. Communication is half the interview.",
        "Don't skip the HR round — people get filtered out there for bad reasons. Prepare 'tell me about yourself' properly.",
      ],
      upvotes: 27,
    },
  ],
];

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const communities = await Community.find({ status: 'approved' });
  console.log(`Found ${communities.length} approved communities`);

  // Get all students to assign as fake authors
  const students = await User.find({ role: 'student' }).select('_id department');
  if (!students.length) {
    console.error('No students found — run the main seed first.');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];

    const existing = await Discussion.countDocuments({ community: community._id });
    if (existing > 0) {
      console.log(`  ↩  ${community.name} already has ${existing} discussions — skipping`);
      skipped++;
      continue;
    }

    const pool = POOLS[i % POOLS.length];

    for (const template of pool) {
      // Pick random students from within the community's member list when possible
      const memberIds = [
        ...(community.manager ? [community.manager.toString()] : []),
        ...community.members.map(m => m.toString()),
      ];
      const eligible = students.filter(s => memberIds.includes(s._id.toString()));
      const authorPool = eligible.length >= 2 ? eligible : students;

      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

      const author = pick(authorPool);
      const commentDocs = template.comments.map((body, ci) => ({
        author: pick(authorPool)._id,
        body,
        createdAt: new Date(Date.now() - (template.comments.length - ci) * 3_600_000 * 6),
      }));

      await Discussion.create({
        community: community._id,
        author: author._id,
        title: template.title,
        body: template.body,
        upvotes: template.upvotes,
        comments: commentDocs,
        college: community.college || 'SINHGAD_ENGINEERING',
        createdAt: new Date(Date.now() - (pool.indexOf(template) + 1) * 86_400_000 * 2),
      });
      created++;
    }

    console.log(`  ✓  ${community.name} — added ${pool.length} discussions`);
  }

  console.log(`\nDone. Created ${created} discussions, skipped ${skipped} communities.`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
