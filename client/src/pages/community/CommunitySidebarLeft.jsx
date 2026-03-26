import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { COMMUNITY_DASHBOARD_DATA } from '../../data/mockData';

const CommunitySidebarLeft = () => {
    const navigate = useNavigate();
    const { communityDetails, channels, collabRequests } = COMMUNITY_DASHBOARD_DATA;
    const [channelsOpen, setChannelsOpen] = useState(true);

    return (
        <div className="h-full w-full flex flex-col bg-zinc-900 border-r border-white/10 text-gray-300 font-sans">
            {/* 1. Top Header (Community Info) */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-2xl border border-blue-500/30">
                        {communityDetails.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-white text-sm truncate">{communityDetails.name}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400">{communityDetails.memberCount} members</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
                {/* 2. Channels Section */}
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
                                    to={`/community/comm_001/chat/${channel.id}`}
                                    className={({ isActive }) => `
                    flex items-center gap-2 px-2 py-2 rounded-lg text-sm group transition-all
                    ${isActive ? 'bg-blue-600/10 text-blue-300' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}
                  `}
                                >
                                    <span className="text-lg leading-none opacity-50 group-hover:opacity-100">#</span>
                                    <span className="truncate">{channel.name}</span>
                                </NavLink>
                            ))}
                            {/* Discussions Channel */}
                            <NavLink
                                to="/community/comm_001/forum/discussions"
                                className={({ isActive }) => `
                  flex items-center gap-2 px-2 py-2 rounded-lg text-sm group transition-all
                  ${isActive ? 'bg-blue-600/10 text-blue-300' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}
                `}
                            >
                                <span className="text-lg leading-none opacity-50 group-hover:opacity-100">💬</span>
                                <span className="truncate">Discussions</span>
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* 3. Collaboration Requests Section */}
                <div className="px-3">
                    <NavLink
                        to="/community/comm_001/collabs"
                        className={({ isActive }) => `
              relative overflow-hidden flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-sm font-medium
              ${isActive
                                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                : 'bg-zinc-800/50 border-white/5 text-gray-400 hover:border-white/10 hover:bg-zinc-800 hover:text-gray-200'}
            `}
                    >
                        <div className="p-1.5 rounded-lg bg-zinc-700/50 text-gray-400 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span>Collab Requests</span>
                        {collabRequests.length > 0 && (
                            <span className="ml-auto bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full font-mono">
                                {collabRequests.length}
                            </span>
                        )}
                    </NavLink>
                </div>
            </div>

            {/* 4. Bottom (Exit) */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={() => navigate('/home')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Exit Community
                </button>
            </div>
        </div>
    );
};

export default CommunitySidebarLeft;
