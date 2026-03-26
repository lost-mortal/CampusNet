import React from 'react';
import { COMMUNITY_DASHBOARD_DATA } from '../../data/mockData';

const CommunityCollabs = () => {
    const { collabRequests } = COMMUNITY_DASHBOARD_DATA;

    const handleNewRequest = () => {
        alert('Create new collaboration request - Feature coming soon!');
    };

    const handleViewDetails = (collabId) => {
        alert(`View details for collaboration: ${collabId} - Feature coming soon!`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Collaboration Requests
                    </h2>
                    <button
                        onClick={handleNewRequest}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Request
                    </button>
                </div>
            </div>

            {/* Collab Cards */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-4">
                    {collabRequests.map((collab) => (
                        <div
                            key={collab.id}
                            className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-purple-500/30 hover:bg-zinc-900/80 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors">
                                    {collab.title}
                                </h3>
                            </div>

                            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                {collab.description}
                            </p>

                            {/* Skills Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {collab.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-base">{collab.authorAvatar}</span>
                                        <span className="text-gray-400">{collab.author}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{collab.timePosted}</span>
                                </div>
                                <button
                                    onClick={() => handleViewDetails(collab.id)}
                                    className="px-4 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-medium transition-all"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {collabRequests.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                🤝
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No collaboration requests yet</h3>
                            <p className="text-gray-500 mb-6">Be the first to post a collaboration opportunity!</p>
                            <button
                                onClick={handleNewRequest}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
                            >
                                Create Request
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunityCollabs;
