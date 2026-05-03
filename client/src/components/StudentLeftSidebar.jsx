import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Megaphone, Search, Bell, Settings, Zap, Users, ChevronRight, LogOut } from 'lucide-react';
import { USER_DATA } from '../data/mockData';

const StudentLeftSidebar = ({ user: initialUser }) => {
    const [user, setUser] = useState(initialUser);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    const navItems = [
        { icon: <Home size={20} />, label: "Home", path: "/home" },
        { icon: <Megaphone size={20} />, label: "Announcements", path: "/announcements" },
        { icon: <Search size={20} />, label: "Search", path: '/search' },
        { icon: <Bell size={20} />, label: "Notifications", path: "/notifications" },
        { icon: <Settings size={20} />, label: "Settings", path: "/settings" },
    ];

    return (
        <aside className="hidden lg:flex flex-col w-72 border-r border-white/5 p-6 h-screen sticky top-0 bg-black">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center">
                    <Zap size={18} className="text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">CampusNet</span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item, idx) => (
                    <Link
                        key={idx}
                        to={item.path}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-white/5 hover:text-gray-200 text-gray-400`}
                    >
                        <span className="text-gray-500 group-hover:text-gray-300">
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Identity Cards (Footer) */}
            <div className="mt-auto flex flex-col gap-3 py-6 border-t border-white/5">
                {/* Card 1: Student Info - Clickable */}
                <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 group cursor-pointer hover:scale-[1.02]"
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl border border-white/10 group-hover:border-white/20">
                        {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-100 truncate group-hover:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate group-hover:text-gray-400">{user.details || 'Student'}</div>
                    </div>
                </Link>

                {/* Card 2: Club Info (or Explore) */}
                {(user.role === 'president' || user.role === 'member') ? (
                    <Link
                        to="/club/chat"
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl border border-indigo-500/30 group-hover:border-indigo-500/50">
                            {user.clubLogo || '🛡️'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-indigo-300 group-hover:text-indigo-200 truncate">
                                {user.clubName}
                            </div>
                            <div className="text-xs text-indigo-400/70 uppercase tracking-wider font-semibold">
                                {user.role}
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-indigo-500/50 group-hover:text-indigo-400" />
                    </Link>
                ) : (
                    <Link
                        to="/search"
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                            <Search size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-400 group-hover:text-gray-200">Explore Clubs</div>
                            <div className="text-xs text-gray-600 group-hover:text-gray-500">Find your community</div>
                        </div>
                        <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500" />
                    </Link>
                )}

                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="mt-2 text-xs text-center text-gray-600 hover:text-red-400 transition-colors"
                >
                    Sign Out
                </button>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                        <h3 className="text-xl font-bold text-white mb-2">Sign Out?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to end your session?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    localStorage.removeItem('userRole');
                                    window.location.href = '/';
                                }}
                                className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default StudentLeftSidebar;
