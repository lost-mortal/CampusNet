export const FEED_ITEMS = [
    {
        _id: "evt_001",
        type: "event",
        title: "RoboWar 2026",
        clubName: "Robotics Club",
        clubLogo: "🤖",
        date: "2026-03-15",
        category: "Technical",
        description: "Battle of the bots! Build, fight, and win prizes worth $5k.",
        location: "Main Auditorium",
        image: "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=800&q=80"
    },
    {
        _id: "rec_001",
        type: "recruitment",
        title: "Core Team Applications Open",
        clubName: "GDSC Club",
        clubLogo: "G",
        date: "2026-02-20", // Added just to have a date for sorting/display
        category: "Recruitment",
        description: "We are looking for a Social Media Lead and 2 Tech Leads for the upcoming tenure.",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
    },
    {
        _id: "collab_001",
        type: "collab",
        authorName: "Sarah Jenkins",
        communityName: "Music Community",
        role: "Guitarist needed",
        timePosted: "2h ago",
        description: "Hey everyone! We're forming a flexible jazz quartet for the upcoming open mic night. We already have a drummer and a pianist. Looking for a rhythmic guitarist who loves improvisation! 🎸",
    },
    {
        _id: "post_001",
        type: "post",
        title: "Drone Test Flight Success!",
        clubName: "Robotics Club",
        clubLogo: "🤖",
        date: "2026-02-10",
        category: "Technical",
        description: "Check out the footage from our latest drone test flight. The stability algorithm is finally working perfectly!",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80" // Tech/Coding image used for generic tech post
    },
    {
        _id: "evt_002",
        type: "event",
        title: "React Workshop",
        clubName: "DevSoc",
        clubLogo: "💻",
        date: "2026-03-18",
        category: "Technical",
        description: "Learn React from scratch with industry experts.",
        location: "Lab 3",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80"
    },
    {
        _id: "evt_003",
        type: "event",
        title: "Jazz Night",
        clubName: "Music Club",
        clubLogo: "🎷",
        date: "2026-03-20",
        category: "Cultural",
        description: "An evening of smooth jazz and good vibes.",
        location: "Amphitheater",
        image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80"
    },
    {
        _id: "collab_002",
        type: "collab",
        authorName: "Mike Chen",
        communityName: "Indie Game Devs",
        role: "Pixel Artist",
        timePosted: "5h ago",
        description: "Working on a 2D roguelike platformer. Need a pixel artist for character sprites and environment assets. It's a passion project but potential for rev-share! 👾",
    },
    {
        _id: "post_002",
        type: "post",
        title: "Gallery Showcase Preview",
        clubName: "Art Club",
        clubLogo: "🎨",
        date: "2026-02-12",
        category: "Cultural",
        description: "A sneak peek at some of the amazing artwork that will be displayed at our upcoming showcase. Don't miss it!",
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80"
    },
    {
        _id: "evt_004",
        type: "event",
        title: "Inter-College Cricket",
        clubName: "Sports Club",
        clubLogo: "🏏",
        date: "2026-03-22",
        category: "Sports",
        description: "Support your team in the semi-finals!",
        location: "College Ground",
        image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80" // General image
    },
    {
        _id: "evt_005",
        type: "event",
        title: "AI Hackathon",
        clubName: "AI/ML Club",
        clubLogo: "🧠",
        date: "2026-03-25",
        category: "Technical",
        description: "24-hour hackathon to solve real-world problems using AI.",
        location: "Innovation Hub",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80"
    },
    {
        _id: "collab_003",
        type: "collab",
        authorName: "Priya Patel",
        communityName: "Film Society",
        role: "Video Editor",
        timePosted: "1d ago",
        description: "Looking for someone to help edit a short documentary about campus life. Premiere Pro or Davinci Resolve preferred. 🎬",
    },
    {
        _id: "evt_006",
        type: "event",
        title: "Drama Fest",
        clubName: "Drama Club",
        clubLogo: "🎭",
        date: "2026-03-28",
        category: "Cultural",
        description: "Showcasing the best plays from our talented students.",
        location: "Auditorium B",
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80"
    },
    {
        _id: "post_003",
        type: "post",
        title: "New Equipment Arrrival",
        clubName: "Photography Club",
        clubLogo: "📸",
        date: "2026-02-15",
        category: "Creative",
        description: "We just received our new set of studio lights and backdrops! Come check them out at the next meeting.",
        image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80"
    }
];

