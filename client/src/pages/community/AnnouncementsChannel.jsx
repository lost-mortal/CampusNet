import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Megaphone, Send, Loader } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

function formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return `Today at ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

const AnnouncementsChannel = () => {
    const { community, isManager } = useOutletContext();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');

    const fetchAnnouncements = useCallback(async () => {
        const token = getToken();
        try {
            const { data } = await axios.get(`${API}/api/communities/${community._id}/announcements`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnnouncements(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load announcements');
        } finally {
            setLoading(false);
        }
    }, [community._id]);

    useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

    const submit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        const token = getToken();
        setPosting(true);
        setError('');
        try {
            await axios.post(`${API}/api/communities/${community._id}/announcements`,
                { title: title.trim(), body: body.trim() },
                { headers: { Authorization: `Bearer ${token}` } });
            setTitle('');
            setBody('');
            await fetchAnnouncements();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post announcement');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Megaphone size={18} className="text-purple-400" />
                    announcements
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Manager compose form */}
                {isManager && (
                    <form onSubmit={submit} className="bg-zinc-900/60 border border-purple-500/20 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest">Post a new announcement</p>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Title"
                            className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        />
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Body â€” what does the community need to know?"
                            rows={3}
                            className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                        {error && <p className="text-red-400 text-xs">{error}</p>}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={posting || !title.trim() || !body.trim()}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
                            >
                                {posting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                                Post
                            </button>
                        </div>
                    </form>
                )}

                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                        <Loader size={16} className="animate-spin" /> Loading announcementsâ€¦
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">ðŸ“¢</div>
                        <h3 className="text-lg font-bold text-white mb-1">No announcements yet</h3>
                        <p className="text-gray-500 text-sm">
                            {isManager ? 'Post the first announcement above.' : 'The manager hasn\'t posted anything yet.'}
                        </p>
                    </div>
                ) : (
                    announcements.map(a => (
                        <div key={a._id} className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex-shrink-0 flex items-center justify-center text-lg">
                                ðŸ‘©â€ðŸ’¼
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-medium text-white">{a.authorName}</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded-full">Manager</span>
                                    <span className="text-xs text-gray-500">{formatTime(a.createdAt)}</span>
                                </div>
                                <h4 className="text-white font-semibold mb-1">{a.title}</h4>
                                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AnnouncementsChannel;
