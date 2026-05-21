import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { getToken } from '../lib/session';
import { API_URL as API, SOCKET_URL } from '../lib/config';

function formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const ChatTab = ({ currentUserId }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [conversations, setConversations] = useState([]);
    const [listLoading, setListLoading] = useState(true);

    // Active thread: { otherUserId, name, avatar }
    const [activeThread, setActiveThread] = useState(null);
    const [threadMessages, setThreadMessages] = useState([]);
    const [threadLoading, setThreadLoading] = useState(false);
    const [threadError, setThreadError] = useState(null);
    const [draft, setDraft] = useState('');

    const socketRef = useRef(null);
    const scrollerRef = useRef(null);
    const activeRoomIdRef = useRef(null);

    // Refresh conversations list
    const loadConversations = useCallback(async () => {
        const token = getToken();
        try {
            const { data } = await axios.get(`${API}/api/messages/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConversations(data);
        } catch (err) {
            console.error('Failed to load conversations', err);
        } finally {
            setListLoading(false);
        }
    }, []);

    // Initialize socket on mount, tear down on unmount
    useEffect(() => {
        const token = getToken();
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect_error', (err) => {
            console.error('Socket connect_error:', err.message);
        });

        socket.on('history', ({ roomId, messages }) => {
            if (roomId !== activeRoomIdRef.current) return;
            setThreadMessages(messages);
            setThreadLoading(false);
        });

        socket.on('new_message', (msg) => {
            if (msg.roomId !== activeRoomIdRef.current) {
                // Refresh conversation list if a message arrives for another room
                loadConversations();
                return;
            }
            setThreadMessages(prev => {
                // If this is our own echo (clientId match), replace the temp entry
                if (msg.clientId) {
                    const idx = prev.findIndex(m => m.clientId === msg.clientId);
                    if (idx >= 0) {
                        const next = prev.slice();
                        next[idx] = { ...msg, pending: false };
                        return next;
                    }
                }
                // Dedup by _id
                if (prev.some(m => m._id && m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        loadConversations();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [loadConversations]);

    // Scroll thread to bottom when messages change
    useEffect(() => {
        if (scrollerRef.current) {
            scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
        }
    }, [threadMessages, activeThread]);

    // Open a thread (verify gate, join room)
    const openThread = useCallback(async (otherUserId) => {
        setThreadError(null);
        setThreadLoading(true);
        setThreadMessages([]);
        const token = getToken();
        try {
            const { data } = await axios.get(`${API}/api/messages/with/${otherUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const thread = {
                otherUserId: data.otherUserId,
                name: data.name,
                avatar: data.avatar,
                department: data.department,
                year: data.year,
            };
            setActiveThread(thread);

            const sortedIds = [String(currentUserId), String(data.otherUserId)].sort();
            activeRoomIdRef.current = sortedIds.join('_');

            socketRef.current?.emit('join_room', { otherUserId: data.otherUserId }, (ack) => {
                if (ack?.error) {
                    setThreadError(ack.error);
                    setThreadLoading(false);
                }
            });
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to open chat';
            setThreadError(msg);
            setActiveThread({ otherUserId, name: 'Unknown', avatar: '👤' });
            setThreadLoading(false);
        }
    }, [currentUserId]);

    // Handle ?with=<userId> deep-link
    useEffect(() => {
        const withId = searchParams.get('with');
        if (!withId || !socketRef.current || activeThread?.otherUserId === withId) return;
        openThread(withId);
    }, [searchParams, openThread, activeThread]);

    const closeThread = () => {
        if (activeRoomIdRef.current) {
            socketRef.current?.emit('leave_room', { roomId: activeRoomIdRef.current });
        }
        activeRoomIdRef.current = null;
        setActiveThread(null);
        setThreadMessages([]);
        setThreadError(null);
        setDraft('');
        // Clean ?with= from URL
        if (searchParams.get('with')) {
            const next = new URLSearchParams(searchParams);
            next.delete('with');
            setSearchParams(next, { replace: true });
        }
        // Refresh conversation list so new threads appear
        loadConversations();
    };

    const sendMessage = () => {
        const body = draft.trim();
        if (!body || !activeThread || !socketRef.current) return;
        const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Optimistic append
        setThreadMessages(prev => [
            ...prev,
            {
                clientId,
                sender: String(currentUserId),
                receiver: String(activeThread.otherUserId),
                body,
                createdAt: new Date().toISOString(),
                pending: true,
            },
        ]);
        setDraft('');

        socketRef.current.emit('send_message', { to: activeThread.otherUserId, body, clientId }, (ack) => {
            if (ack?.error) {
                // Mark message failed
                setThreadMessages(prev => prev.map(m => m.clientId === clientId ? { ...m, pending: false, failed: true } : m));
            }
        });
    };

    // ── State 2: Open thread ───────────────────────────────────────
    if (activeThread) {
        return (
            <div className="flex flex-col h-[calc(100vh-340px)] min-h-[480px] bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-zinc-900/60">
                    <button
                        onClick={closeThread}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        title="Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                        {activeThread.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold leading-tight">{activeThread.name}</p>
                        {activeThread.department && (
                            <p className="text-gray-500 text-xs">{activeThread.year} · {activeThread.department}</p>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                    {threadLoading && (
                        <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                            <Loader size={16} className="animate-spin" />
                            <span className="text-sm">Loading messages…</span>
                        </div>
                    )}
                    {threadError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                            <AlertCircle size={22} className="mx-auto mb-1.5 text-red-400" />
                            <p className="text-red-300 text-sm font-medium">{threadError}</p>
                        </div>
                    )}
                    {!threadLoading && !threadError && threadMessages.length === 0 && (
                        <div className="text-center py-10">
                            <MessageSquare size={28} className="mx-auto mb-2 text-gray-700" />
                            <p className="text-gray-500 text-sm">No messages yet. Say hi 👋</p>
                        </div>
                    )}
                    {threadMessages.map((m, i) => {
                        const mine = String(m.sender) === String(currentUserId);
                        const key = m._id || m.clientId || i;
                        return (
                            <div key={key} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-snug ${
                                    mine
                                        ? `bg-gradient-to-br from-indigo-500 to-purple-600 text-white ${m.failed ? 'opacity-50' : ''} ${m.pending ? 'opacity-80' : ''}`
                                        : 'bg-zinc-800 text-gray-200 border border-white/5'
                                }`}>
                                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                    <p className={`text-[10px] mt-0.5 ${mine ? 'text-white/60' : 'text-gray-500'}`}>
                                        {formatTime(m.createdAt)}
                                        {m.failed && <span className="ml-1 text-red-200">· failed</span>}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input */}
                {!threadError && (
                    <div className="flex items-end gap-2 px-4 py-3 border-t border-white/10 bg-zinc-900/60">
                        <textarea
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            rows={1}
                            placeholder="Type a message…"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none max-h-32"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!draft.trim()}
                            className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                            title="Send"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ── State 1: Conversation list ─────────────────────────────────
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                <MessageSquare size={20} className="text-indigo-400" />
                Conversations
            </h3>

            {listLoading && (
                <div className="flex items-center gap-3 text-gray-500 py-10 justify-center">
                    <Loader size={18} className="animate-spin" />
                    <span className="text-sm">Loading conversations…</span>
                </div>
            )}

            {!listLoading && conversations.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                    <MessageSquare size={28} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-gray-400 text-sm font-medium">No conversations yet.</p>
                    <p className="text-gray-500 text-xs mt-1">Connect with someone to start chatting.</p>
                </div>
            )}

            {!listLoading && conversations.map(c => (
                <button
                    key={c.roomId}
                    onClick={() => openThread(c.otherUserId)}
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 hover:bg-zinc-800/80 rounded-2xl px-4 py-3 flex items-center gap-3 transition-all text-left"
                >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                        {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-white text-sm font-semibold truncate">{c.name}</p>
                            <span className="text-[11px] text-gray-500 flex-shrink-0">{formatTime(c.lastAt)}</span>
                        </div>
                        <p className="text-gray-500 text-xs truncate mt-0.5">
                            {c.lastFromMe && <span className="text-gray-600">You: </span>}
                            {c.lastBody}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default ChatTab;