export const USER_DATA = {
    _id: "usr_101",
    name: "Parth", // Using a generic name or the user's name if known
    avatar: "👨‍🎓",
    isClubMember: false, // Set to true to test "My Club"
    role: "fresher", // 'fresher', 'member', 'president'
    clubName: "Robotics Club" // for member/president roles
};

export const ANNOUNCEMENTS = [
    {
        id: 1,
        title: "End Semester Exams Schedule",
        date: "2026-04-10",
        type: "Academic",
        content: "The final exam schedule for Spring 2026 has been released. Check your portal for details."
    },
    {
        id: 2,
        title: "Library Maintenance",
        date: "2026-02-05",
        type: "Facility",
        content: "The main library will be closed for maintenance this Saturday from 9 AM to 2 PM."
    },
    {
        id: 3,
        title: "Inter-College Fest Registration",
        date: "2026-02-20",
        type: "Event",
        content: "Registrations for 'Technova 2026' are now open! Early bird discounts available until Friday."
    },
    {
        id: 4,
        title: "Campus Wi-Fi Upgrade",
        date: "2026-02-10",
        type: "Tech",
        content: "We are upgrading the campus Wi-Fi infrastructure. Expect intermittent downtime on Sunday night."
    }
];

export const COMMUNITIES = [
    {
        _id: "comm_001",
        name: "Web Dev Forum",
        members: "1.2k",
        icon: "🌐",
    },
    {
        _id: "comm_002",
        name: "AI Hub",
        members: "850",
        icon: "🤖",
    },
    {
        _id: "comm_003",
        name: "Startup Circle",
        members: "400",
        icon: "🚀",
    },
    {
        _id: "comm_004",
        name: "Designers Guild",
        members: "600",
        icon: "🎨",
    },
];

export const CLUB_DASHBOARD_DATA = {
    clubDetails: {
        name: "Robotics Club",
        role: "President",
        logo: "🤖"
    },
    channels: [
        { id: "c1", name: "announcements" },
        { id: "c2", name: "general" },
        { id: "c3", name: "projects" }
    ],
    liveOps: [
        { id: "e1", name: "RoboWar Registration", stats: "142 Applicants" },
        { id: "r1", name: "Core Team Recruitment", stats: "12 Applications" }
    ],
    members: [
        { id: "m1", name: "Sarah Jenkins", role: "Tech Lead", status: "online", avatar: "👩‍💻" },
        { id: "m2", name: "Mike Chen", role: "Member", status: "offline", avatar: "👨‍🔧" },
        { id: "m3", name: "Priya Patel", role: "Secretary", status: "online", avatar: "👩‍💼" },
        { id: "m4", name: "Alex Rossi", role: "Designer", status: "idle", avatar: "🎨" },
        { id: "m5", name: "David Kim", role: "Treasurer", status: "offline", avatar: "📊" }
    ]
};

export const PERSONAS = {
    FRESHER: { ...USER_DATA, role: "fresher", clubName: null, isClubMember: false, details: "FE / COMP", clubLogo: null },
    MEMBER: { ...USER_DATA, name: "Aryan", role: "member", clubName: "Robotics Club", isClubMember: true, details: "TE / COMP", clubLogo: "🤖" },
    PRESIDENT: { ...USER_DATA, name: "Aditya", role: "president", clubName: "Robotics Club", isClubMember: true, details: "BE / IT", clubLogo: "🤖" }
};

