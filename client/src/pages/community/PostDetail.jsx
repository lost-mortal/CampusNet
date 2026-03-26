import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COMMUNITY_DASHBOARD_DATA } from '../../data/mockData';

const PostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { discussions } = COMMUNITY_DASHBOARD_DATA;
    const post = discussions.find(p => p.id === postId);
    const [upvoted, setUpvoted] = useState(false);

    if (!post) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-gray-400 text-lg">Post not found</p>
                    <button
                        onClick={() => navigate('/community/comm_001/forum/discussions')}
                        className="mt-4 text-blue-400 hover:text-blue-300"
                    >
                        ← Back to Discussions
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header with Back Button */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <button
                    onClick={() => navigate('/community/comm_001/forum/discussions')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Back to Discussions</span>
                </button>
            </div>

            {/* Post Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Post Header */}
                    <div className="flex gap-4 mb-6">
                        {/* Upvote Section */}
                        <div className="flex flex-col items-center gap-2 pt-2">
                            <button
                                onClick={() => setUpvoted(!upvoted)}
                                className={`transition-colors ${upvoted ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'
                                    }`}
                            >
                                <svg className="w-6 h-6" fill={upvoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <span className="text-lg font-bold text-white font-mono">
                                {post.upvotes + (upvoted ? 1 : 0)}
                            </span>
                            <button className="text-gray-400 hover:text-red-400 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Post Details */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-white mb-3">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{post.authorAvatar}</span>
                                    <span className="font-medium text-gray-300">{post.author}</span>
                                </div>
                                <span>•</span>
                                <span>{post.timePosted}</span>
                            </div>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 text-base leading-relaxed whitespace-pre-line">
                                    {post.content}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10 my-8"></div>

                    {/* Comments Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.commentCount} Comments
                        </h2>

                        {/* Comment Input */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-4 mb-6">
                            <textarea
                                placeholder="What are your thoughts?"
                                className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 resize-none"
                                rows="3"
                            ></textarea>
                            <div className="flex justify-end mt-2">
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    Comment
                                </button>
                            </div>
                        </div>

                        {/* Comments Placeholder */}
                        <div className="text-center py-12 bg-zinc-900/30 rounded-lg border border-white/5">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                                💬
                            </div>
                            <p className="text-gray-400">Comments section coming soon!</p>
                            <p className="text-gray-500 text-sm mt-1">Full discussion thread will be available in the next update.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
