import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronUp, MessageSquare, Loader, Send } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
}

const PostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { community, isMember, isManager } = useOutletContext();
    const canComment = isMember || isManager;

    const [thread, setThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentBody, setCommentBody] = useState('');
    const [sending, setSending] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [upvoting, setUpvoting] = useState(false);

    const intervalRef = useRef(null);
    const bottomRef = useRef(null);

    const fetchThread = useCallback(async () => {
        const token = getToken();
        try {
            const { data } = await axios.get(
                `${API}/api/communities/${community._id}/discussions/${postId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setThread(prev => {
                // Preserve upvote count from local state if user just upvoted
                if (prev && data._id === prev._id) return { ...data, upvotes: Math.max(data.upvotes, prev.upvotes) };
                return data;
            });
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load thread');
        } finally {
            setLoading(false);
        }
    }, [community._id, postId]);

    useEffect(() => {
        fetchThread();
        intervalRef.current = setInterval(fetchThread, 3000);
        return () => clearInterval(intervalRef.current);
    }, [fetchThread]);

    const handleUpvote = async () => {
        setUpvoting(true);
        try {
            const token = getToken();
            const { data } = await axios.post(
                `${API}/api/communities/${community._id}/discussions/${postId}/upvote`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setThread(prev => prev ? { ...prev, upvotes: data.upvotes } : prev);
        } catch (err) {
            console.error(err);
        } finally {
            setUpvoting(false);
        }
    };

    const handleComment = async () => {
        setCommentError('');
        if (!commentBody.trim()) { setCommentError('Comment cannot be empty'); return; }
        setSending(true);
        try {
            const token = getToken();
            await axios.post(
                `${API}/api/communities/${community._id}/discussions/${postId}/comments`,
                { body: commentBody },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCommentBody('');
            await fetchThread();
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            setCommentError(err.response?.data?.error || 'Failed to post comment');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full gap-2 text-gray-500">
                <Loader size={18} className="animate-spin" /> Loading threadâ€¦
            </div>
        );
    }
    if (error || !thread) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-gray-400 text-lg">{error || 'Post not found'}</p>
                    <button
                        onClick={() => navigate(`/community/${community._id}/forum/discussions`)}
                        className="mt-4 text-blue-400 hover:text-blue-300"
                    >
                        â† Back to Discussions
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
                <button
                    onClick={() => navigate(`/community/${community._id}/forum/discussions`)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={18} />
                    <span className="font-medium text-sm">Back to Discussions</span>
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                    {/* Thread */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex flex-col items-center gap-1 pt-2 min-w-[40px]">
                            <button
                                onClick={handleUpvote}
                                disabled={upvoting}
                                className="text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-40"
                                title="Upvote"
                            >
                                {upvoting ? <Loader size={20} className="animate-spin" /> : <ChevronUp size={22} />}
                            </button>
                            <span className="text-lg font-bold text-white font-mono">{thread.upvotes}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-white mb-3 leading-snug">{thread.title}</h1>
                            <div className="flex items-center gap-3 text-sm text-gray-400 mb-6 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{thread.authorAvatar}</span>
                                    <span className="font-medium text-gray-300">{thread.authorName}</span>
                                </div>
                                <span>â€¢</span>
                                <span>{timeAgo(thread.createdAt)}</span>
                            </div>
                            <p className="text-gray-300 text-base leading-relaxed whitespace-pre-line">{thread.body}</p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-8" />

                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <MessageSquare size={18} />
                        {thread.comments.length} Comment{thread.comments.length === 1 ? '' : 's'}
                    </h2>

                    {thread.comments.length === 0 ? (
                        <div className="text-center py-10 bg-zinc-900/30 rounded-lg border border-white/5 mb-6">
                            <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mb-6">
                            {thread.comments.map(c => (
                                <div key={c._id} className="flex gap-3 p-4 bg-zinc-900/40 border border-white/5 rounded-xl">
                                    <div className="text-lg flex-shrink-0">{c.authorAvatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-white text-sm">{c.authorName}</span>
                                            <span className="text-xs text-gray-500">{timeAgo(c.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div ref={bottomRef} />

                    {/* Comment input */}
                    {canComment && (
                        <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-4 mt-2">
                            <textarea
                                value={commentBody}
                                onChange={e => setCommentBody(e.target.value)}
                                rows={3}
                                placeholder="Write a commentâ€¦"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment();
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none mb-3"
                            />
                            {commentError && <p className="text-xs text-red-400 mb-2">{commentError}</p>}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleComment}
                                    disabled={sending || !commentBody.trim()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50"
                                >
                                    {sending ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
                                    Comment
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">Ctrl+Enter to submit</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