export const COMMUNITY_DASHBOARD_DATA = {
    communityDetails: {
        name: "Web Dev Forum",
        icon: "🌐",
        memberCount: "1.2k",
        role: "Member",
        description: "Discover communities, find collaborations, and join the network."
    },
    channels: [
        { id: "announcements", name: "Announcements" },
        { id: "general", name: "General" }
    ],
    discussions: [
        {
            id: "disc_001",
            title: "What's your favorite React state management library?",
            author: "Sarah Jenkins",
            authorAvatar: "👩‍💻",
            timePosted: "3h ago",
            upvotes: 42,
            commentCount: 18,
            summary: "I've been using Redux for years but curious what everyone else prefers. Recently heard a lot about Zustand and Jotai...",
            content: "I've been using Redux for years but I'm curious what everyone else prefers. Recently heard a lot about Zustand and Jotai. What are you all using for state management in 2026? Any hot takes on Context API vs external libraries?\n\nLooking for pros/cons and real-world experience!"
        },
        {
            id: "disc_002",
            title: "Best practices for managing environment variables in production?",
            author: "Mike Chen",
            authorAvatar: "👨‍🔧",
            timePosted: "5h ago",
            upvotes: 28,
            commentCount: 12,
            summary: "Working on deploying my first full-stack app and I'm confused about the best way to handle API keys and secrets...",
            content: "Working on deploying my first full-stack app and I'm confused about the best way to handle API keys and secrets. Should I use .env files? What about CI/CD pipelines? Any recommendations for tools or services?"
        },
        {
            id: "disc_003",
            title: "Tailwind vs Vanilla CSS - The eternal debate",
            author: "Priya Patel",
            authorAvatar: "👩‍💼",
            timePosted: "8h ago",
            upvotes: 67,
            commentCount: 34,
            summary: "After 3 years of Tailwind, I went back to vanilla CSS and I'm loving it. Here's why...",
            content: "After 3 years of using Tailwind exclusively, I decided to go back to vanilla CSS for my latest project and honestly, I'm loving it. The control, the organization with BEM, and no bloat. Am I crazy or does anyone else feel this way?"
        },
        {
            id: "disc_004",
            title: "How to break into open source contributions?",
            author: "Alex Rossi",
            authorAvatar: "🎨",
            timePosted: "1d ago",
            upvotes: 52,
            commentCount: 23,
            summary: "I want to start contributing to open source but I feel overwhelmed. Where do I even begin?",
            content: "I want to start contributing to open source projects but I feel completely overwhelmed. Where do I even begin? How do I find beginner-friendly issues? Any tips from experienced contributors?"
        },
        {
            id: "disc_005",
            title: "Show & Tell: Built a real-time collaborative whiteboard",
            author: "David Kim",
            authorAvatar: "📊",
            timePosted: "1d ago",
            upvotes: 89,
            commentCount: 41,
            summary: "Just finished building a real-time collaborative whiteboard using WebSockets and Canvas API...",
            content: "Just finished building a real-time collaborative whiteboard using WebSockets and Canvas API. It supports multiple users, drawing tools, and even undo/redo. Would love to get some feedback!\n\nTech stack: Node.js, Socket.io, HTML Canvas, Vanilla JS"
        },
        {
            id: "disc_006",
            title: "Is server-side rendering still relevant in 2026?",
            author: "Emma Wilson",
            authorAvatar: "👩‍🚀",
            timePosted: "2d ago",
            upvotes: 31,
            commentCount: 15,
            summary: "With all the advancements in CDNs and static site generation, do we still need SSR?",
            content: "With all the advancements in CDNs, edge computing, and static site generation, do we still need traditional server-side rendering? What are the use cases where SSR is still the best choice?"
        }
    ],
    collabRequests: [
        {
            id: "collab_c001",
            title: "Looking for Frontend Dev for Hackathon",
            author: "Mike Chen",
            authorAvatar: "👨‍🔧",
            skills: ["React", "TypeScript", "Tailwind"],
            timePosted: "1d ago",
            description: "Building a SaaS dashboard for the upcoming 48-hour hackathon. Need someone strong in React and TypeScript. Have the backend covered!"
        },
        {
            id: "collab_c002",
            title: "Need UI/UX Designer for Portfolio Project",
            author: "Sarah Jenkins",
            authorAvatar: "👩‍💻",
            skills: ["Figma", "UI Design", "Prototyping"],
            timePosted: "2d ago",
            description: "Working on a personal portfolio site and need help with the design. Looking for someone who can create mockups in Figma. Non-paid but great for portfolio!"
        },
        {
            id: "collab_c003",
            title: "Co-founder for EdTech Startup Idea",
            author: "Priya Patel",
            authorAvatar: "👩‍💼",
            skills: ["Full-Stack", "Entrepreneurship", "Education"],
            timePosted: "3d ago",
            description: "Have a validated idea for an EdTech platform targeting college students. Looking for a technical co-founder who's passionate about education and startups."
        },
        {
            id: "collab_c004",
            title: "Open Source Contributors Wanted - Dev Tools Library",
            author: "Alex Rossi",
            authorAvatar: "🎨",
            skills: ["JavaScript", "Node.js", "Open Source"],
            timePosted: "5d ago",
            description: "Maintaining an open-source dev tools library. Looking for contributors to help with documentation, bug fixes, and new features. Great for beginners!"
        }
    ],
    members: [
        { id: "cm1", name: "Sarah Jenkins", role: "Active Member", status: "online", avatar: "👩‍💻" },
        { id: "cm2", name: "Mike Chen", role: "Active Member", status: "online", avatar: "👨‍🔧" },
        { id: "cm3", name: "Priya Patel", role: "Moderator", status: "idle", avatar: "👩‍💼" },
        { id: "cm4", name: "Alex Rossi", role: "Active Member", status: "offline", avatar: "🎨" },
        { id: "cm5", name: "David Kim", role: "Active Member", status: "online", avatar: "📊" },
        { id: "cm6", name: "Emma Wilson", role: "Active Member", status: "online", avatar: "👩‍🚀" }
    ]
};

