import React, { useEffect, useState } from 'react';
import { Bell, Loader } from 'lucide-react';
import api from '../../lib/api';

function relativeTime(iso) {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
}

const Notifications = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        api.get('/api/notifications/me')
            .then(r => { if (mounted) setItems(r.data || []); })
            .catch(() => {})
            .finally(() => { if (mounted) setLoading(false); });

        // Mark all as read when panel opens
        api.patch('/api/notifications/mark-read').catch(() => {});

        return () => { mounted = false; };
    }, []);

    return (
        <main className="flex-1 min-w-0 border-r border-white/5 bg-black text-gray-200">
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-6 pb-6 border-b border-white/5 px-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Bell size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-white">Notifications</h1>
                </div>
                <p className="text-sm text-gray-500 ml-13">Activity across your applications, events, and connections.</p>
            </div>

            <div className="p-6 space-y-3">
                {loading ? (
                    <div className="flex items-center gap-3 text-gray-500 py-20 justify-center">
                        <Loader size={20} className="animate-spin" />
                        <span>Loading…</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                            <Bell size={28} className="text-yellow-500/50" />
                        </div>
                        <p className="text-gray-500">No new alerts.</p>
                    </div>
                ) : (
                    items.map(n => (
                        <div
                            key={n._id}
                            className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                                n.read
                                    ? 'bg-[#0f0f12] border-white/5'
                                    : 'bg-yellow-500/5 border-yellow-500/20'
                            }`}
                        >
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-gray-700' : 'bg-yellow-400'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-200">{n.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{relativeTime(n.createdAt)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
};

export default Notifications;
