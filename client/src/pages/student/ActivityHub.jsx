import React, { useState, useEffect } from 'react';
import { Ticket, CalendarDays, MapPin, Loader } from 'lucide-react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const ActivityHub = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        axios.get(`${API}/api/registrations/my`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setRegistrations(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="flex-1 min-w-0 border-r border-white/5 bg-black text-gray-200">
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-6 pb-6 border-b border-white/5 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Ticket size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Activity Hub</h1>
                        <p className="text-sm text-gray-500">Your event tickets</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {loading && (
                    <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
                        <Loader size={20} className="animate-spin" />
                        <span>Loading your tickets…</span>
                    </div>
                )}

                {!loading && registrations.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Ticket size={24} className="text-gray-500" />
                        </div>
                        <p className="text-gray-500">No event registrations yet.</p>
                        <p className="text-gray-600 text-sm mt-1">Register for events in the feed to see your tickets here.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {registrations.map(reg => (
                        <div key={reg._id} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                            {/* Ticket header */}
                            <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-5 border-b border-white/10">
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">{reg.clubName}</p>
                                <h3 className="text-lg font-bold text-white leading-tight">{reg.eventTitle}</h3>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {reg.eventDate && (
                                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                            <CalendarDays size={13} />
                                            {new Date(reg.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                    {reg.venue && (
                                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                            <MapPin size={13} />
                                            {reg.venue}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* QR + status */}
                            <div className="p-5 flex items-center gap-5">
                                <div className="bg-white p-3 rounded-xl flex-shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                    <QRCode value={reg.ticketId} size={180} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {reg.attended ? (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            Attended
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                                            Registered
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-600 mt-3 leading-relaxed">Show this QR code at the venue entrance to check in.</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default ActivityHub;