// ==================== ADMIN DASHBOARD DATA ====================

export const ADMIN_STATS = {
    totalStudents: 2847,
    activeClubs: 23,
    totalEvents: 156,
    clubPopularity: [
        { clubName: "Robotics Club", members: 342, logo: "🤖" },
        { clubName: "GDSC Club", members: 289, logo: "💻" },
        { clubName: "Music Club", members: 215, logo: "🎷" },
        { clubName: "AI/ML Club", members: 198, logo: "🧠" },
        { clubName: "Drama Club", members: 167, logo: "🎭" },
        { clubName: "Sports Club", members: 145, logo: "🏏" },
        { clubName: "Art Club", members: 128, logo: "🎨" }
    ],
    eventEngagement: {
        registered: 1245,
        attended: 987,
        avgAttendance: "79%"
    }
};

export const PENDING_COMMUNITIES = [
    {
        id: "pending_001",
        name: "Blockchain Builders",
        purpose: "Discuss Web3, DeFi, and blockchain development. Share projects and collaborate on decentralized applications.",
        requestedBy: "Raj Kumar",
        requestedByAvatar: "👨‍💻",
        requestedAt: "2026-02-02"
    },
    {
        id: "pending_002",
        name: "Cybersecurity Hub",
        purpose: "Share security research, CTF challenges, and best practices. Learn ethical hacking and penetration testing.",
        requestedBy: "Sneha Reddy",
        requestedByAvatar: "👩‍💻",
        requestedAt: "2026-02-03"
    },
    {
        id: "pending_003",
        name: "Indie Game Developers",
        purpose: "Collaborate on game projects and share development insights. From pixel art to game engines.",
        requestedBy: "Vikram Singh",
        requestedByAvatar: "🎮",
        requestedAt: "2026-02-04"
    }
];

export const STUDENTS_LIST = [
    { id: "s001", name: "Aditya", year: "BE", department: "IT", avatar: "👨‍🎓", rollNo: "BE2020IT089" },
    { id: "s002", name: "Aryan", year: "TE", department: "COMP", avatar: "👨‍💻", rollNo: "TE2021COMP127" },
    { id: "s003", name: "Parth", year: "FE", department: "COMP", avatar: "👨‍🎓", rollNo: "FE2023COMP042" },
    { id: "s004", name: "Raj Kumar", year: "SE", department: "IT", avatar: "👨‍💻", rollNo: "SE2022IT055" },
    { id: "s005", name: "Sneha Reddy", year: "BE", department: "CS", avatar: "👩‍💻", rollNo: "BE2020CS102" },
    { id: "s006", name: "Vikram Singh", year: "TE", department: "MECH", avatar: "👨‍🔧", rollNo: "TE2021MECH033" },
    { id: "s007", name: "Priya Sharma", year: "SE", department: "CIVIL", avatar: "👩‍🎓", rollNo: "SE2022CIV019" }
];

export const CLUBS_LIST = [
    { id: "club_001", name: "Robotics Club", logo: "🤖", president: "Aditya", members: 342, description: "Build robots and compete in national competitions" },
    { id: "club_002", name: "GDSC Club", logo: "💻", president: "Sarah Jenkins", members: 289, description: "Google Developer Student Club - Learn and build with Google technologies" },
    { id: "club_003", name: "Music Club", logo: "🎷", president: "Mike Chen", members: 215, description: "Explore all genres of music through performances and workshops" },
    { id: "club_004", name: "AI/ML Club", logo: "🧠", president: "Priya Patel", members: 198, description: "Dive deep into artificial intelligence and machine learning" },
    { id: "club_005", name: "Drama Club", logo: "🎭", president: "Alex Rossi", members: 167, description: "Perform plays and develop theatrical skills" },
    { id: "club_006", name: "Sports Club", logo: "🏏", president: "David Kim", members: 145, description: "Participate in inter-college sports competitions" },
    { id: "club_007", name: "Art Club", logo: "🎨", president: "Emma Wilson", members: 128, description: "Express creativity through various art forms" }
];

