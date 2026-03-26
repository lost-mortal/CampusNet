import React from 'react';
import { CLUB_DASHBOARD_DATA } from '../data/mockData';

const ClubMemberList = () => {
    const { members } = CLUB_DASHBOARD_DATA;

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-emerald-500 text-emerald-500';
            case 'idle': return 'bg-amber-500 text-amber-500';
            case 'offline': return 'bg-zinc-600 text-zinc-500';
            default: return 'bg-zinc-500';
        }
    };

    return (
        <div className="h-full w-full bg-zinc-900 border-l border-white/10 p-4 font-sans text-gray-300">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Club Members — {members.length}
            </h3>

            <div className="space-y-4">
                {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm border border-white/10">
                                {member.avatar}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${getStatusColor(member.status).split(' ')[0]}`}></div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">
                                    {member.name}
                                </h4>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{member.role}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClubMemberList;
