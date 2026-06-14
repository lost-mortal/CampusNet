import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    Zap, Users, Ticket, Megaphone, Newspaper, Handshake,
    MessageSquare, Sparkles, ShieldCheck,
    ChevronRight, Globe, Terminal, Eye, EyeOff, Lock, Mail,
    ShieldAlert, Phone, X as XIcon, Search, KeyRound,
} from 'lucide-react';
import { setSession } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const LandingPage = () => {
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [step, setStep] = useState('login'); // 'login' | 'change-password'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingToken, setPendingToken] = useState('');
    const [restrictionInfo, setRestrictionInfo] = useState(null); // { reason, admin: { name, email, phone } }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await axios.post(`${API}/api/auth/login`, { email, password });
            if (data.user.mustChangePassword) {
                setPendingToken(data.token);
                setSession({ token: data.token, user: data.user });
                setStep('change-password');
            } else {
                setSession({ token: data.token, user: data.user });
                window.location.href = data.user.role === 'admin' ? '/admin/dashboard' : '/home';
            }
        } catch (err) {
            const payload = err.response?.data;
            if (err.response?.status === 403 && payload?.error === 'ACCESS_RESTRICTED') {
                setRestrictionInfo({
                    reason: payload.reason || '',
                    admin: payload.admin || null,
                });
                setLoginModalOpen(false);
            } else {
                setError(payload?.error || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) return setError('Passwords do not match');
        if (newPassword.length < 8) return setError('Password must be at least 8 characters');
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${API}/api/auth/change-password`,
                { newPassword },
                { headers: { Authorization: `Bearer ${pendingToken}` } }
            );
            setSession({ token: data.token, user: data.user });
            window.location.href = data.user.role === 'admin' ? '/admin/dashboard' : '/home';
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const openModal = () => {
        setStep('login');
        setEmail('');
        setPassword('');
        setError('');
        setLoginModalOpen(true);
    };

    const features = [
        { icon: <Search className="text-yellow-400" />, title: "Semantic AI Search", desc: "Ask in plain English. AI-powered semantic search understands what you mean and surfaces the right events, clubs, communities, and people — no exact keywords required." },
        { icon: <Newspaper className="text-blue-400" />, title: "Unified Campus Feed", desc: "One feed for everything happening on campus — recruitment drives, events, collab calls, and general updates — all filterable by tag so you only see what matters to you." },
        { icon: <Ticket className="text-green-400" />, title: "Events & QR Tickets", desc: "Register for any event in one tap and get a personal QR ticket in your Activity Hub. Organisers scan to mark attendance, and paid events are supported with QR-based payment approval." },
        { icon: <Megaphone className="text-pink-400" />, title: "Club Recruitment", desc: "Clubs post recruitment drives and applicants apply in seconds. Leads review every application from one dashboard and accept or reject with a single click." },
        { icon: <Users className="text-indigo-400" />, title: "Communities & Channels", desc: "Join interest-based communities with their own channels, announcement boards, and threaded discussions — moderated hubs to talk, share, and stay in the loop." },
        { icon: <Handshake className="text-cyan-400" />, title: "Collab & Team-Building", desc: "Post collab requests with the exact skills you need and find teammates for hackathons and projects. Skill tags make the right people easy to discover." },
        { icon: <MessageSquare className="text-sky-400" />, title: "Real-Time Messaging", desc: "Connect with peers and chat one-on-one with real-time direct messages — coordinate teams, follow up on recruitment, or just stay in touch instantly." },
        { icon: <Sparkles className="text-purple-400" />, title: "AI Club Insights", desc: "Presidents generate AI-written health reports on their club's activity and engagement, and admins get the same intelligence across every club to spot what's thriving." },
        { icon: <ShieldCheck className="text-red-400" />, title: "Admin Console & Pulse", desc: "Campus admins manage students, clubs, and communities, push campus-wide announcements, and oversee the full student lifecycle — including an alumni directory." }
    ];

    return (
        <div className="min-h-screen bg-[#000000] text-[#e4e6eb] font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(118,75,162,0.15),transparent)]" />
                <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent top-1/4 animate-pulse" />
                <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-purple-500/20 to-transparent left-1/4 animate-pulse delay-700" />
            </div>

            <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 backdrop-blur-md bg-black/50 border-b border-white/5 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(102,126,234,0.4)]">
                        <Globe size={24} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">CampusNet</span>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/presidents_and_managers.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 md:px-5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-full transition-all duration-300 text-sm font-medium tracking-wide flex items-center gap-2 text-indigo-300 hover:text-indigo-200 group"
                    >
                        <KeyRound size={16} />
                        <span className="hidden sm:inline">Demo Logins</span>
                        <span className="sm:hidden">Logins</span>
                    </a>
                    <button onClick={openModal} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 font-medium tracking-wide flex items-center gap-2 group">
                        <span className="group-hover:text-indigo-300 transition-colors">Login</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </nav>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center pt-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
                        <Zap size={14} /> <span className="animate-pulse">System Online</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight">
                        <span className="block mb-2">UNIFY YOUR</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#667eea] via-[#f093fb] to-[#764ba2]">CAMPUS</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10 leading-relaxed font-light">
                        The central nervous system for student life.
                        <span className="text-white font-medium"> AI-driven discovery</span>,
                        <span className="text-white font-medium"> secure events</span>, and
                        <span className="text-white font-medium"> verified collaboration</span>.
                    </p>
                    <button onClick={openModal} className="px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl font-bold text-white shadow-[0_0_30px_rgba(102,126,234,0.3)] hover:shadow-[0_0_50px_rgba(102,126,234,0.6)] hover:scale-105 transition-all duration-300">
                        Get Started
                    </button>
                </motion.div>
            </main>

            <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Campus Ecosystem</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to manage your academic social life, from discovery to leadership.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                            className="p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-black/50 border border-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-200">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Access Restricted Modal */}
            <AnimatePresence>
                {restrictionInfo && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                            onClick={() => setRestrictionInfo(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[#0a0a0a] border border-amber-500/30 p-1 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
                            <div className="p-8">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 mb-4">
                                        <ShieldAlert size={20} className="text-amber-300" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">Access Restricted</h2>
                                </div>

                                {restrictionInfo.reason && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
                                        <p className="text-xs uppercase tracking-wider text-amber-300/80 mb-1.5">Reason</p>
                                        <p className="text-sm text-amber-100 leading-relaxed">{restrictionInfo.reason}</p>
                                    </div>
                                )}

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
                                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Contact Campus Admin</p>
                                    {restrictionInfo.admin ? (
                                        <div className="space-y-2 text-sm">
                                            <p className="text-white font-semibold">{restrictionInfo.admin.name || 'Campus Admin'}</p>
                                            {restrictionInfo.admin.email ? (
                                                <a href={`mailto:${restrictionInfo.admin.email}`} className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors">
                                                    <Mail size={14} /> {restrictionInfo.admin.email}
                                                </a>
                                            ) : (
                                                <p className="flex items-center gap-2 text-gray-500"><Mail size={14} /> Not set</p>
                                            )}
                                            {restrictionInfo.admin.phone ? (
                                                <a href={`tel:${restrictionInfo.admin.phone}`} className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors">
                                                    <Phone size={14} /> {restrictionInfo.admin.phone}
                                                </a>
                                            ) : (
                                                <p className="flex items-center gap-2 text-gray-500"><Phone size={14} /> Not set</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Contact information not set.</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setRestrictionInfo(null)}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <XIcon size={14} /> Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Login / Change-Password Modal */}
            <AnimatePresence>
                {isLoginModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setLoginModalOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 p-1 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#667eea] to-[#764ba2]" />

                            <div className="p-8">
                                {step === 'login' ? (
                                    <>
                                        <div className="text-center mb-8">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                                                <Terminal size={20} className="text-indigo-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold mb-2">Sign In</h2>
                                            <p className="text-gray-500 text-sm">Sinhgad Engineering — CampusNet</p>
                                        </div>

                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                                <input
                                                    type="email"
                                                    placeholder="your.rollnumber@sinhgad.edu"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Password"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                                                />
                                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                                            <button type="submit" disabled={loading}
                                                className="w-full py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                                                {loading ? 'Signing in…' : 'Sign In'}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-center mb-8">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 mb-4">
                                                <Lock size={20} className="text-yellow-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
                                            <p className="text-gray-500 text-sm">First login — please create a new password</p>
                                        </div>

                                        <form onSubmit={handleChangePassword} className="space-y-4">
                                            <input
                                                type="password"
                                                placeholder="New password (min 8 chars)"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                                            />
                                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                                            <button type="submit" disabled={loading}
                                                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                                                {loading ? 'Saving…' : 'Set Password & Continue'}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>

                            <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                                <button onClick={() => setLoginModalOpen(false)} className="text-xs text-gray-500 hover:text-white transition-colors">
                                    Cancel
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