// ==================== STUDENT PROFILE DATA ====================

export const USER_PROFILES = {
    Parth: {
        email: "parth.sharma@college.edu",
        rollNo: "FE2023COMP042",
        department: "COMP",
        year: "FE",
        bio: "Passionate about web development and building user-friendly applications. Always eager to learn new technologies and collaborate on innovative projects.",
        skills: ["React", "JavaScript", "HTML/CSS", "Node.js", "Git"],
        social: {
            github: "parthdev",
            linkedin: "parth-sharma-dev"
        }
    },
    Aryan: {
        email: "aryan.mehta@college.edu",
        rollNo: "TE2021COMP127",
        department: "COMP",
        year: "TE",
        bio: "Robotics enthusiast and full-stack developer. Member of the Robotics Club, working on autonomous systems and IoT projects. Love building things that make a difference.",
        skills: ["Python", "C++", "React", "Arduino", "ROS", "Machine Learning", "IoT"],
        social: {
            github: "aryanmehta",
            linkedin: "aryan-mehta-robotics"
        }
    },
    Aditya: {
        email: "aditya.kumar@college.edu",
        rollNo: "BE2020IT089",
        department: "IT",
        year: "BE",
        bio: "President of Robotics Club. Experienced in leading technical teams and organizing large-scale events. Passionate about AI, robotics, and mentoring juniors. Looking to pursue research in autonomous systems.",
        skills: ["Python", "TensorFlow", "ROS", "Computer Vision", "Leadership", "Project Management", "Arduino", "React"],
        social: {
            github: "adityakumar",
            linkedin: "aditya-kumar-robotics-lead"
        }
    }
};

export const USER_ACTIVITY = {
    Parth: {
        applications: [
            {
                id: "app_001",
                clubName: "GDSC Club",
                clubLogo: "💻",
                position: "Web Development Team",
                appliedDate: "2026-02-01",
                status: "Pending",
                statusColor: "yellow"
            },
            {
                id: "app_002",
                clubName: "Music Club",
                clubLogo: "🎷",
                position: "Media Coordinator",
                appliedDate: "2026-01-28",
                status: "Interview Scheduled",
                statusColor: "blue",
                interviewDate: "2026-02-10",
                interviewTime: "3:00 PM"
            }
        ],
        registrations: [
            {
                id: "reg_001",
                eventName: "RoboWar 2026",
                eventLogo: "🤖",
                ticketId: "RW2026-0142",
                registeredDate: "2026-02-03",
                eventDate: "2026-03-15"
            },
            {
                id: "reg_002",
                eventName: "React Workshop",
                eventLogo: "💻",
                ticketId: "DEV2026-0089",
                registeredDate: "2026-02-02",
                eventDate: "2026-03-18"
            }
        ],
        collabs: [
            {
                id: "my_collab_001",
                title: "Looking for UI/UX Designer",
                communityName: "Web Dev Forum",
                description: "Need help designing a mobile app for campus navigation",
                postedDate: "2026-02-03",
                responses: 5
            }
        ]
    },
    Aryan: {
        applications: [
            {
                id: "app_003",
                clubName: "AI/ML Club",
                clubLogo: "🧠",
                position: "Research Team",
                appliedDate: "2026-01-15",
                status: "Accepted",
                statusColor: "green"
            }
        ],
        registrations: [
            {
                id: "reg_003",
                eventName: "RoboWar 2026",
                eventLogo: "🤖",
                ticketId: "RW2026-0089",
                registeredDate: "2026-01-20",
                eventDate: "2026-03-15"
            },
            {
                id: "reg_004",
                eventName: "AI Hackathon",
                eventLogo: "🧠",
                ticketId: "AIH2026-0234",
                registeredDate: "2026-02-01",
                eventDate: "2026-03-25"
            },
            {
                id: "reg_005",
                eventName: "Jazz Night",
                eventLogo: "🎷",
                ticketId: "JZZ2026-0156",
                registeredDate: "2026-01-30",
                eventDate: "2026-03-20"
            }
        ],
        collabs: [
            {
                id: "my_collab_002",
                title: "Looking for Guitarist",
                communityName: "Music Community",
                description: "Forming a jazz quartet for open mic night",
                postedDate: "2026-01-28",
                responses: 12
            },
            {
                id: "my_collab_003",
                title: "Arduino Project Partner",
                communityName: "Robotics Community",
                description: "Building a line-following robot, need help with sensors",
                postedDate: "2026-01-20",
                responses: 8
            }
        ]
    },
    Aditya: {
        applications: [],
        registrations: [
            {
                id: "reg_006",
                eventName: "RoboWar 2026",
                eventLogo: "🤖",
                ticketId: "RW2026-ORG01",
                registeredDate: "2026-01-10",
                eventDate: "2026-03-15",
                role: "Organizer"
            },
            {
                id: "reg_007",
                eventName: "AI Hackathon",
                eventLogo: "🧠",
                ticketId: "AIH2026-0012",
                registeredDate: "2026-01-25",
                eventDate: "2026-03-25"
            }
        ],
        collabs: [
            {
                id: "my_collab_004",
                title: "Co-founder for Robotics Startup",
                communityName: "Startup Circle",
                description: "Building autonomous delivery robots for campus",
                postedDate: "2026-01-15",
                responses: 23
            }
        ]
    }
};

