import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Plus, X, Loader, Send, UserPlus, Check, Trash2 } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const CommunityCollabs = () => {
    const { community, isMember, currentUserId } = useOutletContext();
    const [collabs, setCollabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState([]);
    const [skillDraft, setSkillDraft] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [connectingId, setConnectingId] = useState(null);
    const [connectedIds, setConnectedIds] = useState(new Set());
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const deleteCollab = async (collabId) => {
        try {
            const token = getToken();
            await axios.delete(`${API}/api/posts/${collabId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCollabs(prev => prev.filter(c => c._id !== collabId));
            setDeleteTargetId(null);
        } catch (err) {
            console.error('Delete failed', err);
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    const fetchCollabs = useCallback(async () => {
        const token = getToken();
        try {
            const { data } = await axios.get(`${API}/api/communities/${community._id}/collabs`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCollabs(data);
        } catch (err) {
            console.error('Failed to load collabs', err);
        } finally {
            setLoading(false);
        }
    }, [community._id]);

    useEffect(() => { fetchCollabs(); }, [fetchCollabs]);

    const handleConnect = async (collabId, e) => {
        e.stopPropagation();
        setConnectingId(collabId);
        try {
            const token = getToken();
            await axios.post(`${API}/api/connections`, {
                type: 'collab',
                sourcePostId: collabId,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setConnectedIds(prev => new Set([...prev, collabId]));
        } catch (err) {
            // 409 = already connected/requested — treat as success
            if (err.response?.status === 409) {
                setConnectedIds(prev => new Set([...prev, collabId]));
            } else {
                console.error('Connect failed', err);
            }
        } finally {
            setConnectingId(null);
        }
    };

    const addSkill = () => {
        const s = skillDraft.trim();
        if (s && !skills.includes(s)) setSkills([...skills, s]);
        setSkillDraft('');
    };

    const resetForm = () => {
        setTitle(''); setDescription(''); setSkills([]); setSkillDraft(''); setError('');
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setError('Title and description are required');
            return;
        }
        const token = getToken();
        setSubmitting(true);
        setError('');
        try {
            await axios.post(`${API}/api/communities/${community._id}/collabs`,
                { title: title.trim(), description: description.trim(), skills },
                { headers: { Authorization: `Bearer ${token}` } });
            resetForm();
            setShowForm(false);
            await fetchCollabs();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create collab request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users size={18} className="text-purple-400" />
                        Collaboration Requests
                    </h2>
                    {isMember && !showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
                        >
                            <Plus size={15} />
                            New Request
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-4">
                    {/* Create form */}
                    {showForm && (
                        <form onSubmit={submit} className="bg-zinc-900/60 border border-purple-500/20 rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-purple-300 uppercase tracking-widest">New collab request</p>
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="What are you building?"
                                className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                            />
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe the project, what you need, who you're looking for"
                                rows={4}
                                className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none"
                            />
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">Skills needed</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        value={skillDraft}
                                        onChange={e => setSkillDraft(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        placeholder="e.g. React"
                                        className="flex-1 bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                    />
                                    <button type="button" onClick={addSkill} className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-sm">
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map(s => (
                                        <span key={s} className="px-2.5 py-1 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-1.5">
                                            {s}
                                            <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="hover:text-red-300">
                                                <X size={11} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting || !title.trim() || !description.trim()}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition flex items-center gap-2"
                                >
                                    {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                                    Post Request
                                </button>
                            </div>
                        </form>
                    )}

                    {/* List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                            <Loader size={16} className="animate-spin" /> Loading collabs…
                        </div>
                    ) : collabs.length === 0 && !showForm ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🤝</div>
                            <h3 className="text-xl font-bold text-white mb-2">No collaboration requests yet</h3>
                            <p className="text-gray-500 mb-6">Be the first to post a collaboration opportunity!</p>
                            {isMember && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
                                >
                                    Create Request
                                </button>
                            )}
                        </div>
                    ) : (
                        collabs.map((collab) => {
                            const isMine = collab.authorId && collab.authorId.toString() === currentUserId;
                            return (
                            <div
                                key={collab._id}
                                className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-purple-500/30 hover:bg-zinc-900/80 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors flex-1">
                                        {collab.title}
                                    </h3>
                                    {isMine && (
                                        <button
                                            onClick={() => setDeleteTargetId(collab._id)}
                                            title="Delete this collab"
                                            className="p-1.5 rounded hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                {deleteTargetId === collab._id && (
                                    <div className="mb-3 flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                                        <span className="text-xs text-red-200 flex-1">Delete this collab request?</span>
                                        <button
                                            onClick={() => deleteCollab(collab._id)}
                                            className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-medium transition-colors"
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() => setDeleteTargetId(null)}
                                            className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium transition-colors"
                                        >
                                            No
                                        </button>
                                    </div>
                                )}
                                <p className="text-gray-400 text-sm mb-4 leading-relaxed whitespace-pre-wrap">{collab.description}</p>
                                {collab.skills?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {collab.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3 text-xs text-gray-500 pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-base">{collab.authorAvatar}</span>
                                            <span className="text-gray-400">{collab.authorName}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{timeAgo(collab.createdAt)}</span>
                                    </div>
                                    {/* Connect button — hidden for own posts */}
                                    {collab.authorId && collab.authorId.toString() !== currentUserId && (
                                        connectedIds.has(collab._id) ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <Check size={12} /> Requested
                                            </span>
                                        ) : (
                                            <button
                                                onClick={(e) => handleConnect(collab._id, e)}
                                                disabled={connectingId === collab._id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all disabled:opacity-50"
                                            >
                                                {connectingId === collab._id
                                                    ? <Loader size={12} className="animate-spin" />
                                                    : <UserPlus size={12} />}
                                                Connect
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunityCollabs;
