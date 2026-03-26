import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Users, CheckSquare, Megaphone, ShieldCheck, Search, Settings, Briefcase } from 'lucide-react';

const AdminSidebar = () => {
    const navItems = [
        { path: '/admin/dashboard', label: 'Analytics Dashboard', icon: BarChart3 },
        { path: '/admin/users', label: 'Manage Users', icon: Users },
        { path: '/admin/clubs', label: 'Manage Clubs', icon: Briefcase },
        { path: '/admin/communities', label: 'Manage Communities', icon: CheckSquare },
        { path: '/admin/announcements', label: 'Post Announcement', icon: Megaphone }
    ];

    return (
        <div className="w-64 h-screen bg-[#0a0a0a] border-r border-white/5 flex flex-col sticky top-0">
            {/* Header */}
            <div className="p-6 border-b border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                        <p className="text-xs text-gray-500">Campus Management</p>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search student or club..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive
                                    ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/50 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                                    : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                                }`
                            }
                        >
                            <Icon size={20} className="flex-shrink-0" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
                <NavLink
                    to="/admin/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-3 ${isActive
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`
                    }
                >
                    <Settings size={20} />
                    <span className="text-sm font-medium">Settings</span>
                </NavLink>

                <div className="px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Logged in as</p>
                    <p className="text-sm font-semibold text-purple-400">Campus Admin</p>
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;