export const PORTFOLIO_ITEMS = {
    Parth: [
        {
            id: "port_001",
            type: "project",
            title: "College Event Management System",
            description: "Built a full-stack web app for managing college events with real-time notifications",
            duration: "Dec 2025 - Jan 2026",
            technologies: ["React", "Node.js", "MongoDB", "Socket.io"],
            link: "https://github.com/parthdev/event-manager"
        },
        {
            id: "port_002",
            type: "project",
            title: "Personal Portfolio Website",
            description: "Responsive portfolio showcasing my projects and skills",
            duration: "Nov 2025",
            technologies: ["React", "Tailwind CSS", "Framer Motion"],
            link: "https://parthsharma.dev"
        }
    ],
    Aryan: [
        {
            id: "port_003",
            type: "internship",
            title: "IoT Developer Intern - TechCorp",
            description: "Developed IoT solutions for smart home automation using Arduino and Raspberry Pi",
            duration: "Jun 2025 - Aug 2025",
            technologies: ["Arduino", "Python", "MQTT", "Firebase"],
            link: null
        },
        {
            id: "port_004",
            type: "project",
            title: "Autonomous Line Following Robot",
            description: "Built a robot for inter-college competition using PID control",
            duration: "Mar 2025 - May 2025",
            technologies: ["Arduino", "C++", "IR Sensors", "Motor Control"],
            link: "https://github.com/aryanmehta/line-follower"
        },
        {
            id: "port_005",
            type: "project",
            title: "Face Recognition Attendance System",
            description: "ML-based attendance system using computer vision",
            duration: "Jan 2025 - Feb 2025",
            technologies: ["Python", "OpenCV", "TensorFlow", "Flask"],
            link: "https://github.com/aryanmehta/face-attendance"
        }
    ],
    Aditya: [
        {
            id: "port_006",
            type: "internship",
            title: "Robotics Research Intern - IIT Delhi",
            description: "Worked on autonomous navigation systems for mobile robots",
            duration: "May 2025 - Aug 2025",
            technologies: ["ROS", "Python", "SLAM", "Computer Vision"],
            link: null
        },
        {
            id: "port_007",
            type: "project",
            title: "Swarm Robotics Simulation",
            description: "Simulated coordinated behavior of multiple robots for research",
            duration: "Sep 2024 - Dec 2024",
            technologies: ["Python", "ROS", "Gazebo", "Machine Learning"],
            link: "https://github.com/adityakumar/swarm-sim"
        },
        {
            id: "port_008",
            type: "project",
            title: "Gesture-Controlled Robotic Arm",
            description: "Built a robotic arm controlled by hand gestures using computer vision",
            duration: "Jun 2024 - Aug 2024",
            technologies: ["Arduino", "Python", "OpenCV", "MediaPipe"],
            link: "https://github.com/adityakumar/gesture-arm"
        },
        {
            id: "port_009",
            type: "project",
            title: "Campus Navigation Assistant",
            description: "AI chatbot to help students navigate the campus",
            duration: "Mar 2024 - Apr 2024",
            technologies: ["Python", "NLP", "React", "FastAPI"],
            link: null
        }
    ]
};
