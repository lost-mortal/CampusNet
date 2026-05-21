import React, { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Megaphone, Hash, MessageSquare, Users, LogOut } from 'lucide-react';

// All four channels listed uniformly, matching the club sidebar's style.
const CHANNELS = [
    { key: 'announcements', label: 'announcements', to: 'chat/announcements', icon: Megaphone },
    { key: 'general',       label: 'general',       to: 'chat/general',       icon: Hash },
    { key: 'discussions',   label: 'discussions',   to: 'forum/discussions',  icon: MessageSquare },
    { key: 'collabs',       label: 'collab-requests', to: 'collabs',          icon: Users },
];

const CommunitySidebarLeft = ({ community }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [channelsOpen, setChannelsOpen] = useState(true);

    return (
        <div className="h-full w-full flex flex-col bg-zinc-900 border-r border-white/10 text-gray-300 font-sans">
            {/* Community header — name + manager. Click to open About page. */}
            <div
                onClick={() => navigate(`/community/${id}/about`)}
                className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors group"
                title="View community profile"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-2xl border border-blue-500/30 group-hover:border-blue-500/50 transition-colors">
                        {community?.icon || '🌐'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-white text-sm truncate">{community?.name || 'Community'}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            <span className="text-xs text-blue-400 font-medium tracking-wide uppercase">
                                {community?.isManager ? 'Manager' : 'Member'}
                            </span>
                        </div>
                    </div>
                </div>
                {community?.manager?.name && (
                    <p className="text-[11px] text-gray-500 mt-2.5">
                        Managed by <span className="text-gray-300">{community.manager.name}</span>
                    </p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
                {/* Channels — all four uniform */}
                <div className="px-3">
                    <div
                        onClick={() => setChannelsOpen(!channelsOpen)}
                        className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors"
                    >
                        <span>Channels</span>
                        <span className={`transform transition-transform duration-200 ${channelsOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>

                    {channelsOpen && (
                        <div className="mt-1 space-y-0.5">
                            {CHANNELS.map((ch) => {
                                const Icon = ch.icon;
                                return (
                                    <NavLink
                                        key={ch.key}
                                        to={`/community/${id}/${ch.to}`}
                                        className={({ isActive }) => `
                                            flex items-center gap-2 px-2 py-2 rounded-lg text-sm group transition-all
                                            ${isActive ? 'bg-blue-600/10 text-blue-300' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}
                                        `}
                                    >
                                        <Icon size={14} className="opacity-60 group-hover:opacity-100 flex-shrink-0" />
                                        <span className="truncate">{ch.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Exit */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={() => navigate('/home')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                >
                    <LogOut size={15} />
                    Exit Community
                </button>
            </div>
        </div>
    );
};

export default CommunitySidebarLeft;
