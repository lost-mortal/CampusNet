import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    User, Mail, Hash, Building, Github, Linkedin, Edit3, X, Plus,
    Briefcase, Calendar, MapPin, ExternalLink,
    Ticket, MessageSquare, Loader, QrCode, ChevronDown, ChevronUp, ChevronRight,
    CheckCircle, Clock, XCircle, UserCheck, Send, Inbox, Trash2, Users,
    Image as ImageIcon,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import ChatTab from '../../components/ChatTab';
import ImageUploadField from '../../components/ImageUploadField';
import { getToken, getUser, setUser as setSessionUser } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const StudentProfile = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'about');

    // Sync activeTab when URL ?tab= changes (e.g., from Activity-hub Chat button deep-link)
    useEffect(() => {
        const urlTab = searchParams.get('tab');
        if (urlTab && urlTab !== activeTab) setActiveTab(urlTab);
    }, [searchParams, activeTab]);

    const selectTab = (tab) => {
        setActiveTab(tab);
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        if (tab !== 'chat') next.delete('with');
        setSearchParams(next, { replace: true });
    };

    const [user, setUser] = useState(null);
    const [editForm, setEditForm] = useState({ bio: '', skills: [], github: '', linkedin: '', profilePic: '', bannerImage: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [skills, setSkills] = useState([]);
    const [social, setSocial] = useState({ github: '', linkedin: '' });
    const [newSkill, setNewSkill] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);

    // Activity tab — aggregated data
    const [activity, setActivity] = useState(null);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityFetched, setActivityFetched] = useState(false);
    const [ticketModal, setTicketModal] = useState(null); // ticket object for QR modal
    const [expandedCollabs, setExpandedCollabs] = useState({}); // collabId → boolean

    // My Collab Posts (Activity → 5th section)
    const [myCollabs, setMyCollabs] = useState([]);
    const [myCollabsLoading, setMyCollabsLoading] = useState(false);
    const [deleteCollabId, setDeleteCollabId] = useState(null);

    // Collapsible state for activity sections — local only, default all expanded
    const [openSections, setOpenSections] = useState({
        tickets: true,
        applications: true,
        collabConnections: true,
        generalConnections: true,
        myCollabs: true,
    });
    const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

    const deleteMyCollab = async (postId) => {
        try {
            const token = getToken();
            await axios.delete(`${API}/api/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
            setMyCollabs(prev => prev.filter(c => c._id !== postId));
            setDeleteCollabId(null);
        } catch (err) {
            console.error('Delete failed', err);
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    useEffect(() => {
        const u = getUser();
        if (!u) return;
        setUser(u);
        setEditForm({
            bio: u.bio || '',
            skills: [],
            github: '',
            linkedin: '',
            profilePic: u.profilePic || '',
            bannerImage: u.bannerImage || '',
        });
    }, []);

    // Fetch activity once when activity tab is first opened
    useEffect(() => {
        if (activeTab !== 'activity' || activityFetched || !user) return;
        setActivityLoading(true);
        setMyCollabsLoading(true);
        setActivityFetched(true);
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`${API}/api/activity/me`, { headers })
            .then(r => setActivity(r.data))
            .catch(console.error)
            .finally(() => setActivityLoading(false));

        axios.get(`${API}/api/posts?type=Collab&author=me`, { headers })
            .then(r => setMyCollabs(r.data))
            .catch(console.error)
            .finally(() => setMyCollabsLoading(false));
    }, [activeTab, user, activityFetched]);

    const acceptConnection = async (connId) => {
        const token = getToken();
        try {
            await axios.patch(`${API}/api/connections/${connId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setActivity(prev => {
                if (!prev) return prev;
                const updateStatus = arr => arr.map(c => c._id === connId ? { ...c, status: 'accepted' } : c);
                return {
                    ...prev,
                    collabConnections: {
                        sent: updateStatus(prev.collabConnections.sent),
                        received: updateStatus(prev.collabConnections.received),
                    },
                    generalConnections: {
                        sent: updateStatus(prev.generalConnections.sent),
                        received: updateStatus(prev.generalConnections.received),
                    },
                };
            });
        } catch (err) {
            console.error('Failed to accept connection', err);
        }
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            // Persist images (and bio) to the server so they survive reload.
            const token = getToken();
            const { data } = await axios.patch(
                `${API}/api/auth/me`,
                { bio: editForm.bio, profilePic: editForm.profilePic, bannerImage: editForm.bannerImage },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Sync session + local state so the cover/avatar update immediately.
            setSessionUser(data.user);
            setUser(data.user);
            // Skills/social remain client-local — not yet wired to the API.
            setSkills(editForm.skills);
            setSocial({ github: editForm.github, linkedin: editForm.linkedin });
            setShowEditModal(false);
        } catch (err) {
            console.error('Failed to save profile', err);
            alert(err.response?.data?.error || 'Failed to save profile changes');
        } finally {
            setSavingProfile(false);
        }
    };

    const openEdit = () => {
        setEditForm({
            bio: user?.bio || '',
            skills: [...skills],
            github: social.github,
            linkedin: social.linkedin,
            profilePic: user?.profilePic || '',
            bannerImage: user?.bannerImage || '',
        });
        setShowEditModal(true);
    };

    const addSkill = () => {
        const s = newSkill.trim();
        if (s && !editForm.skills.includes(s)) {
            setEditForm(f => ({ ...f, skills: [...f.skills, s] }));
            setNewSkill('');
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <Loader size={20} className="animate-spin text-gray-500" />
            </div>
        );
    }

    const department = user.department || '—';
    const year = user.year || '—';

    return (
        <main className="flex-1 min-w-0 bg-black min-h-screen pb-20 border-r border-white/5">
            {/* Cover + avatar */}
            <div className="relative mb-6">
                <div className="h-48 relative overflow-hidden">
                    {user.bannerImage ? (
                        <img src={user.bannerImage} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]" />
                            <div className="absolute inset-0 opacity-30"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M10 0L0 0 0 10' fill='none' stroke='white' stroke-opacity='.1' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E\")" }}
                            />
                        </>
                    )}
                </div>
                <div className="w-full px-6">
                    <div className="flex items-start gap-6 -mt-16">
                        <div className="relative z-10 w-32 h-32 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border-4 border-black flex items-center justify-center text-5xl shadow-2xl flex-shrink-0 overflow-hidden">
                            {user.profilePic
                                ? <img src={user.profilePic} alt="Avatar" className="w-full h-full object-cover" />
                                : user.avatar}
                        </div>
                        <div className="flex-1 pt-16">
                            <h1 className="text-3xl font-bold text-white mb-1">{user.name}</h1>
                            <p className="text-gray-400 text-sm mb-2">
                                {year} · {department}
                                {user.role === 'president' ? ' · Club President' : user.role === 'member' ? ' · Club Member' : ''}
                            </p>
                            {user.clubName && (
                                <div className="flex items-center gap-2 text-indigo-400 text-sm">
                                    <span className="text-lg">{user.clubLogo}</span>
                                    <span>{user.clubName}</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={openEdit}
                            className="mt-16 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white flex items-center gap-2 transition-all flex-shrink-0"
                        >
                            <Edit3 size={16} />
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="w-full px-6 mt-8">
                <div className="flex gap-8 border-b border-white/10">
                    {['about', 'activity', 'chat', 'portfolio'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => selectTab(tab)}
                            className={`pb-3 px-2 font-medium capitalize transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <div className="w-full px-6 mt-8">

                {/* ── About ── */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Profile Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <Mail size={18} className="text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm text-white">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <Hash size={18} className="text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Roll Number</p>
                                        <p className="text-sm text-white">{user.rollNumber || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <Building size={18} className="text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Department</p>
                                        <p className="text-sm text-white">{department}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <User size={18} className="text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Year</p>
                                        <p className="text-sm text-white">{year}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-3">Bio</h3>
                            {(user.bio || editForm.bio) ? (
                                <p className="text-gray-300 leading-relaxed">{user.bio || editForm.bio}</p>
                            ) : (
                                <p className="text-gray-600 italic">No bio yet. Click Edit Profile to add one.</p>
                            )}
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Skills</h3>
                            {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border border-[#667eea]/30 rounded-lg text-sm text-indigo-300">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 italic text-sm">No skills added yet.</p>
                            )}
                        </div>

                        {(social.github || social.linkedin) && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">Social Links</h3>
                                <div className="space-y-3">
                                    {social.github && (
                                        <a href={`https://github.com/${social.github}`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                                            <Github size={20} className="text-gray-400 group-hover:text-white" />
                                            <span className="text-gray-300 group-hover:text-white">github.com/{social.github}</span>
                                            <ExternalLink size={16} className="ml-auto text-gray-600 group-hover:text-gray-400" />
                                        </a>
                                    )}
                                    {social.linkedin && (
                                        <a href={`https://linkedin.com/in/${social.linkedin}`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                                            <Linkedin size={20} className="text-gray-400 group-hover:text-blue-400" />
                                            <span className="text-gray-300 group-hover:text-white">linkedin.com/in/{social.linkedin}</span>
                                            <ExternalLink size={16} className="ml-auto text-gray-600 group-hover:text-gray-400" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Activity ── */}
                {activeTab === 'activity' && (
                    <div className="space-y-10 pb-8">
                        {activityLoading && (
                            <div className="flex items-center gap-3 text-gray-500 py-16 justify-center">
                                <Loader size={20} className="animate-spin" />
                                <span>Loading your activity…</span>
                            </div>
                        )}

                        {!activityLoading && activity && (
                            <>
                                {/* ── Event Tickets ── */}
                                <section>
                                    <button
                                        type="button"
                                        onClick={() => toggleSection('tickets')}
                                        className="w-full flex items-center justify-between mb-4 group"
                                    >
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Ticket size={20} className="text-indigo-400" />
                                            Event Tickets
                                        </h3>
                                        {openSections.tickets
                                            ? <ChevronDown size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                                            : <ChevronRight size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />}
                                    </button>
                                    {openSections.tickets && (activity.tickets.length === 0 ? (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                            <QrCode size={28} className="mx-auto mb-2 text-gray-600" />
                                            <p className="text-gray-500 text-sm">No event registrations yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {activity.tickets.map(reg => (
                                                <div key={reg._id} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                                                    <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 px-5 py-4 border-b border-white/10">
                                                        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1">{reg.clubName}</p>
                                                        <h4 className="text-base font-bold text-white leading-tight">{reg.eventTitle}</h4>
                                                        <div className="flex flex-wrap gap-3 mt-1.5">
                                                            {reg.eventDate && (
                                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                    <Calendar size={11} />
                                                                    {new Date(reg.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            )}
                                                            {reg.venue && (
                                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                    <MapPin size={11} />
                                                                    {reg.venue}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="px-5 py-4 flex items-center justify-between">
                                                        <div>
                                                            {reg.attended ? (
                                                                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                                    Attended
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-400">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                                                    Registered
                                                                </div>
                                                            )}
                                                            <p className="text-xs text-gray-600 mt-1 font-mono">#{reg.ticketId.slice(0, 8).toUpperCase()}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setTicketModal(reg)}
                                                            className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition-all flex items-center gap-1.5"
                                                        >
                                                            <QrCode size={15} />
                                                            View Ticket
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </section>

                                {/* ── Recruitment Applications ── */}
                                <section>
                                    <button
                                        type="button"
                                        onClick={() => toggleSection('applications')}
                                        className="w-full flex items-center justify-between mb-4 group"
                                    >
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Briefcase size={20} className="text-purple-400" />
                                            Recruitment Applications
                                        </h3>
                                        {openSections.applications
                                            ? <ChevronDown size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                                            : <ChevronRight size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />}
                                    </button>
                                    {openSections.applications && (activity.applications.length === 0 ? (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                            <Briefcase size={28} className="mx-auto mb-2 text-gray-600" />
                                            <p className="text-gray-500 text-sm">No applications yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {activity.applications.map(app => (
                                                <div key={app._id} className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-medium text-sm leading-tight">{app.postTitle}</p>
                                                        <p className="text-gray-500 text-xs mt-0.5">{app.clubName}</p>
                                                    </div>
                                                    {app.status === 'accepted' && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex-shrink-0">
                                                            <CheckCircle size={12} /> Accepted
                                                        </span>
                                                    )}
                                                    {app.status === 'pending' && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-semibold flex-shrink-0">
                                                            <Clock size={12} /> Pending
                                                        </span>
                                                    )}
                                                    {app.status === 'rejected' && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold flex-shrink-0">
                                                            <XCircle size={12} /> Rejected
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </section>

                                {/* ── Collab Connections ── */}
                                <section>
                                    <button
                                        type="button"
                                        onClick={() => toggleSection('collabConnections')}
                                        className="w-full flex items-center justify-between mb-4 group"
                                    >
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <UserCheck size={20} className="text-cyan-400" />
                                            Collab Connections
                                        </h3>
                                        {openSections.collabConnections
                                            ? <ChevronDown size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                                            : <ChevronRight size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />}
                                    </button>
                                    {openSections.collabConnections && (activity.collabConnections.sent.length === 0 && activity.collabConnections.received.length === 0 ? (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                            <UserCheck size={28} className="mx-auto mb-2 text-gray-600" />
                                            <p className="text-gray-500 text-sm">No collab connections yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Received — someone connected to my post */}
                                            {activity.collabConnections.received.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <Inbox size={12} /> Received
                                                    </p>
                                                    <div className="space-y-3">
                                                        {activity.collabConnections.received.map(c => (
                                                            <div key={c._id} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                                                                <button
                                                                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                                                                    onClick={() => setExpandedCollabs(prev => ({ ...prev, [c._id]: !prev[c._id] }))}
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-white text-sm font-medium leading-tight">{c.postTitle || 'Collab Post'}</p>
                                                                        {c.communityName && <p className="text-gray-500 text-xs mt-0.5">{c.communityName}</p>}
                                                                    </div>
                                                                    {expandedCollabs[c._id] ? <ChevronUp size={16} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />}
                                                                </button>
                                                                {expandedCollabs[c._id] && (
                                                                    <div className="border-t border-white/10 px-5 py-3">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="text-sm text-gray-300">{c.requester?.name}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                {c.status === 'pending' ? (
                                                                                    <button
                                                                                        onClick={() => acceptConnection(c._id)}
                                                                                        className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 text-xs font-medium transition-all"
                                                                                    >
                                                                                        Accept
                                                                                    </button>
                                                                                ) : (
                                                                                    <>
                                                                                        <span className="text-xs text-emerald-400 font-medium">Connected</span>
                                                                                        <Link
                                                                                            to={`/profile?tab=chat&with=${c.requester?._id}`}
                                                                                            onClick={() => selectTab('chat')}
                                                                                            className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all inline-flex items-center"
                                                                                        >
                                                                                            <MessageSquare size={13} className="inline mr-1" />
                                                                                            Chat
                                                                                        </Link>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sent — I connected to someone's post */}
                                            {activity.collabConnections.sent.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <Send size={12} /> Sent
                                                    </p>
                                                    <div className="space-y-3">
                                                        {activity.collabConnections.sent.map(c => (
                                                            <div key={c._id} className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-white text-sm font-medium leading-tight">{c.postTitle || 'Collab Post'}</p>
                                                                    {c.communityName && <p className="text-gray-500 text-xs mt-0.5">{c.communityName}</p>}
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    {c.status === 'accepted' ? (
                                                                        <>
                                                                            <span className="text-xs text-emerald-400 font-medium">Connected</span>
                                                                            <Link
                                                                                to={`/profile?tab=chat&with=${c.recipient?._id}`}
                                                                                onClick={() => selectTab('chat')}
                                                                                className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all inline-flex items-center"
                                                                            >
                                                                                <MessageSquare size={13} className="inline mr-1" />
                                                                                Chat
                                                                            </Link>
                                                                        </>
                                                                    ) : (
                                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
                                                                            <Clock size={11} /> Pending
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </section>

                                {/* ── General Connections ── */}
                                <section>
                                    <button
                                        type="button"
                                        onClick={() => toggleSection('generalConnections')}
                                        className="w-full flex items-center justify-between mb-4 group"
                                    >
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <MessageSquare size={20} className="text-violet-400" />
                                            General Connections
                                        </h3>
                                        {openSections.generalConnections
                                            ? <ChevronDown size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                                            : <ChevronRight size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />}
                                    </button>
                                    {openSections.generalConnections && (activity.generalConnections.sent.length === 0 && activity.generalConnections.received.length === 0 ? (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                            <MessageSquare size={28} className="mx-auto mb-2 text-gray-600" />
                                            <p className="text-gray-500 text-sm">No general connections yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Received */}
                                            {activity.generalConnections.received.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <Inbox size={12} /> Received
                                                    </p>
                                                    <div className="space-y-3">
                                                        {activity.generalConnections.received.map(c => (
                                                            <div key={c._id} className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                                                                <span className="text-sm text-gray-300">{c.requester?.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {c.status === 'pending' ? (
                                                                        <button
                                                                            onClick={() => acceptConnection(c._id)}
                                                                            className="px-3 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-400 text-xs font-medium transition-all"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                    ) : (
                                                                        <>
                                                                            <span className="text-xs text-emerald-400 font-medium">Connected</span>
                                                                            <Link
                                                                                to={`/profile?tab=chat&with=${c.requester?._id}`}
                                                                                onClick={() => selectTab('chat')}
                                                                                className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all inline-flex items-center"
                                                                            >
                                                                                <MessageSquare size={13} className="inline mr-1" />
                                                                                Chat
                                                                            </Link>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sent */}
                                            {activity.generalConnections.sent.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <Send size={12} /> Sent
                                                    </p>
                                                    <div className="space-y-3">
                                                        {activity.generalConnections.sent.map(c => (
                                                            <div key={c._id} className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                                                                <span className="text-sm text-gray-300">{c.recipient?.name}</span>
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    {c.status === 'accepted' ? (
                                                                        <>
                                                                            <span className="text-xs text-emerald-400 font-medium">Connected</span>
                                                                            <Link
                                                                                to={`/profile?tab=chat&with=${c.recipient?._id}`}
                                                                                onClick={() => selectTab('chat')}
                                                                                className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all inline-flex items-center"
                                                                            >
                                                                                <MessageSquare size={13} className="inline mr-1" />
                                                                                Chat
                                                                            </Link>
                                                                        </>
                                                                    ) : (
                                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
                                                                            <Clock size={11} /> Pending
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </section>

                                {/* ── My Collab Posts ── */}
                                <section>
                                    <button
                                        type="button"
                                        onClick={() => toggleSection('myCollabs')}
                                        className="w-full flex items-center justify-between mb-4 group"
                                    >
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Users size={20} className="text-pink-400" />
                                            My Collab Posts
                                        </h3>
                                        {openSections.myCollabs
                                            ? <ChevronDown size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                                            : <ChevronRight size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />}
                                    </button>
                                    {openSections.myCollabs && (myCollabsLoading ? (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-center gap-3 text-gray-500 text-sm">
                                            <Loader size={16} className="animate-spin" /> Loading…
                                        </div>
                                    ) : myCollabs.length === 0 ? (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                            <Users size={28} className="mx-auto mb-2 text-gray-600" />
                                            <p className="text-gray-500 text-sm">You haven't posted any collab requests yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {myCollabs.map(c => (
                                                <div key={c._id} className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4">
                                                    <div className="flex items-start justify-between gap-3 mb-1">
                                                        <p className="text-white font-medium text-sm leading-tight">{c.title}</p>
                                                        <button
                                                            onClick={() => setDeleteCollabId(c._id)}
                                                            title="Delete this collab"
                                                            className="p-1.5 rounded hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <p className="text-gray-500 text-xs">
                                                        {c.communityName || 'General'} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-pink-300 text-xs mt-1.5">
                                                        {c.connectionCount || 0} connection{c.connectionCount === 1 ? '' : 's'} generated
                                                    </p>
                                                    {deleteCollabId === c._id && (
                                                        <div className="mt-3 flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                                                            <span className="text-xs text-red-200 flex-1">Delete this collab request?</span>
                                                            <button
                                                                onClick={() => deleteMyCollab(c._id)}
                                                                className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-medium transition-colors"
                                                            >
                                                                Yes
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteCollabId(null)}
                                                                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium transition-colors"
                                                            >
                                                                No
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </section>
                            </>
                        )}
                    </div>
                )}

                {/* QR Ticket Modal */}
                {ticketModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setTicketModal(null)}>
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{ticketModal.clubName}</p>
                                    <h3 className="text-lg font-bold text-white leading-tight">{ticketModal.eventTitle}</h3>
                                </div>
                                <button onClick={() => setTicketModal(null)} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={22} />
                                </button>
                            </div>
                            <div className="flex justify-center bg-white rounded-2xl p-4 mb-4">
                                <QRCode value={ticketModal.ticketId} size={220} />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-xs font-mono text-gray-400">#{ticketModal.ticketId.slice(0, 8).toUpperCase()}</p>
                                {ticketModal.eventDate && (
                                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                        <Calendar size={11} />
                                        {new Date(ticketModal.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                                <p className="text-xs text-gray-600 mt-2">Show this QR at the venue entrance.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Chat ── */}
                {activeTab === 'chat' && (
                    <div className="pb-8">
                        <ChatTab currentUserId={user._id} />
                    </div>
                )}

                {/* ── Portfolio ── */}
                {activeTab === 'portfolio' && (
                    <div className="pb-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Briefcase size={22} />
                            Projects & Experience
                        </h3>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                            <Briefcase size={32} className="mx-auto mb-3 text-gray-600" />
                            <p className="text-gray-500">No portfolio items yet.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <ImageUploadField
                                label="Banner Image"
                                value={editForm.bannerImage}
                                onChange={(v) => setEditForm(f => ({ ...f, bannerImage: v }))}
                                aspect="banner"
                            />
                            <ImageUploadField
                                label="Profile Photo"
                                value={editForm.profilePic}
                                onChange={(v) => setEditForm(f => ({ ...f, profilePic: v }))}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500/50 resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={e => setNewSkill(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="Add a skill…"
                                    />
                                    <button onClick={addSkill} className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-indigo-300 transition-all">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editForm.skills.map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border border-[#667eea]/30 rounded-lg text-sm text-indigo-300 flex items-center gap-2">
                                            {s}
                                            <button onClick={() => setEditForm(f => ({ ...f, skills: f.skills.filter((_, j) => j !== i) }))} className="hover:text-red-400 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">GitHub Username</label>
                                <div className="flex items-center gap-2">
                                    <Github size={20} className="text-gray-500" />
                                    <input
                                        type="text"
                                        value={editForm.github}
                                        onChange={e => setEditForm(f => ({ ...f, github: e.target.value }))}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="yourusername"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn Username</label>
                                <div className="flex items-center gap-2">
                                    <Linkedin size={20} className="text-gray-500" />
                                    <input
                                        type="text"
                                        value={editForm.linkedin}
                                        onChange={e => setEditForm(f => ({ ...f, linkedin: e.target.value }))}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="your-profile-name"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 p-6 flex gap-3">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-medium transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {savingProfile && <Loader size={14} className="animate-spin" />}
                                {savingProfile ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default StudentProfile;
