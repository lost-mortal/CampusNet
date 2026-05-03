require('dotenv').config();
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
    { firstName: 'Arjun',     lastName: 'Sharma',   dept: 'COMP', year: 'FE', jy: 2025, num: '001', motherName: 'Sunita',   birthDate: '150807' },
    { firstName: 'Priya',     lastName: 'Patel',    dept: 'COMP', year: 'FE', jy: 2025, num: '002', motherName: 'Kavitha',  birthDate: '220806' },
    { firstName: 'Rohan',     lastName: 'Desai',    dept: 'ENTC', year: 'FE', jy: 2025, num: '001', motherName: 'Meena',    birthDate: '030807' },
    { firstName: 'Ananya',    lastName: 'Joshi',    dept: 'IT',   year: 'FE', jy: 2025, num: '001', motherName: 'Rekha',    birthDate: '120807' },
    { firstName: 'Vikram',    lastName: 'Kulkarni', dept: 'MECH', year: 'FE', jy: 2025, num: '001', motherName: 'Savita',   birthDate: '280706' },
    // SE — joined 2024
    { firstName: 'Sneha',     lastName: 'Iyer',     dept: 'COMP', year: 'SE', jy: 2024, num: '001', motherName: 'Lakshmi',  birthDate: '150605' },
    { firstName: 'Rahul',     lastName: 'Nair',     dept: 'COMP', year: 'SE', jy: 2024, num: '002', motherName: 'Priya',    birthDate: '070605' },
    { firstName: 'Kavya',     lastName: 'Rao',      dept: 'ENTC', year: 'SE', jy: 2024, num: '001', motherName: 'Usha',     birthDate: '190505' },
    { firstName: 'Aditya',    lastName: 'Mehta',    dept: 'IT',   year: 'SE', jy: 2024, num: '001', motherName: 'Shobha',   birthDate: '230605' },
    { firstName: 'Pooja',     lastName: 'Singh',    dept: 'MECH', year: 'SE', jy: 2024, num: '001', motherName: 'Anita',    birthDate: '110505' },
    // TE — joined 2023
    { firstName: 'Karan',     lastName: 'Verma',    dept: 'COMP', year: 'TE', jy: 2023, num: '001', motherName: 'Nirmala',  birthDate: '040304' },
    { firstName: 'Ishaan',    lastName: 'Thakur',   dept: 'ENTC', year: 'TE', jy: 2023, num: '001', motherName: 'Sudha',    birthDate: '160304' },
    { firstName: 'Divya',     lastName: 'Gupta',    dept: 'ENTC', year: 'TE', jy: 2023, num: '002', motherName: 'Pallavi',  birthDate: '250304' },
    { firstName: 'Siddharth', lastName: 'Bhat',     dept: 'IT',   year: 'TE', jy: 2023, num: '001', motherName: 'Vandana',  birthDate: '080403' },
    { firstName: 'Meera',     lastName: 'Pillai',   dept: 'MECH', year: 'TE', jy: 2023, num: '001', motherName: 'Radha',    birthDate: '300303' },
    // BE — joined 2022
    { firstName: 'Tanvi',     lastName: 'Sawant',   dept: 'COMP', year: 'BE', jy: 2022, num: '001', motherName: 'Swapna',   birthDate: '290703' },
    { firstName: 'Nikhil',    lastName: 'Kadam',    dept: 'ENTC', year: 'BE', jy: 2022, num: '001', motherName: 'Poonam',   birthDate: '140302' },
    { firstName: 'Shreya',    lastName: 'Pandey',   dept: 'IT',   year: 'BE', jy: 2022, num: '001', motherName: 'Madhuri',  birthDate: '050203' },
    { firstName: 'Yash',      lastName: 'Patil',    dept: 'IT',   year: 'BE', jy: 2022, num: '002', motherName: 'Kalpana',  birthDate: '170203' },
    { firstName: 'Riya',      lastName: 'Gaikwad',  dept: 'MECH', year: 'BE', jy: 2022, num: '001', motherName: 'Seema',    birthDate: '220302' },
  ];

  const students = await User.insertMany(
    await Promise.all(studentDefs.map(async ({ firstName, lastName, dept, year, jy, num, motherName, birthDate }) => {
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
      description: 'Build and compete with autonomous robots at state and national level.',
      tags: ['Technical'],
      president: karan._id,
      members: [karan._id, siddharth._id],
      college: COLLEGE,
    },
    {
      name: 'GDSC',
      description: 'Google Developer Student Club — learn, build, and connect.',
      tags: ['Technical'],
      president: tanvi._id,
      members: [tanvi._id, sneha._id, rahul._id],
      college: COLLEGE,
    },
    {
      name: 'Music Club',
      description: 'Classical and western music, open-mic nights, and campus jams.',
      tags: ['Cultural'],
      president: shreya._id,
      members: [shreya._id, ananya._id],
      college: COLLEGE,
    },
    {
      name: 'AI/ML Club',
      description: 'Research group for machine learning, deep learning, and AI applications.',
      tags: ['Technical'],
      president: divya._id,
      members: [divya._id, ishaan._id, aditya._id],
      college: COLLEGE,
    },
    {
      name: 'Sports Club',
      description: 'Inter-college sports events and intra-college tournaments.',
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
      description: 'Web technologies, frameworks, and project collabs.',
      manager: rahul._id,
      members: [rahul._id, arjun._id, priya._id, sneha._id, karan._id],
      status: 'approved',
      college: COLLEGE,
    },
    {
      name: 'AI Hub',
      description: 'AI research, papers, and project collaborations.',
      manager: aditya._id,
      members: [aditya._id, divya._id, tanvi._id, ishaan._id, yash._id],
      status: 'approved',
      college: COLLEGE,
    },
    {
      name: 'Startup Circle',
      description: 'Entrepreneurs, founders, and side-project builders.',
      manager: meera._id,
      members: [meera._id, siddharth._id, yash._id, riya._id, kavya._id],
      status: 'approved',
      college: COLLEGE,
    },
    {
      name: 'Designers Guild',
      description: 'UI/UX, graphic design, and visual arts.',
      manager: kavya._id,
      members: [kavya._id, ananya._id, rohan._id, priya._id],
      status: 'approved',
      college: COLLEGE,
    },
    {
      name: 'Photography Club',
      description: 'Campus photography, photo walks, and digital zines.',
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
