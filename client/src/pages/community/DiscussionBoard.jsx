import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_DASHBOARD_DATA } from '../../data/mockData';

const DiscussionBoard = () => {
    const navigate = useNavigate();
    const { discussions } = COMMUNITY_DASHBOARD_DATA;
    const [activeFilter, setActiveFilter] = useState('hot');

    const handlePostClick = (postId) => {
        navigate(`/community/comm_001/forum/discussions/${postId}`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                        <span className="text-gray-500">💬</span>
                        Discussions
                    </h2>
                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        {['hot', 'new', 'top'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeFilter === filter
                                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {discussions.map((post) => (
                    <div
                        key={post.id}
                        onClick={() => handlePostClick(post.id)}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 hover:bg-zinc-900/80 transition-all cursor-pointer group"
                    >
                        <div className="flex gap-4">
                            {/* Upvote Section */}
                            <div className="flex flex-col items-center gap-1 pt-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Upvote logic here
                                    }}
                                    className="text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                                <span className="text-sm font-bold text-gray-300 font-mono">{post.upvotes}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Downvote logic here
                                    }}
                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Post Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-base mb-2 group-hover:text-blue-300 transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                    {post.summary}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-base">{post.authorAvatar}</span>
                                        <span>{post.author}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{post.timePosted}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-blue-400 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <span className="font-medium">{post.commentCount} comments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiscussionBoard;
