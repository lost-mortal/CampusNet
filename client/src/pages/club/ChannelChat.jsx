import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { Loader, Send, Megaphone } from 'lucide-react';
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

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── Announcements Channel ───────────────────────────────────────────────────
const AnnouncementsChannel = ({ isPresident }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const intervalRef = useRef(null);

    const fetchAnnouncements = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/api/clubs/my/announcements`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
        intervalRef.current = setInterval(fetchAnnouncements, 3000);
        return () => clearInterval(intervalRef.current);
    }, [fetchAnnouncements]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setSending(true);
        setError('');
        try {
            await axios.post(`${API}/api/clubs/my/announcements`, { body: body.trim() }, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setBody('');
            await fetchAnnouncements();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Megaphone size={18} className="text-amber-400" />
                    announcements
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Compose — president only */}
                    {isPresident && (
                        <form onSubmit={handlePost} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
                            <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-widest mb-3">Post Announcement</p>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                rows={3}
                                placeholder="Write an announcement for your club…"
                                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(e); }}
                                className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/40 resize-none mb-3"
                            />
                            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] text-gray-600">Ctrl+Enter to post</p>
                                <button
                                    type="submit"
                                    disabled={sending || !body.trim()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all disabled:opacity-50"
                                >
                                    {sending ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
                                    Post
                                </button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                            <Loader size={16} className="animate-spin" /> Loading…
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📢</div>
                            <h3 className="text-lg font-bold text-white mb-2">No announcements yet</h3>
                            <p className="text-gray-500 text-sm">
                                {isPresident ? 'Use the form above to post the first announcement.' : 'The president hasn\'t posted anything yet.'}
                            </p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item._id} className="bg-zinc-900/60 border border-amber-500/10 rounded-xl p-5 hover:border-amber-500/20 transition-all">
                                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-4">{item.body}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-white/5 pt-3">
                                    <span className="text-base">{item.authorAvatar}</span>
                                    <span className="font-medium text-amber-400/80">{item.authorName}</span>
                                    <span>·</span>
                                    <span>{timeAgo(item.createdAt)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── General / Custom Chat Channel ──────────────────────────────────────────
const ChatChannel = ({ channelId }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const intervalRef = useRef(null);
    const prevLengthRef = useRef(0);

    const fetchMessages = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/api/clubs/my/channels/${channelId}/messages`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setMessages(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [channelId]);

    useEffect(() => {
        setMessages([]);
        setLoading(true);
        fetchMessages();
        intervalRef.current = setInterval(fetchMessages, 3000);
        return () => clearInterval(intervalRef.current);
    }, [fetchMessages]);

    // scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevLengthRef.current = messages.length;
    }, [messages.length]);

    const handleSend = async () => {
        if (!body.trim()) return;
        setSending(true);
        try {
            await axios.post(`${API}/api/clubs/my/channels/${channelId}/messages`, { body: body.trim() }, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setBody('');
            await fetchMessages();
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-gray-500">#</span>
                    {channelId}
                </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-full gap-2 text-gray-500">
                        <Loader size={16} className="animate-spin" /> Loading…
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-2xl mb-4">#</div>
                        <h3 className="text-lg font-bold text-white mb-2">Welcome to #{channelId}!</h3>
                        <p className="text-gray-500 text-sm">This is the start of the {channelId} channel. Say something!</p>
                    </div>
                ) : (
                    <div className="space-y-1 max-w-4xl mx-auto">
                        {messages.map((msg, i) => {
                            const showHeader = i === 0 || messages[i - 1].authorName !== msg.authorName;
                            return (
                                <div key={msg._id} className={`flex gap-3 group ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
                                    {showHeader ? (
                                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-base flex-shrink-0 border border-white/5">
                                            {msg.authorAvatar}
                                        </div>
                                    ) : (
                                        <div className="w-9 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        {showHeader && (
                                            <div className="flex items-baseline gap-2 mb-0.5">
                                                <span className="font-semibold text-sm text-white">{msg.authorName}</span>
                                                <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
                                            </div>
                                        )}
                                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex-shrink-0">
                <div className="flex items-end gap-2 bg-zinc-800/60 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-violet-500/40 transition-colors">
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={1}
                        placeholder={`Message #${channelId}`}
                        className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-gray-600 resize-none"
                        style={{ maxHeight: '120px' }}
                        onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !body.trim()}
                        className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors disabled:opacity-30"
                    >
                        {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
                <p className="text-[10px] text-gray-700 mt-1 ml-1">Enter to send · Shift+Enter for new line</p>
            </div>
        </div>
    );
};

// ─── Root component ──────────────────────────────────────────────────────────
const ChannelChat = () => {
    const { channelId } = useParams();
    const { isPresident } = useOutletContext() || {};
    const navigate = useNavigate();

    useEffect(() => {
        if (!channelId) {
            const id = setTimeout(() => navigate('/club/chat/general', { replace: true }), 0);
            return () => clearTimeout(id);
        }
    }, [channelId, navigate]);

    if (!channelId) return null;

    if (channelId === 'announcements') {
        return <AnnouncementsChannel isPresident={isPresident} />;
    }
    return <ChatChannel channelId={channelId} />;
};

export default ChannelChat;
