require('dotenv').config();
// Fix: Node.js v17+ DNS order + force public DNS for mongodb+srv:// on Windows
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User         = require('./models/User');
const Club         = require('./models/Club');
const Community    = require('./models/Community');
const Post         = require('./models/Post');
const Application  = require('./models/Application');
const Registration = require('./models/Registration');
const Connection   = require('./models/Connection');
const Message      = require('./models/Message');
const Announcement = require('./models/Announcement');
const Discussion   = require('./models/Discussion');
const CommunityMessage = require('./models/CommunityMessage');
const CommunityAnnouncement = require('./models/CommunityAnnouncement');

const COLLEGE = 'SINHGAD_ENGINEERING';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Drop all collections cleanly
  await Promise.all([
    User.deleteMany({}),
    Club.deleteMany({}),
    Community.deleteMany({}),
    Post.deleteMany({}),
    Application.deleteMany({}),
    Registration.deleteMany({}),
    Connection.deleteMany({}),
    Message.deleteMany({}),
    Announcement.deleteMany({}),
    Discussion.deleteMany({}),
    CommunityMessage.deleteMany({}),
    CommunityAnnouncement.deleteMany({}),
  ]);
  console.log('Collections cleared');

  const adminHash = await bcrypt.hash('CampusNet@123', 10);

  // ─── Admin ────────────────────────────────────────────────────────────────
  await User.create({
    email: 'admin@sinhgad.edu',
    passwordHash: adminHash,
    firstName: 'Campus',
    lastName: 'Admin',
    role: 'admin',
    mustChangePassword: false,
    college: COLLEGE,
  });

  // ─── Students ─────────────────────────────────────────────────────────────
  // Password: motherName.toLowerCase() + '@' + birthDate (DDMMYY)
  const studentDefs = [
    // FE — joined 2025
    { firstName: 'Arjun', lastName: 'Sharma', dept: 'COMP', year: 'FE', jy: 2025, num: '001', motherName: 'Sunita', birthDate: '150807',
      bio: 'First-year CS student exploring web dev and competitive programming. Love building side projects on weekends.',
      skills: ['JavaScript', 'React', 'Python', 'Git'] },
    { firstName: 'Priya', lastName: 'Patel', dept: 'COMP', year: 'FE', jy: 2025, num: '002', motherName: 'Kavitha', birthDate: '220806',
      bio: 'Aspiring full-stack developer. Currently learning the MERN stack and dabbling in UI design.',
      skills: ['HTML', 'CSS', 'JavaScript', 'Figma', 'Node.js'] },
    { firstName: 'Rohan', lastName: 'Desai', dept: 'ENTC', year: 'FE', jy: 2025, num: '001', motherName: 'Meena', birthDate: '030807',
      bio: 'Photography enthusiast and electronics tinkerer. Camera in one hand, soldering iron in the other.',
      skills: ['Photography', 'Lightroom', 'Arduino', 'Circuit Design'] },
    { firstName: 'Ananya', lastName: 'Joshi', dept: 'IT', year: 'FE', jy: 2025, num: '001', motherName: 'Rekha', birthDate: '120807',
      bio: 'Classical singer and aspiring product designer. Believe great design is invisible.',
      skills: ['UI Design', 'Figma', 'Hindustani Classical', 'Songwriting'] },
    { firstName: 'Vikram', lastName: 'Kulkarni', dept: 'MECH', year: 'FE', jy: 2025, num: '001', motherName: 'Savita', birthDate: '280706',
      bio: 'Mechanical engineering student passionate about robotics and CAD. State-level cricket player.',
      skills: ['SolidWorks', 'AutoCAD', 'Cricket', 'Manufacturing'] },
    // SE — joined 2024
    { firstName: 'Sneha', lastName: 'Iyer', dept: 'COMP', year: 'SE', jy: 2024, num: '001', motherName: 'Lakshmi', birthDate: '150605',
      bio: 'GDSC member working on Flutter apps. Open-source contributor and hackathon regular.',
      skills: ['Flutter', 'Dart', 'Firebase', 'Android', 'Git'] },
    { firstName: 'Rahul', lastName: 'Nair', dept: 'COMP', year: 'SE', jy: 2024, num: '002', motherName: 'Priya', birthDate: '070605',
      bio: 'Full-stack dev managing the Web Dev Forum community. Always down to ship something this weekend.',
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'] },
    { firstName: 'Kavya', lastName: 'Rao', dept: 'ENTC', year: 'SE', jy: 2024, num: '001', motherName: 'Usha', birthDate: '190505',
      bio: 'UI/UX designer running the Designers Guild community. Coffee-fueled illustrator.',
      skills: ['Figma', 'Illustrator', 'UX Research', 'Prototyping', 'Webflow'] },
    { firstName: 'Aditya', lastName: 'Mehta', dept: 'IT', year: 'SE', jy: 2024, num: '001', motherName: 'Shobha', birthDate: '230605',
      bio: 'ML enthusiast running AI Hub. Currently building a sentiment analysis pipeline for college reviews.',
      skills: ['Python', 'PyTorch', 'NLP', 'Pandas', 'scikit-learn'] },
    { firstName: 'Pooja', lastName: 'Singh', dept: 'MECH', year: 'SE', jy: 2024, num: '001', motherName: 'Anita', birthDate: '110505',
      bio: 'Aerospace nerd and varsity basketball player. Interning at a drone startup this summer.',
      skills: ['CATIA', 'MATLAB', 'Basketball', 'Aerodynamics'] },
    // TE — joined 2023
    { firstName: 'Karan', lastName: 'Verma', dept: 'COMP', year: 'TE', jy: 2023, num: '001', motherName: 'Nirmala', birthDate: '040304',
      bio: 'President of Robotics Club. Built a state-champion autonomous bot last semester.',
      skills: ['C++', 'ROS', 'Computer Vision', 'Embedded Systems', 'Python'] },
    { firstName: 'Ishaan', lastName: 'Thakur', dept: 'ENTC', year: 'TE', jy: 2023, num: '001', motherName: 'Sudha', birthDate: '160304',
      bio: 'Signal processing geek. Building a low-cost EEG headset as a final-year project.',
      skills: ['MATLAB', 'Signal Processing', 'Embedded C', 'PCB Design'] },
    { firstName: 'Divya', lastName: 'Gupta', dept: 'ENTC', year: 'TE', jy: 2023, num: '002', motherName: 'Pallavi', birthDate: '250304',
      bio: 'President of AI/ML Club. Researching computer vision for sustainable agriculture.',
      skills: ['Python', 'TensorFlow', 'Computer Vision', 'Research', 'LaTeX'] },
    { firstName: 'Siddharth', lastName: 'Bhat', dept: 'IT', year: 'TE', jy: 2023, num: '001', motherName: 'Vandana', birthDate: '080403',
      bio: 'Robotics Club member and backend developer. Loves distributed systems and Kubernetes.',
      skills: ['Go', 'Kubernetes', 'Docker', 'PostgreSQL', 'Linux'] },
    { firstName: 'Meera', lastName: 'Pillai', dept: 'MECH', year: 'TE', jy: 2023, num: '001', motherName: 'Radha', birthDate: '300303',
      bio: 'Manager of Startup Circle. Working on an EdTech MVP with 50 beta users.',
      skills: ['Product Management', 'No-Code', 'Notion', 'User Research', 'Bubble'] },
    // BE — joined 2022
    { firstName: 'Tanvi', lastName: 'Sawant', dept: 'COMP', year: 'BE', jy: 2022, num: '001', motherName: 'Swapna', birthDate: '290703',
      bio: 'President of GDSC. Google Cloud Certified and organizer of Dev Fest 2025.',
      skills: ['Google Cloud', 'Kotlin', 'Android', 'Firebase', 'Public Speaking'] },
    { firstName: 'Nikhil', lastName: 'Kadam', dept: 'ENTC', year: 'BE', jy: 2022, num: '001', motherName: 'Poonam', birthDate: '140302',
      bio: 'President of Sports Club and state-level football player. Captain of the inter-college team.',
      skills: ['Football', 'Sports Management', 'Event Planning', 'Leadership'] },
    { firstName: 'Shreya', lastName: 'Pandey', dept: 'IT', year: 'BE', jy: 2022, num: '001', motherName: 'Madhuri', birthDate: '050203',
      bio: 'President of Music Club. Trained vocalist and guitar player. Annual Music Night organizer.',
      skills: ['Vocal Performance', 'Guitar', 'Music Production', 'Event Planning'] },
    { firstName: 'Yash', lastName: 'Patil', dept: 'IT', year: 'BE', jy: 2022, num: '002', motherName: 'Kalpana', birthDate: '170203',
      bio: 'Final-year IT student, co-founder of an AI side-project. Hackathon junkie.',
      skills: ['React', 'OpenAI API', 'Next.js', 'Stripe', 'Vercel'] },
    { firstName: 'Riya', lastName: 'Gaikwad', dept: 'MECH', year: 'BE', jy: 2022, num: '001', motherName: 'Seema', birthDate: '220302',
      bio: 'Mechanical final-year, lead on Formula Student aerodynamics team. Off-track, a serious chess player.',
      skills: ['CFD', 'ANSYS', 'Chess', 'Manufacturing', 'Composites'] },
  ];

  const students = await User.insertMany(
    await Promise.all(studentDefs.map(async ({ firstName, lastName, dept, year, jy, num, motherName, birthDate, bio, skills }) => {
      const rollNumber = `${year.toLowerCase()}${jy}${dept.toLowerCase()}${num}`;
      const password = `${motherName.toLowerCase()}@${birthDate}`;
      const passwordHash = await bcrypt.hash(password, 10);
      return {
        rollNumber,
        email: `${firstName.toLowerCase()}.${rollNumber}@sinhgad.edu`,
        passwordHash,
        firstName,
        lastName,
        role: 'student',
        department: dept,
        year,
        joinYear: jy,
        mustChangePassword: true,
        motherName,
        birthDate,
        bio,
        skills,
        college: COLLEGE,
      };
    }))
  );

  const [
    arjun, priya, rohan, ananya, vikram,      // FE  [0-4]
    sneha, rahul, kavya, aditya, pooja,       // SE  [5-9]
    karan, ishaan, divya, siddharth, meera,   // TE  [10-14]
    tanvi, nikhil, shreya, yash, riya,        // BE  [15-19]
  ] = students;

  console.log(`Created ${students.length} students`);

  // ─── Clubs ────────────────────────────────────────────────────────────────
  // Multi-state proof: rahul = GDSC member (via accepted application) +
  //                           Web Dev Forum manager (set below in communities)
  const [robotics, gdsc, music, aiml, sports] = await Club.insertMany([
    {
      name: 'Robotics Club',
      logoEmoji: '🤖',
      description: 'The Robotics Club builds autonomous robots that compete at state and national level. From line-followers to ROS-based manipulators, we cover the full stack: mechanical design, embedded electronics, and computer vision. Workshops are open to all years.',
      tags: ['Technical', 'Creative'],
      president: karan._id,
      members: [karan._id, siddharth._id],
      college: COLLEGE,
    },
    {
      name: 'GDSC',
      logoEmoji: '💻',
      description: 'Google Developer Student Club — Sinhgad chapter. We host Dev Fests, study jams, and hackathons throughout the year. Whether you are into Android, Cloud, Web, or ML, GDSC is where you ship, learn, and meet your next collaborator.',
      tags: ['Technical'],
      president: tanvi._id,
      members: [tanvi._id, sneha._id, rahul._id],
      college: COLLEGE,
    },
    {
      name: 'Music Club',
      logoEmoji: '🎵',
      description: 'Classical, western, fusion — if it has rhythm, we play it. Weekly open-mic nights, campus jam sessions, and the flagship Music Night every May. Auditions are open to all departments.',
      tags: ['Cultural', 'Creative'],
      president: shreya._id,
      members: [shreya._id, ananya._id],
      college: COLLEGE,
    },
    {
      name: 'AI/ML Club',
      logoEmoji: '🧠',
      description: 'A research-focused club for students interested in machine learning, deep learning, and applied AI. We run weekly paper readings, build agriculture and healthcare ML projects, and mentor students preparing for AI research internships.',
      tags: ['Technical'],
      president: divya._id,
      members: [divya._id, ishaan._id, aditya._id],
      college: COLLEGE,
    },
    {
      name: 'Sports Club',
      logoEmoji: '🏅',
      description: 'The home of all things sports on campus. We organize inter-college tournaments, intra-college leagues, and the annual sports week. Football, cricket, basketball, badminton — pick your battle.',
      tags: ['Sports'],
      president: nikhil._id,
      members: [nikhil._id, vikram._id, pooja._id],
      college: COLLEGE,
    },
  ]);
  console.log('Created 5 clubs');

  // ─── Communities ──────────────────────────────────────────────────────────
  // rahul is manager of Web Dev Forum → multi-state with GDSC membership above
  const [webdev, aihub, startup, designers, photography] = await Community.insertMany([
    {
      name: 'Web Dev Forum',
      icon: '🌐',
      description: 'A place for web builders — React, Next.js, Node, anything that ships. Share what you are working on, get code reviews, and find collab partners for weekend projects.',
      tags: ['Web', 'JavaScript', 'React', 'Node'],
      manager: rahul._id,
      members: [rahul._id, arjun._id, priya._id, sneha._id, karan._id],
      status: 'approved',
      college: COLLEGE,
    },
    {
      name: 'AI Hub',
      icon: '🤖',
      description: 'For students into machine learning, deep learning, and AI research. Paper discussions, project collabs, and a steady stream of papers worth reading.',
      tags: ['AI', 'ML', 'Research', 'Python'],
      manager: aditya._id,
      members: [aditya._id, divya._id, tanvi._id, ishaan._id, yash._id],
      status: 'approved',
      college: COLLEGE,
    },
    {
      name: 'Startup Circle',
      icon: '🚀',
      description: 'For founders, aspiring founders, and side-project builders. Pitch ideas, find co-founders, and learn how to ship your MVP in a weekend.',
      tags: ['Startups', 'Entrepreneurship', 'Product'],
      manager: meera._id,
      members: [meera._id, siddharth._id, yash._id, riya._id, kavya._id],
      status: 'approved',
      college: COLLEGE,
    },
    {
      name: 'Designers Guild',
      icon: '🎨',
      description: 'UI/UX, graphic design, illustration, and motion. Critiques, design challenges, and a curated feed of inspiration. Everyone welcome — from beginners to senior designers.',
      tags: ['Design', 'UI/UX', 'Illustration'],
      manager: kavya._id,
      members: [kavya._id, ananya._id, rohan._id, priya._id],
      status: 'approved',
      college: COLLEGE,
    },
    {
      name: 'Photography Club',
      icon: '📸',
      description: 'Campus photography, photo walks, and digital zines. Monthly themes, weekly critiques, and a chance to be featured in the campus zine.',
      tags: ['Photography', 'Visual Arts'],
      manager: rohan._id,
      members: [rohan._id, vikram._id, pooja._id, meera._id],
      status: 'approved',
      college: COLLEGE,
    },
  ]);
  console.log('Created 5 communities');

  // ─── Posts ────────────────────────────────────────────────────────────────
  const future = (days) => new Date(Date.now() + days * 86400000);

  const [
    gdscRecruit, roboticsRecruit, aimlRecruit,
    aiHackathon, roboticsWorkshop,
    gdscGeneral, roboticsGeneral, musicGeneral,
    collabWebDev, collabAI, collabStartup, collabDesign, collabPhoto,
  ] = await Post.insertMany([
    // Recruitment (3)
    {
      type: 'Recruitment',
      title: 'GDSC is Recruiting!',
      body: 'We are looking for passionate developers to join GDSC. Open to all branches and years. Apply now!',
      author: tanvi._id, club: gdsc._id, tag: 'Technical', isActive: true, college: COLLEGE,
    },
    {
      type: 'Recruitment',
      title: 'Robotics Club — Open Positions',
      body: 'Join the Robotics Club! Looking for mechanical and software enthusiasts ready to compete.',
      author: karan._id, club: robotics._id, tag: 'Technical', isActive: true, college: COLLEGE,
    },
    {
      type: 'Recruitment',
      title: 'AI/ML Club — New Members Wanted',
      body: 'Seeking students passionate about machine learning and data science. Applications closed.',
      author: divya._id, club: aiml._id, tag: 'Technical', isActive: false, college: COLLEGE,
    },
    // Events (2)
    {
      type: 'Event',
      title: 'AI Hackathon 2026',
      body: '24-hour hackathon focused on AI solutions for campus problems. Teams of 2–4. Free food and swag!',
      author: tanvi._id, club: gdsc._id, tag: 'Technical',
      eventDate: future(14), venue: 'Main Seminar Hall',
      paymentConfig: { enabled: false, amount: 0 },
      college: COLLEGE,
    },
    {
      type: 'Event',
      title: 'Robotics Workshop: ROS Basics',
      body: 'Hands-on introduction to Robot Operating System. Bring your laptop. Seats limited to 30.',
      author: karan._id, club: robotics._id, tag: 'Technical',
      eventDate: future(7), venue: 'Lab 204',
      paymentConfig: { enabled: false, amount: 0 },
      college: COLLEGE,
    },
    // General (3)
    {
      type: 'General',
      title: 'GDSC Dev Fest Recap',
      body: 'What an amazing Dev Fest! Thank you to all 120 attendees. Slides and recordings are on the drive.',
      author: tanvi._id, club: gdsc._id, tag: 'Technical', college: COLLEGE,
    },
    {
      type: 'General',
      title: 'Robotics Club Wins State Championship 🏆',
      body: 'Our autonomous bot placed 1st at the Maharashtra Robotics Championship 2026. Proud of the team!',
      author: karan._id, club: robotics._id, tag: 'Technical', college: COLLEGE,
    },
    {
      type: 'General',
      title: 'Music Night — Save the Date',
      body: 'Annual Music Night is on May 15th. Auditions open next week for solo and group acts.',
      author: shreya._id, club: music._id, tag: 'Cultural', college: COLLEGE,
    },
    // Collab — community channel posts (5)
    {
      type: 'Collab',
      title: 'Looking for React + Node collab partner',
      body: 'Building a campus events aggregator. Need a backend-focused partner. DM me to discuss!',
      author: rahul._id, community: webdev._id, tag: 'Technical', college: COLLEGE,
    },
    {
      type: 'Collab',
      title: 'NLP research collab',
      body: 'Working on sentiment analysis of college reviews. Looking for 1–2 partners with ML background.',
      author: aditya._id, community: aihub._id, tag: 'Technical', college: COLLEGE,
    },
    {
      type: 'Collab',
      title: 'Co-founder wanted for EdTech startup',
      body: 'Have a working MVP with 50 beta users. Looking for a co-founder with design or marketing background.',
      author: meera._id, community: startup._id, tag: 'Other', college: COLLEGE,
    },
    {
      type: 'Collab',
      title: 'UI redesign collab — open source project',
      body: 'Redesigning UI for a popular open-source tool. Need 2 designers for a 4-week sprint.',
      author: kavya._id, community: designers._id, tag: 'Creative', college: COLLEGE,
    },
    {
      type: 'Collab',
      title: 'Photo walk + digital zine collab',
      body: 'Planning a monthly campus photo walk and want to compile a digital zine. Photographers welcome!',
      author: rohan._id, community: photography._id, tag: 'Creative', college: COLLEGE,
    },
  ]);
  console.log('Created 13 posts (3 recruitment, 2 event, 3 general, 5 collab)');

  // ─── Applications ─────────────────────────────────────────────────────────
  // sneha + rahul accepted into GDSC (their entries already reflected in Club.members above)
  // rahul proves multi-state: GDSC member + Web Dev Forum manager
  await Application.insertMany([
    { post: gdscRecruit._id,      applicant: arjun._id,     club: gdsc._id,     status: 'pending',  college: COLLEGE },
    { post: gdscRecruit._id,      applicant: priya._id,     club: gdsc._id,     status: 'pending',  college: COLLEGE },
    { post: gdscRecruit._id,      applicant: sneha._id,     club: gdsc._id,     status: 'accepted', college: COLLEGE },
    { post: gdscRecruit._id,      applicant: rahul._id,     club: gdsc._id,     status: 'accepted', college: COLLEGE },
    { post: roboticsRecruit._id,  applicant: vikram._id,    club: robotics._id, status: 'pending',  college: COLLEGE },
    { post: roboticsRecruit._id,  applicant: ishaan._id,    club: robotics._id, status: 'rejected', college: COLLEGE },
    { post: roboticsRecruit._id,  applicant: siddharth._id, club: robotics._id, status: 'accepted', college: COLLEGE },
  ]);
  console.log('Created 7 applications');

  // ─── Registrations ────────────────────────────────────────────────────────
  const regDefs = [
    // AI Hackathon — 5 registrations, 3 attended (past event for stats demo)
    { post: aiHackathon._id,      registrant: arjun._id,     attended: true  },
    { post: aiHackathon._id,      registrant: priya._id,     attended: false },
    { post: aiHackathon._id,      registrant: rohan._id,     attended: true  },
    { post: aiHackathon._id,      registrant: ananya._id,    attended: false },
    { post: aiHackathon._id,      registrant: karan._id,     attended: true  },
    // Robotics Workshop — 5 registrations, all pending (future event)
    { post: roboticsWorkshop._id, registrant: vikram._id,    attended: false },
    { post: roboticsWorkshop._id, registrant: sneha._id,     attended: false },
    { post: roboticsWorkshop._id, registrant: rahul._id,     attended: false },
    { post: roboticsWorkshop._id, registrant: pooja._id,     attended: false },
    { post: roboticsWorkshop._id, registrant: siddharth._id, attended: false },
  ];

  await Registration.insertMany(
    regDefs.map(({ post, registrant, attended }) => ({
      post,
      registrant,
      ticketId: crypto.randomUUID(),
      attended,
      attendedAt: attended ? new Date() : undefined,
      paymentStatus: 'free',
      college: COLLEGE,
    }))
  );
  console.log('Created 10 registrations');

  // ─── Discussion threads (seeded, read-only in Phase 3.2) ─────────────────
  const discussionDefs = [
    // Web Dev Forum
    {
      community: webdev._id, author: rahul._id,
      title: 'Best state management for a side project in 2026?',
      body: 'I\'m starting a small SaaS side project. Got burned by Redux boilerplate last year. Considering Zustand vs Jotai vs just plain Context+reducer. What\'s the team consensus here?\n\nBackend will be Node + Postgres. Frontend React + Vite.',
      upvotes: 42,
      comments: [
        { author: arjun._id, body: 'Zustand. Two weeks ago I migrated a 6-screen app from Redux to Zustand and the diff was net -800 lines. Just works.' },
        { author: priya._id, body: 'Jotai if your state is mostly derived/atomic. Zustand if it\'s mostly action-driven. I\'ve shipped both in production.' },
        { author: sneha._id, body: 'Honestly Context + useReducer is fine for under ~20 atoms. Don\'t over-engineer.' },
      ],
    },
    {
      community: webdev._id, author: priya._id,
      title: 'Tailwind v4 vs v3 — worth the migration?',
      body: 'Tailwind v4 dropped the config file and went CSS-first. Anyone who\'s migrated, was it painful? Worth doing on a mid-sized app?',
      upvotes: 28,
      comments: [
        { author: rahul._id, body: 'Did the upgrade for our internal dashboard last month. Took ~2 hours for a ~40 component app. Mostly just removing tailwind.config.js and moving theme tokens to @theme blocks.' },
        { author: arjun._id, body: 'The auto-CSS-variable thing is genuinely a quality of life win.' },
      ],
    },
    {
      community: webdev._id, author: sneha._id,
      title: 'Anyone shipped an app with React Server Components yet?',
      body: 'How\'s the developer experience? Worth picking up RSCs for a new project or stick with client-only React + a normal API?',
      upvotes: 15,
      comments: [
        { author: rahul._id, body: 'Used Next 15 RSCs for a content-heavy site. Page loads are noticeably faster but the mental model takes a week to click.' },
      ],
    },

    // AI Hub
    {
      community: aihub._id, author: aditya._id,
      title: 'Paper rec: "Mixture of Depths" — variable compute per token',
      body: 'Just read https://arxiv.org/abs/2404.02258 — they route tokens through different numbers of transformer layers based on importance. Very clean ablation. Worth a deep read for anyone working on efficient inference.',
      upvotes: 67,
      comments: [
        { author: kavya._id, body: 'Reminds me of early-exit transformers from 2020 but with a cleaner routing module. Did they release weights?' },
        { author: aditya._id, body: '@kavya only the routing module, full weights not released afaik.' },
        { author: arjun._id, body: 'Going to try implementing the routing layer this weekend. Will report back.' },
      ],
    },
    {
      community: aihub._id, author: kavya._id,
      title: 'Best local LLM for code completion right now (Mac M-series)?',
      body: 'I\'ve been bouncing between Qwen2.5-Coder-7B and DeepSeek-Coder-V2-Lite-Instruct on my M2 Pro. Curious what other folks are running locally for code tasks.',
      upvotes: 33,
      comments: [
        { author: aditya._id, body: 'Qwen2.5-Coder-32B-Instruct at 4-bit if you have 32GB. Quality jump is real.' },
        { author: rahul._id, body: 'I\'ve started just using Claude Code for serious work and reserving local models for offline / privacy stuff.' },
      ],
    },
    {
      community: aihub._id, author: arjun._id,
      title: 'How do you handle hallucinations in production RAG systems?',
      body: 'Building an internal Q&A tool over our company docs. ~80% of answers are good, but the 20% confident-wrong answers are the deal-breaker for adoption. What guardrails are people using?',
      upvotes: 51,
      comments: [
        { author: aditya._id, body: 'Cite-or-die: prompt the model to either cite a chunk or refuse. Drops hallucinations massively at the cost of some recall.' },
        { author: kavya._id, body: 'We added a separate "verify" pass that re-asks "is this answer supported by the cited chunks, yes/no?". Slow but cuts hallucination ~70%.' },
      ],
    },

    // Startup Circle
    {
      community: startup._id, author: meera._id,
      title: 'Looking for a technical co-founder — when to bring them in vs. solo until MVP?',
      body: 'I\'ve been a solo non-technical founder for 3 months, have ~30 paying users on a no-code MVP. Some people say "wait until traction is undeniable", others say "the longer you wait the worse the equity conversation gets". What\'s the honest answer?',
      upvotes: 39,
      comments: [
        { author: rahul._id, body: '30 paying users IS undeniable traction at the pre-seed level. Bring someone in now, while you can still offer real equity without anyone feeling like they\'re a contractor.' },
        { author: aditya._id, body: 'Counter: if you can survive 3 more months on no-code, the technical co-founder you can attract will be 5x better. Depends on runway.' },
      ],
    },
    {
      community: startup._id, author: rahul._id,
      title: 'India-specific: best banks for early-stage startup current account?',
      body: 'Just registered Pvt Ltd. Need a current account that won\'t be a nightmare for international payments (we\'ll have US customers). HDFC vs ICICI vs Razorpay X — anyone with recent experience?',
      upvotes: 22,
      comments: [
        { author: meera._id, body: 'Razorpay X for ops, ICICI for the legal account. We do this combo, no regrets.' },
      ],
    },

    // Designers Guild
    {
      community: designers._id, author: kavya._id,
      title: 'How do you give design critique without crushing people?',
      body: 'I run our design critique sessions every Friday. New designers freeze up. Senior designers go too hard. What frameworks do you use to keep it useful AND psychologically safe?',
      upvotes: 18,
      comments: [
        { author: ananya._id, body: 'We use "I notice / I wonder / I suggest". Frames criticism as observation + curiosity instead of judgement.' },
        { author: kavya._id, body: 'Going to try this next Friday, thanks 🙏' },
      ],
    },
    {
      community: designers._id, author: ananya._id,
      title: 'Figma variables for design tokens — best practices?',
      body: 'Finally migrated our design system to Figma variables. The collections feature is great but our token naming is becoming a mess. How is your team structuring color / spacing / typography collections?',
      upvotes: 24,
      comments: [
        { author: kavya._id, body: 'We split into Primitives (raw values) / Semantic (intent like surface.elevated) / Component (button.bg.hover). Three-layer model. Worth the effort.' },
      ],
    },

    // Photography Club
    {
      community: photography._id, author: rohan._id,
      title: 'Best location for golden-hour shoots near campus?',
      body: 'Have been going to the hill behind the engineering block for sunsets but the light gets blocked early because of the new tower they\'re building. Anyone scouted alternatives?',
      upvotes: 12,
      comments: [
        { author: vikram._id, body: 'Old library rooftop. Talk to the security guard, he\'s chill. Unobstructed west view.' },
      ],
    },
  ];

  await Discussion.insertMany(discussionDefs);
  console.log(`Created ${discussionDefs.length} discussion threads`);

  // ─── Final count ──────────────────────────────────────────────────────────
  const studentCount = await User.countDocuments({ role: 'student' });
  console.log('\n✓ Seed complete');
  console.log(`  Admin:         1`);
  console.log(`  Students:      ${studentCount}`);
  console.log(`  Clubs:         5`);
  console.log(`  Communities:   5`);
  console.log(`  Posts:         13`);
  console.log(`  Applications:  7`);
  console.log(`  Registrations: 10`);
  console.log(`  Multi-state:   rahul (se2024comp002) → GDSC member + Web Dev Forum manager`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
