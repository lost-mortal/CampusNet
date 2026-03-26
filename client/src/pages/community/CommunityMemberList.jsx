import React from 'react';
import { COMMUNITY_DASHBOARD_DATA } from '../../data/mockData';

const CommunityMemberList = () => {
    const { members } = COMMUNITY_DASHBOARD_DATA;

    const statusColors = {
        online: 'bg-emerald-500',
        idle: 'bg-amber-500',
        offline: 'bg-gray-500'
    };

    return (
        <div className="h-full w-full flex flex-col bg-zinc-900 border-l border-white/10 text-gray-300 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Members — {members.length}
                </h3>
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
                                {member.avatar}
                            </div>
                            <span
                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${statusColors[member.status]}`}
                            ></span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                                {member.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{member.role}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommunityMemberList;
