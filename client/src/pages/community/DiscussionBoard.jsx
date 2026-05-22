import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MessageSquare, TrendingUp, Clock, Award, ChevronUp, Loader, Plus, X } from 'lucide-react';
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

const SORTS = [
    { id: 'hot', label: 'Hot', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'top', label: 'Top', icon: Award },
];

function hotScore(t) {
    const hours = (Date.now() - new Date(t.createdAt)) / 3_600_000;
    return t.upvotes / (hours + 2);
}

const DiscussionBoard = () => {
    const navigate = useNavigate();
    const { community, isMember, isManager } = useOutletContext();
    const canPost = isMember || isManager;

    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('hot');
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [upvotingId, setUpvotingId] = useState(null);

    const intervalRef = useRef(null);

    const fetchThreads = useCallback(async () => {
        const token = getToken();
        try {
            const { data } = await axios.get(`${API}/api/communities/${community._id}/discussions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setThreads(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [community._id]);

    useEffect(() => {
        fetchThreads();
        intervalRef.current = setInterval(fetchThreads, 3000);
        return () => clearInterval(intervalRef.current);
    }, [fetchThreads]);

    const sorted = useMemo(() => {
        const arr = [...threads];
        if (sort === 'new') arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        else if (sort === 'top') arr.sort((a, b) => b.upvotes - a.upvotes);
        else arr.sort((a, b) => hotScore(b) - hotScore(a));
        return arr;
    }, [threads, sort]);

    const handleSubmit = async () => {
        setFormError('');
        if (!title.trim()) { setFormError('Title is required'); return; }
        if (!body.trim()) { setFormError('Body is required'); return; }
        setSubmitting(true);
        try {
            const token = getToken();
            await axios.post(`${API}/api/communities/${community._id}/discussions`,
                { title, body },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTitle(''); setBody(''); setShowForm(false);
            fetchThreads();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to post');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpvote = async (threadId, e) => {
        e.stopPropagation();
        setUpvotingId(threadId);
        try {
            const token = getToken();
            const { data } = await axios.post(
                `${API}/api/communities/${community._id}/discussions/${threadId}/upvote`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setThreads(prev => prev.map(t => t._id === threadId ? { ...t, upvotes: data.upvotes } : t));
        } catch (err) {
            console.error(err);
        } finally {
            setUpvotingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <MessageSquare size={18} className="text-blue-400" />
                            Discussions
                        </h2>
                        {canPost && (
                            <button
                                onClick={() => { setShowForm(f => !f); setFormError(''); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
                            >
                                {showForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> New Thread</>}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {SORTS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setSort(id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                    sort === id
                                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inline new-thread form */}
                {showForm && (
                    <div className="px-6 pb-4 border-t border-white/5 pt-4 space-y-3">
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Thread title…"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                        />
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={4}
                            placeholder="What's on your mind?"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
                        />
                        {formError && <p className="text-xs text-red-400">{formError}</p>}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setShowForm(false); setTitle(''); setBody(''); setFormError(''); }}
                                className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {submitting ? <Loader size={13} className="animate-spin" /> : null}
                                Post Thread
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                        <Loader size={16} className="animate-spin" /> Loading discussions…
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageSquare size={28} className="mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-500 text-sm">No discussions yet.{canPost ? ' Start one above.' : ''}</p>
                    </div>
                ) : (
                    sorted.map((post) => (
                        <div
                            key={post._id}
                            onClick={() => navigate(`/community/${community._id}/forum/discussions/${post._id}`)}
                            className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 hover:bg-zinc-900/80 transition-all cursor-pointer group"
                        >
                            <div className="flex gap-4">
                                {/* Upvote */}
                                <div className="flex flex-col items-center gap-1 pt-1 min-w-[34px]">
                                    <button
                                        onClick={(e) => handleUpvote(post._id, e)}
                                        disabled={upvotingId === post._id}
                                        className="text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-40"
                                        title="Upvote"
                                    >
                                        {upvotingId === post._id
                                            ? <Loader size={16} className="animate-spin" />
                                            : <ChevronUp size={18} />}
                                    </button>
                                    <span className="text-sm font-bold text-gray-300 font-mono">{post.upvotes}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-semibold text-base mb-2 group-hover:text-blue-300 transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2 whitespace-pre-line">
                                        {post.body}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-base">{post.authorAvatar}</span>
                                            <span>{post.authorName}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{timeAgo(post.createdAt)}</span>
                                        <span>•</span>
                                        <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-blue-400 transition-colors">
                                            <MessageSquare size={13} />
                                            <span className="font-medium">{post.commentCount} comments</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DiscussionBoard;
