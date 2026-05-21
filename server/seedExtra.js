require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const User         = require('./models/User');
const Club         = require('./models/Club');
const Post         = require('./models/Post');
const Application  = require('./models/Application');
const Registration = require('./models/Registration');

const COLLEGE = 'SINHGAD_ENGINEERING';

const past   = (days) => new Date(Date.now() - days * 86_400_000);
const future = (days) => new Date(Date.now() + days * 86_400_000);

function pickN(arr, n) {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, Math.min(n, copy.length));
}

// Map a club's first tag to a valid Post tag enum value
const TAG_MAP = { Technical: 'Technical', Cultural: 'Cultural', Sports: 'Sports', Creative: 'Creative' };
function clubTag(club) {
  for (const t of (club.tags || [])) {
    if (TAG_MAP[t]) return TAG_MAP[t];
  }
  return 'Other';
}

async function seedExtra() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let studentsAdded = 0, eventsAdded = 0, registrationsCreated = 0, recruitPostsAdded = 0;

  // ── 1. Extra students ────────────────────────────────────────────────────
  // Spread: 2 per year (FE/SE/TE/BE), varied depts, no roll-number collisions
  const extraDefs = [
    // FE 2025
    { firstName: 'Aarav',  lastName: 'Mishra',  dept: 'COMP', year: 'FE', jy: 2025, num: '003',
      motherName: 'Geeta',   birthDate: '050807',
      bio: 'First-year CS student fascinated by game dev and graphics programming.',
      skills: ['C++', 'Unity', 'OpenGL', 'Python'] },
    { firstName: 'Nidhi',  lastName: 'Kulkarni', dept: 'IT',   year: 'FE', jy: 2025, num: '002',
      motherName: 'Lata',    birthDate: '180807',
      bio: 'IT fresher exploring mobile development and UI design.',
      skills: ['Swift', 'Figma', 'HTML', 'CSS'] },
    // SE 2024
    { firstName: 'Raj',    lastName: 'Chavan',   dept: 'MECH', year: 'SE', jy: 2024, num: '002',
      motherName: 'Sunanda', birthDate: '110605',
      bio: 'Mechanical sophomore with a passion for robotics and 3D printing.',
      skills: ['SolidWorks', 'CATIA', '3D Printing', 'Arduino'] },
    { firstName: 'Aditi',  lastName: 'Bhosale',  dept: 'IT',   year: 'SE', jy: 2024, num: '002',
      motherName: 'Pushpa',  birthDate: '300505',
      bio: 'SE IT student focused on backend systems and database design.',
      skills: ['Node.js', 'PostgreSQL', 'Python', 'Docker'] },
    // TE 2023
    { firstName: 'Harsh',  lastName: 'Wadekar',  dept: 'COMP', year: 'TE', jy: 2023, num: '002',
      motherName: 'Sushma',  birthDate: '200404',
      bio: 'TE COMP student into distributed systems and competitive programming.',
      skills: ['Go', 'Rust', 'Kafka', 'Competitive Programming'] },
    { firstName: 'Prachi', lastName: 'More',      dept: 'MECH', year: 'TE', jy: 2023, num: '002',
      motherName: 'Varsha',  birthDate: '090304',
      bio: 'Mechanical TE student interested in renewable energy and CFD.',
      skills: ['ANSYS', 'MATLAB', 'CFD', 'SolidWorks'] },
    // BE 2022
    { firstName: 'Omkar',  lastName: 'Shinde',   dept: 'COMP', year: 'BE', jy: 2022, num: '002',
      motherName: 'Vandita', birthDate: '160203',
      bio: 'Final-year COMP student, SDE intern at a fintech startup. Loves systems design.',
      skills: ['Java', 'Spring Boot', 'AWS', 'Microservices', 'Kafka'] },
    { firstName: 'Rutuja', lastName: 'Karale',    dept: 'ENTC', year: 'BE', jy: 2022, num: '002',
      motherName: 'Shanta',  birthDate: '280102',
      bio: 'Final-year ENTC student working on VLSI design and embedded systems.',
      skills: ['VHDL', 'Verilog', 'Embedded C', 'PCB Design', 'FPGA'] },
  ];

  const allRolls = extraDefs.map(d => `${d.year.toLowerCase()}${d.jy}${d.dept.toLowerCase()}${d.num}`);
  const existingRolls = new Set(
    (await User.find({ rollNumber: { $in: allRolls } }).select('rollNumber').lean()).map(u => u.rollNumber)
  );
  const toInsert = extraDefs.filter((_, i) => !existingRolls.has(allRolls[i]));

  const newStudents = toInsert.length
    ? await User.insertMany(
        await Promise.all(toInsert.map(async (d) => {
          const rollNumber = `${d.year.toLowerCase()}${d.jy}${d.dept.toLowerCase()}${d.num}`;
          const passwordHash = await bcrypt.hash(`${d.motherName.toLowerCase()}@${d.birthDate}`, 10);
          return {
            rollNumber,
            email: `${d.firstName.toLowerCase()}.${rollNumber}@sinhgad.edu`,
            passwordHash,
            firstName: d.firstName,
            lastName: d.lastName,
            role: 'student',
            department: d.dept,
            year: d.year,
            joinYear: d.jy,
            mustChangePassword: true,
            motherName: d.motherName,
            birthDate: d.birthDate,
            bio: d.bio,
            skills: d.skills,
            college: COLLEGE,
          };
        }))
      )
    : [];
  studentsAdded = newStudents.length;
  console.log(`Added ${studentsAdded} students`);

  // Fetch full student pool (including new ones) for registrations
  const allStudents = await User.find({ role: 'student', college: COLLEGE }).lean();

  // ── 2. Look up existing clubs ────────────────────────────────────────────
  const clubs = await Club.find({ college: COLLEGE }).populate('president').lean();
  const byName = (n) => clubs.find(c => c.name === n);
  const robotics = byName('Robotics Club');
  const gdsc     = byName('GDSC');
  const music    = byName('Music Club');
  const aiml     = byName('AI/ML Club');
  const sports   = byName('Sports Club');

  // ── 3. Events ────────────────────────────────────────────────────────────
  // isPaid:true events have paidSplit: { approved, pending }
  // attendRate only applies to past events (eventDate < now)
  const eventDefs = [
    // Robotics Club (3)
    { club: robotics,
      title: 'Line Follower Bot Build Challenge',
      body: 'Build a line-follower robot in teams of 3 and race it on our custom track. All components provided. Prizes for top 3 teams.',
      eventDate: past(75), venue: 'Mech Workshop',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 12, attendRate: 0.67 },
    { club: robotics,
      title: 'Industry Talk: Robotics in Manufacturing',
      body: 'Guest lecture by a senior robotics engineer from Tata Motors. Covers industrial automation and career paths in robotics.',
      eventDate: past(30), venue: 'Seminar Hall B',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 18, attendRate: 0.55 },
    { club: robotics,
      title: 'ROS2 Advanced Workshop',
      body: 'Deep dive into ROS2 — multi-robot coordination, Nav2 stack, and custom action servers. Prerequisites: ROS basics.',
      eventDate: future(21), venue: 'Lab 204',
      isPaid: true, amount: 199,
      paymentConfig: { enabled: true, amount: 199, recipient: { upiId: 'robotics@sinhgad', name: 'Robotics Club' } },
      totalReg: 8, attendRate: 0, paidSplit: { approved: 5, pending: 3 } },

    // GDSC (3)
    { club: gdsc,
      title: 'Cloud Study Jam: GCP Fundamentals',
      body: 'Hands-on labs on GCP — Compute Engine, Cloud Storage, BigQuery. Earn a free Qwiklabs badge.',
      eventDate: past(90), venue: 'Computer Lab 1',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 22, attendRate: 0.59 },
    { club: gdsc,
      title: 'Flutter Forward Workshop',
      body: 'Build and ship a Flutter app in a single day. Leave with a working app on your phone. Beginner friendly.',
      eventDate: past(45), venue: 'Computer Lab 2',
      isPaid: true, amount: 149,
      paymentConfig: { enabled: true, amount: 149, recipient: { upiId: 'gdsc@sinhgad', name: 'GDSC Sinhgad' } },
      totalReg: 16, attendRate: 0.75, paidSplit: { approved: 12, pending: 4 } },
    { club: gdsc,
      title: 'Open Source Contribution Sprint',
      body: 'Pick a real open-source project, make your first meaningful PR, and get it merged live. Mentors available.',
      eventDate: future(10), venue: 'Seminar Hall A',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 14, attendRate: 0 },

    // Music Club (3)
    { club: music,
      title: 'Open Mic Night — March Edition',
      body: 'Monthly open-mic for solos, duets, and instrumentals. Sign up at the door. 3-minute slots per act.',
      eventDate: past(60), venue: 'Amphitheatre',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 20, attendRate: 0.70 },
    { club: music,
      title: 'Western Music Workshop',
      body: 'Two-day intensive: guitar fundamentals, music theory, and vocal warm-up exercises. Limited to 25 seats.',
      eventDate: past(15), venue: 'Music Room',
      isPaid: true, amount: 299,
      paymentConfig: { enabled: true, amount: 299, recipient: { upiId: 'music@sinhgad', name: 'Music Club' } },
      totalReg: 14, attendRate: 0.71, paidSplit: { approved: 10, pending: 4 } },
    { club: music,
      title: 'Annual Music Night 2026',
      body: 'The flagship event of the year. Headlining acts, band performances, and battle of the bands. All welcome.',
      eventDate: future(15), venue: 'College Auditorium',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 25, attendRate: 0 },

    // AI/ML Club (3)
    { club: aiml,
      title: 'Paper Reading: Attention Is All You Need',
      body: 'Monthly paper reading. Divya leads the walkthrough of the transformer architecture. Bring your questions.',
      eventDate: past(80), venue: 'Seminar Hall C',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 15, attendRate: 0.60 },
    { club: aiml,
      title: 'Kaggle Competition Bootcamp',
      body: 'Two-day bootcamp: EDA, feature engineering, ensembling, and Kaggle submission strategy. Bring a laptop.',
      eventDate: past(35), venue: 'Computer Lab 3',
      isPaid: true, amount: 249,
      paymentConfig: { enabled: true, amount: 249, recipient: { upiId: 'aiml@sinhgad', name: 'AI/ML Club' } },
      totalReg: 10, attendRate: 0.80, paidSplit: { approved: 7, pending: 3 } },
    { club: aiml,
      title: 'Fine-tuning Workshop: Build Your Own GPT',
      body: 'Hands-on fine-tuning of a small LLM on custom data using Hugging Face Transformers. GPU cloud credits provided.',
      eventDate: future(28), venue: 'Computer Lab 3',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 9, attendRate: 0 },

    // Sports Club (3)
    { club: sports,
      title: 'Inter-Department Football Tournament',
      body: '5v5 football tournament across all departments. Register your team by Friday. Top 3 teams win trophies.',
      eventDate: past(50), venue: 'Football Ground',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 20, attendRate: 0.65 },
    { club: sports,
      title: 'Annual Sports Week — Registration Open',
      body: 'Sign up for 8 events: 100m, shot put, long jump, cricket, volleyball, and more. One registration covers all.',
      eventDate: past(20), venue: 'Sports Complex',
      isPaid: true, amount: 99,
      paymentConfig: { enabled: true, amount: 99, recipient: { upiId: 'sports@sinhgad', name: 'Sports Club' } },
      totalReg: 18, attendRate: 0.78, paidSplit: { approved: 14, pending: 4 } },
    { club: sports,
      title: 'Badminton Singles Championship',
      body: 'Open campus badminton singles draw. Mixed-level brackets. Register individually. Courts booked all day.',
      eventDate: future(7), venue: 'Indoor Sports Hall',
      isPaid: false, amount: 0, paymentConfig: { enabled: false, amount: 0 },
      totalReg: 12, attendRate: 0 },
  ];

  const regBatch = [];

  for (const def of eventDefs) {
    // Idempotent: reuse existing post if title+club already exists
    let post = await Post.findOne({ type: 'Event', title: def.title, club: def.club._id, college: COLLEGE }).lean();
    if (!post) {
      post = await Post.create({
        type: 'Event',
        title: def.title,
        body: def.body,
        author: def.club.president._id,
        club: def.club._id,
        tag: clubTag(def.club),
        eventDate: def.eventDate,
        venue: def.venue,
        isPaid: def.isPaid,
        amount: def.amount,
        paymentConfig: def.paymentConfig,
        college: COLLEGE,
      });
      eventsAdded++;
    }

    // Skip registration creation if this post already has registrations
    const existingRegCount = await Registration.countDocuments({ post: post._id });
    if (existingRegCount > 0) continue;

    const isPast = def.eventDate < new Date();
    const attendCount = Math.round(def.totalReg * (def.attendRate || 0));
    const registrants = pickN(allStudents, def.totalReg);

    registrants.forEach((student, i) => {
      const shouldAttend = isPast && i < attendCount;

      let paymentStatus = 'free';
      let ticketId = crypto.randomUUID();

      if (def.isPaid && def.paidSplit) {
        if (i < def.paidSplit.approved) {
          paymentStatus = 'approved';
        } else {
          paymentStatus = 'pending_verification';
          ticketId = null; // sparse — no ticket until approved
        }
      }

      const reg = {
        post: post._id,
        registrant: student._id,
        club: def.club._id,
        attended: shouldAttend,
        attendedAt: shouldAttend ? def.eventDate : undefined,
        paymentStatus,
        college: COLLEGE,
      };
      if (ticketId) reg.ticketId = ticketId;
      regBatch.push(reg);
    });
  }

  if (!regBatch.length) {
    console.log('No new registrations to insert (all events already have registrations)');
  }
  // Use the raw MongoDB driver so absent ticketId fields are truly omitted
  // (Mongoose insertMany coerces missing String paths to null, which breaks
  // the sparse unique index on ticketId for pending_verification docs)
  if (regBatch.length) await Registration.collection.insertMany(
    regBatch.map(doc => { const d = { ...doc }; if (!d.ticketId) delete d.ticketId; return d; }),
    { ordered: false }
  );
  registrationsCreated = regBatch.length;
  console.log(`Added ${eventsAdded} events, ${registrationsCreated} registrations`);

  // ── 4. Recruitment posts ─────────────────────────────────────────────────
  // Find clubs that already have an active recruitment post
  const activeRecruitPosts = await Post.find({ type: 'Recruitment', isActive: true, college: COLLEGE }).lean();
  const activeClubIds = new Set(activeRecruitPosts.map(p => p.club?.toString()));

  const recruitInserts = [];
  const appBatch = [];

  for (const club of [robotics, gdsc, music, aiml, sports]) {
    const tag = clubTag(club);
    const presidentId = club.president._id;

    // Active post — only if one doesn't already exist
    if (!activeClubIds.has(club._id.toString())) {
      recruitInserts.push({
        type: 'Recruitment',
        title: `${club.name} — Open Recruitment`,
        body: `${club.name} is now accepting applications! We welcome students from all years and departments. Apply before the deadline.`,
        author: presidentId,
        club: club._id,
        tag,
        isActive: true,
        registrationDeadline: future(30),
        college: COLLEGE,
      });
    }

    // Closed historical post — add one per club for Gemini comparison data (skip if already exists)
    const closedTitle = `${club.name} — Recruitment Drive S1 2025 (Closed)`;
    const closedExists = await Post.exists({ type: 'Recruitment', title: closedTitle, club: club._id });
    if (closedExists) continue;
    recruitInserts.push({
      type: 'Recruitment',
      title: `${club.name} — Recruitment Drive S1 2025 (Closed)`,
      body: `Last semester's recruitment drive for ${club.name}. Applications are now closed. Thank you to all who applied.`,
      author: presidentId,
      club: club._id,
      tag,
      isActive: false,
      registrationDeadline: past(90),
      college: COLLEGE,
    });
  }

  const recruitPosts = recruitInserts.length ? await Post.insertMany(recruitInserts) : [];
  recruitPostsAdded = recruitPosts.length;

  // Applications for each closed post — mixed accept/reject/pending
  const statusCycle = ['accepted', 'accepted', 'rejected', 'accepted', 'rejected', 'pending', 'accepted', 'rejected'];
  const closedPosts = recruitPosts.filter(p => !p.isActive);

  for (const post of closedPosts) {
    const applicants = pickN(allStudents, 8);
    applicants.forEach((student, i) => {
      appBatch.push({
        post: post._id,
        applicant: student._id,
        club: post.club,
        status: statusCycle[i % statusCycle.length],
        college: COLLEGE,
      });
    });
  }

  // ordered: false so duplicate-key collisions are skipped gracefully
  if (appBatch.length) await Application.insertMany(appBatch, { ordered: false });
  console.log(`Added ${recruitPostsAdded} recruitment posts, ${appBatch.length} historical applications`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✓ seedExtra complete');
  console.log(`  Students added:            ${studentsAdded}`);
  console.log(`  Events added:              ${eventsAdded}`);
  console.log(`  Registrations created:     ${registrationsCreated}`);
  console.log(`  Recruitment posts added:   ${recruitPostsAdded}`);

  await mongoose.disconnect();
}

seedExtra().catch((err) => {
  console.error('seedExtra failed:', err.message);
  process.exit(1);
});
