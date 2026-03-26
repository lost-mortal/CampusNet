import React, { useState, useEffect } from 'react';
import { User, Mail, Hash, Building, Github, Linkedin, Edit3, X, Plus, Briefcase, Award, Calendar, MapPin, ExternalLink, Users as UsersIcon, Ticket, MessageSquare } from 'lucide-react';
import { USER_PROFILES, USER_ACTIVITY, PORTFOLIO_ITEMS } from '../../data/mockData';

const StudentProfile = () => {
    const [activeTab, setActiveTab] = useState('about');
    const [showEditModal, setShowEditModal] = useState(false);
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [activityData, setActivityData] = useState(null);
    const [portfolioData, setPortfolioData] = useState([]);

    // Edit form state
    const [editForm, setEditForm] = useState({
        bio: '',
        skills: [],
        github: '',
        linkedin: ''
    });
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);

                // Load profile data
                const profile = USER_PROFILES[userData.name];
                setProfileData(profile);

                // Load activity data
                const activity = USER_ACTIVITY[userData.name];
                setActivityData(activity);

                // Load portfolio data
                const portfolio = PORTFOLIO_ITEMS[userData.name] || [];
                setPortfolioData(portfolio);

                // Initialize edit form
                if (profile) {
                    setEditForm({
                        bio: profile.bio,
                        skills: [...profile.skills],
                        github: profile.social.github,
                        linkedin: profile.social.linkedin
                    });
                }
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, []);

    const handleSaveProfile = () => {
        // In a real app, this would save to backend
        // For now, we'll just update local state
        setProfileData({
            ...profileData,
            bio: editForm.bio,
            skills: editForm.skills,
            social: {
                github: editForm.github,
                linkedin: editForm.linkedin
            }
        });
        setShowEditModal(false);
    };

    const addSkill = () => {
        if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
            setEditForm({
                ...editForm,
                skills: [...editForm.skills, newSkill.trim()]
            });
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setEditForm({
            ...editForm,
            skills: editForm.skills.filter(skill => skill !== skillToRemove)
        });
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'Interview Scheduled':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Accepted':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'Rejected':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    if (!user || !profileData) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <p className="text-gray-400">Loading profile...</p>
            </div>
        );
    }

    return (
        <main className="flex-1 min-w-0 bg-black min-h-screen pb-20 border-r border-white/5">
            {/* Header Section */}
            <div className="relative mb-6">
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
                </div>

                {/* Profile Info */}
                <div className="w-full px-6">
                    <div className="flex items-start gap-6 -mt-16">
                        {/* Avatar - with higher z-index to appear above banner */}
                        <div className="relative z-10 w-32 h-32 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border-4 border-black flex items-center justify-center text-5xl shadow-2xl flex-shrink-0">
                            {user.avatar}
                        </div>

                        {/* Name and Details */}
                        <div className="flex-1 pt-16">
                            <h1 className="text-3xl font-bold text-white mb-1">{user.name}</h1>
                            <p className="text-gray-400 text-sm mb-2">
                                {user.details} • {user.role === 'president' ? 'Club President' : user.role === 'member' ? 'Club Member' : 'Student'}
                            </p>
                            {user.clubName && (
                                <div className="flex items-center gap-2 text-indigo-400 text-sm">
                                    <span className="text-lg">{user.clubLogo}</span>
                                    <span>{user.clubName}</span>
                                </div>
                            )}
                        </div>

                        {/* Edit Profile Button */}
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="mt-16 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white flex items-center gap-2 transition-all flex-shrink-0"
                        >
                            <Edit3 size={16} />
                            <span>Edit Profile</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="w-full px-6 mt-8">
                <div className="flex gap-8 border-b border-white/10">
                    {['about', 'activity', 'portfolio'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-2 font-medium capitalize transition-all relative ${activeTab === tab
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="w-full px-6 mt-8">
                {/* About Tab */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        {/* Profile Info (Read-Only) */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Profile Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <Mail size={18} className="text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm text-white">{profileData.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <Hash size={18} className="text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Roll Number</p>
                                        <p className="text-sm text-white">{profileData.rollNo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <Building size={18} className="text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Department</p>
                                        <p className="text-sm text-white">{profileData.department}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <User size={18} className="text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Year</p>
                                        <p className="text-sm text-white">{profileData.year}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-3">Bio</h3>
                            <p className="text-gray-300 leading-relaxed">{profileData.bio}</p>
                        </div>

                        {/* Skills */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {profileData.skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border border-[#667eea]/30 rounded-lg text-sm text-indigo-300"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Social Links</h3>
                            <div className="space-y-3">
                                {profileData.social.github && (
                                    <a
                                        href={`https://github.com/${profileData.social.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                                    >
                                        <Github size={20} className="text-gray-400 group-hover:text-white" />
                                        <span className="text-gray-300 group-hover:text-white">github.com/{profileData.social.github}</span>
                                        <ExternalLink size={16} className="ml-auto text-gray-600 group-hover:text-gray-400" />
                                    </a>
                                )}
                                {profileData.social.linkedin && (
                                    <a
                                        href={`https://linkedin.com/in/${profileData.social.linkedin}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                                    >
                                        <Linkedin size={20} className="text-gray-400 group-hover:text-blue-400" />
                                        <span className="text-gray-300 group-hover:text-white">linkedin.com/in/{profileData.social.linkedin}</span>
                                        <ExternalLink size={16} className="ml-auto text-gray-600 group-hover:text-gray-400" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && activityData && (
                    <div className="space-y-10 pb-8">
                        {/* My Applications */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                                <UsersIcon size={22} />
                                My Applications
                            </h3>
                            {activityData.applications.length === 0 ? (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                    <p className="text-gray-500">No club applications yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activityData.applications.map((app) => (
                                        <div key={app.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                                                        {app.clubLogo}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white text-lg">{app.clubName}</h4>
                                                        <p className="text-sm text-gray-400 mt-1">{app.position}</p>
                                                        <p className="text-xs text-gray-600 mt-2">Applied on {new Date(app.appliedDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${getStatusBadgeColor(app.status)}`}>
                                                        {app.status}
                                                    </span>
                                                    {app.interviewDate && (
                                                        <p className="text-xs text-blue-400 mt-2">
                                                            {new Date(app.interviewDate).toLocaleDateString()} at {app.interviewTime}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* My Registrations */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                                <Ticket size={22} />
                                My Event Registrations
                            </h3>
                            <div className="space-y-4">
                                {activityData.registrations.map((reg) => (
                                    <div key={reg.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                                                    {reg.eventLogo}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white text-lg">{reg.eventName}</h4>
                                                    <p className="text-sm text-gray-400 mt-1">Ticket ID: {reg.ticketId}</p>
                                                    <p className="text-xs text-gray-600 mt-2">
                                                        Event Date: {new Date(reg.eventDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {reg.role && (
                                                <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-medium flex-shrink-0">
                                                    {reg.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* My Collabs */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                                <MessageSquare size={22} />
                                My Collaboration Requests
                            </h3>
                            <div className="space-y-4">
                                {activityData.collabs.map((collab) => (
                                    <div key={collab.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                                        <h4 className="font-bold text-white mb-2 text-lg">{collab.title}</h4>
                                        <p className="text-sm text-gray-400 mb-4">{collab.description}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">Posted in {collab.communityName}</span>
                                            <span className="text-gray-600">{collab.responses} responses</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                    <div className="pb-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Briefcase size={22} />
                            Projects & Experience
                        </h3>
                        {portfolioData.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                <p className="text-gray-500">No portfolio items yet</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#667eea] to-[#764ba2]"></div>

                                <div className="space-y-10">
                                    {portfolioData.map((item, idx) => (
                                        <div key={item.id} className="relative pl-20">
                                            {/* Timeline dot */}
                                            <div className="absolute left-5 top-3 w-6 h-6 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] border-4 border-black"></div>

                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                                                <div className="flex items-start justify-between mb-4 gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {item.type === 'internship' ? (
                                                                <Award size={20} className="text-yellow-400 flex-shrink-0" />
                                                            ) : (
                                                                <Briefcase size={20} className="text-blue-400 flex-shrink-0" />
                                                            )}
                                                            <h4 className="font-bold text-white text-lg">{item.title}</h4>
                                                        </div>
                                                        <p className="text-sm text-gray-400 flex items-center gap-2">
                                                            <Calendar size={14} />
                                                            {item.duration}
                                                        </p>
                                                    </div>
                                                    {item.link && (
                                                        <a
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-400 hover:text-indigo-300 transition-colors flex-shrink-0"
                                                        >
                                                            <ExternalLink size={20} />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-gray-300 mb-4 leading-relaxed">{item.description}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.technologies.map((tech, techIdx) => (
                                                        <span
                                                            key={techIdx}
                                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400"
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500/50 resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            {/* Skills */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="Add a skill..."
                                    />
                                    <button
                                        onClick={addSkill}
                                        className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-indigo-300 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editForm.skills.map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border border-[#667eea]/30 rounded-lg text-sm text-indigo-300 flex items-center gap-2"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => removeSkill(skill)}
                                                className="hover:text-red-400 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* GitHub */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">GitHub Username</label>
                                <div className="flex items-center gap-2">
                                    <Github size={20} className="text-gray-500" />
                                    <input
                                        type="text"
                                        value={editForm.github}
                                        onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="yourusername"
                                    />
                                </div>
                            </div>

                            {/* LinkedIn */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn Username</label>
                                <div className="flex items-center gap-2">
                                    <Linkedin size={20} className="text-gray-500" />
                                    <input
                                        type="text"
                                        value={editForm.linkedin}
                                        onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="your-profile-name"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 p-6 flex gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#6a4193] text-white font-medium transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default StudentProfile;
