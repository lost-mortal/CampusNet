import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Users,
    Ticket,
    Bell,
    BarChart3,
    Megaphone,
    ChevronRight,
    Globe,
    Terminal,
    ShieldCheck,
    User,
    Crown,
    Bot
} from 'lucide-react';
import { PERSONAS } from '../../data/mockData';

const LandingPage = () => {
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);

    // Persistence logic for the demo (Mock Auth)
    const handleLogin = (personaKey) => {
        if (personaKey === 'Admin') {
            console.log("Logging in as Admin...");
            localStorage.setItem('userRole', 'admin');
            window.location.href = '/admin/dashboard';
            return;
        }

        const persona = PERSONAS[personaKey];
        console.log(`Logging in as ${persona.name} (${persona.role})...`);

        // Save full user object to resemble a real auth response
        localStorage.setItem('user', JSON.stringify(persona));
        localStorage.setItem('userRole', persona.role); // Keep for legacy checks if any

        window.location.href = '/home';
    };

    // Typing animation variants
    const typingContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const typingLetter = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    const features = [
        {
            icon: <Zap className="text-yellow-400" />,
            title: "Smart Feed & Semantic Search",
            desc: "No more information overload. Our AI curates events based on your academic profile and interests, while BERT-powered search lets you query naturally."
        },
        {
            icon: <Users className="text-blue-400" />,
            title: "Collaborative Communities",
            desc: "Connect with peers who share your passions. Brainstorm ideas, form hackathon teams, and build projects in dedicated, moderated hubs."
        },
        {
            icon: <Ticket className="text-green-400" />,
            title: "One-Tap Registration",
            desc: "Forget repetitive Google Forms. Register for events and club recruitments instantly with your pre-verified campus profile."
        },
        {
            icon: <Bell className="text-red-400" />,
            title: "Campus Pulse",
            desc: "Never miss a deadline again. Critical campus-wide announcements and academic updates pushed directly to your feed."
        },
        {
            icon: <BarChart3 className="text-purple-400" />,
            title: "Institutional Oversight",
            desc: "A powerful dashboard for Campus Admins to organize student bodies, track engagement stats, and identify underperforming clubs."
        },
        {
            icon: <Megaphone className="text-pink-400" />,
            title: "Club Ecosystem",
            desc: "A complete toolkit for Club Leads: Manage recruitment, track volunteer stats, promote events, and showcase daily activities to the campus."
        }
    ];

    const personaOptions = [
        {
            key: 'FRESHER',
            label: 'Fresher',
            name: 'Parth',
            desc: 'New student, exploring clubs',
            icon: <User size={20} />,
            color: 'indigo'
        },
        {
            key: 'MEMBER',
            label: 'Club Member',
            name: 'Aryan',
            desc: 'Member of Robotics Club',
            icon: <Bot size={20} />, // Robot icon for Robotics member
            color: 'cyan'
        },
        {
            key: 'PRESIDENT',
            label: 'Club President',
            name: 'Aditya',
            desc: 'Admin of Robotics Club',
            icon: <Crown size={20} />,
            color: 'amber'
        }
    ];

    return (
        <div className="min-h-screen bg-[#000000] text-[#e4e6eb] font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(118,75,162,0.15),transparent)]" />
                <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent top-1/4 animate-pulse" />
                <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-purple-500/20 to-transparent left-1/4 animate-pulse delay-700" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 backdrop-blur-md bg-black/50 border-b border-white/5 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(102,126,234,0.4)]">
                        <Globe size={24} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        CampusNet
                    </span>
                </div>
                <button
                    onClick={() => setLoginModalOpen(true)}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 font-medium tracking-wide flex items-center gap-2 group"
                >
                    <span className="group-hover:text-indigo-300 transition-colors">Login</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Tagline */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
                        <Zap size={14} /> <span className="animate-pulse">System Online</span>
                    </div>

                    {/* Typing Title Effect */}
                    <motion.h1
                        className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight"
                        variants={typingContainer}
                        initial="hidden"
                        animate="show"
                    >
                        <span className="block mb-2">UNIFY YOUR</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#667eea] via-[#f093fb] to-[#764ba2]">
                            {"CAMPUS".split("").map((char, i) => (
                                <motion.span key={i} variants={typingLetter}>{char}</motion.span>
                            ))}
                        </span>
                    </motion.h1>

                    <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10 leading-relaxed font-light">
                        The central nervous system for student life.
                        <span className="text-white font-medium"> AI-driven discovery</span>,
                        <span className="text-white font-medium"> secure events</span>, and
                        <span className="text-white font-medium"> verified collaboration</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <button
                            onClick={() => setLoginModalOpen(true)}
                            className="px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl font-bold text-white shadow-[0_0_30px_rgba(102,126,234,0.3)] hover:shadow-[0_0_50px_rgba(102,126,234,0.6)] hover:scale-105 transition-all duration-300"
                        >
                            Get Started
                        </button>
                    </div>
                </motion.div>
            </main>

            {/* Feature Grid */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Campus Ecosystem</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to manage your academic social life, from discovery to leadership.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all group hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 bg-black/50 border border-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-200">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Login Modal (Popup) */}
            <AnimatePresence>
                {isLoginModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setLoginModalOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 p-1 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#667eea] to-[#764ba2]" />

                            <div className="p-8">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                                        <Terminal size={20} className="text-indigo-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Select Demo Persona</h2>
                                    <p className="text-gray-500 text-sm">Choose a profile to experience CampusNet</p>
                                </div>

                                <div className="space-y-3">
                                    {personaOptions.map((opt) => (
                                        <button
                                            key={opt.key}
                                            onClick={() => handleLogin(opt.key)}
                                            className={`w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-${opt.color}-500/50 rounded-xl transition-all group`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 bg-${opt.color}-500/10 rounded-lg flex items-center justify-center text-${opt.color}-400 group-hover:bg-${opt.color}-500 group-hover:text-white transition-all`}>
                                                    {opt.icon}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-gray-200">
                                                        {opt.label} <span className="text-gray-500 font-normal">({opt.name})</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{opt.desc}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                                        </button>
                                    ))}

                                    <div className="h-px bg-white/10 my-2" />

                                    <button
                                        onClick={() => handleLogin('Admin')}
                                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-200">Campus Admin</div>
                                                <div className="text-xs text-gray-500">Analytics, Management</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                                <button
                                    onClick={() => setLoginModalOpen(false)}
                                    className="text-xs text-gray-500 hover:text-white transition-colors"
                                >
                                    Cancel Authentication
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
