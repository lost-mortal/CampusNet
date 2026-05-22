import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send, Loader, Hash } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 3000;

function formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return `Today at ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

const GeneralChannel = () => {
    const { community, currentUserId } = useOutletContext();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const scrollerRef = useRef(null);
    const wasAtBottomRef = useRef(true);

    const fetchMessages = useCallback(async () => {
        const token = getToken();
        try {
            const { data } = await axios.get(`${API}/api/communities/${community._id}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(data);
        } catch (err) {
            console.error('Failed to load messages', err);
        } finally {
            setLoading(false);
        }
    }, [community._id]);

    // Initial load + polling
    useEffect(() => {
        fetchMessages();
        const id = setInterval(fetchMessages, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [fetchMessages]);

    // Auto-scroll to bottom on new messages if user was already near bottom
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        if (wasAtBottomRef.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [messages]);

    const onScroll = () => {
        const el = scrollerRef.current;
        if (!el) return;
        wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };

    const send = async (e) => {
        e?.preventDefault?.();
        const body = draft.trim();
        if (!body) return;
        const token = getToken();
        setSending(true);
        setDraft('');
        try {
            await axios.post(`${API}/api/communities/${community._id}/messages`,
                { body },
                { headers: { Authorization: `Bearer ${token}` } });
            wasAtBottomRef.current = true;
            await fetchMessages();
        } catch (err) {
            console.error('Failed to send', err);
            setDraft(body); // restore so user can retry
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Hash size={18} className="text-gray-500" />
                    general
                </h2>
            </div>

            <div ref={scrollerRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                        <Loader size={16} className="animate-spin" /> Loading messages…
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">#</div>
                        <h3 className="text-lg font-bold text-white mb-1">No messages yet</h3>
                        <p className="text-gray-500 text-sm">Be the first to say something.</p>
                    </div>
                ) : (
                    messages.map(m => {
                        const mine = m.sender && String(m.sender._id) === String(currentUserId);
                        return (
                            <div key={m._id} className="flex gap-3 group">
                                <div className="w-9 h-9 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center text-base">
                                    {m.sender?.avatar || '👤'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`font-medium text-sm ${mine ? 'text-indigo-300' : 'text-white'}`}>
                                            {m.sender?.name || 'Unknown'}
                                            {mine && <span className="text-gray-500 text-xs ml-1">(you)</span>}
                                        </span>
                                        <span className="text-xs text-gray-500">{formatTime(m.createdAt)}</span>
                                    </div>
                                    <p className="text-gray-300 whitespace-pre-wrap break-words text-sm leading-relaxed">{m.body}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={send} className="p-4 border-t border-white/10 bg-zinc-900/50">
                <div className="bg-zinc-800/50 rounded-lg p-2 flex items-end gap-2 border border-white/5 focus-within:border-white/20 transition-colors">
                    <textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                        placeholder="Message #general"
                        rows={1}
                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500 resize-none px-2 py-1 text-sm max-h-32"
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim() || sending}
                        className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-1 px-1">Polling every {POLL_INTERVAL_MS / 1000}s</p>
            </form>
        </div>
    );
};

export default GeneralChannel;
