import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CLUB_DASHBOARD_DATA } from '../data/mockData';

const ClubSidebarLeft = () => {
    const navigate = useNavigate();
    const { clubDetails, channels, liveOps } = CLUB_DASHBOARD_DATA;
    const [channelsOpen, setChannelsOpen] = useState(true);
    const [liveOpsOpen, setLiveOpsOpen] = useState(true);

    return (
        <div className="h-full w-full flex flex-col bg-zinc-900 border-r border-white/10 text-gray-300 font-sans">
            {/* 1. Top Header (Profile) */}
            <div
                onClick={() => navigate('/club/profile')}
                className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-2xl border border-violet-500/30 group-hover:border-violet-500/50 transition-colors">
                        {clubDetails.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-white text-sm truncate">{clubDetails.name}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">{clubDetails.role}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
                {/* 2. Communication Section */}
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
                            {channels.map((channel) => (
                                <NavLink
                                    key={channel.id}
                                    to={`/club/chat/${channel.id}`}
                                    className={({ isActive }) => `
                    flex items-center gap-2 px-2 py-2 rounded-lg text-sm group transition-all
                    ${isActive ? 'bg-violet-600/10 text-violet-300' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}
                  `}
                                >
                                    <span className="text-lg leading-none opacity-50 group-hover:opacity-100">#</span>
                                    <span className="truncate">{channel.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Live Ops Section */}
                <div className="px-3">
                    <div
                        onClick={() => setLiveOpsOpen(!liveOpsOpen)}
                        className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors"
                    >
                        <span>Live Operations</span>
                        <span className={`transform transition-transform duration-200 ${liveOpsOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>

                    {liveOpsOpen && (
                        <div className="mt-1 space-y-0.5">
                            {liveOps.map((op) => (
                                <NavLink
                                    key={op.id}
                                    to={`/club/stats/${op.id}`}
                                    className={({ isActive }) => `
                    flex flex-col px-3 py-2.5 rounded-lg text-sm group transition-all border border-transparent
                    ${isActive ? 'bg-amber-600/10 border-amber-500/20' : 'hover:bg-white/5 hover:border-white/5'}
                  `}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium truncate text-gray-300 group-hover:text-white">
                                            {op.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        <span className="text-xs text-amber-500/80 font-mono">{op.stats}</span>
                                    </div>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Intelligence Section */}
                <div className="px-3">
                    <NavLink
                        to="/club/insights"
                        className={({ isActive }) => `
              relative overflow-hidden flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-sm font-medium
              ${isActive
                                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                : 'bg-zinc-800/50 border-white/5 text-gray-400 hover:border-white/10 hover:bg-zinc-800 hover:text-gray-200'}
            `}
                    >
                        <div className="p-1.5 rounded-lg bg-zinc-700/50 text-gray-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span>AI Insights</span>
                    </NavLink>
                </div>
            </div>

            {/* 5. Bottom (Exit) */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={() => navigate('/student/home')} // Assuming this is the home path
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Exit Club View
                </button>
            </div>
        </div>
    );
};

export default ClubSidebarLeft;
