import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Sparkles, Loader, Users, Building2, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getToken } from '../../lib/session';
import ProfileModal from '../../components/ProfileModal';

const API = import.meta.env.VITE_API_URL;

const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };

const SUGGESTIONS = [
    'I want to learn robotics',
    'Looking for designers to collaborate with',
    'Find communities for web development',
    'Who works on AI projects?',
];

const LOADING_PHRASES = [
    'Reading minds…',
    'Connecting the dots…',
    'Scanning the campus…',
    'Consulting the oracle…',
    'Reticulating splines…',
    'Asking around…',
    'Following the breadcrumbs…',
    'Sniffing out matches…',
];
const pickPhrase = () => LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];

const Search = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null); // null = no search yet
    const [error, setError] = useState('');
    const [sentTo, setSentTo] = useState(new Set()); // student IDs with sent requests
    const [connecting, setConnecting] = useState(null); // student ID currently being connected
    const [loadingPhrase, setLoadingPhrase] = useState('');
    const [profileModal, setProfileModal] = useState(null); // { type, id } or null

    const navigate = useNavigate();
    const token = getToken();

    const handleSearch = async (q) => {
        const searchQuery = (q || query).trim();
        if (!searchQuery) return;
        setQuery(searchQuery);
        setLoading(true);
        setLoadingPhrase(pickPhrase());
        setError('');
        setResults(null);
        try {
            const { data } = await axios.post(
                `${API}/api/ai/search`,
                { query: searchQuery },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResults(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (studentId) => {
        setConnecting(studentId);
        try {
            await axios.post(
                `${API}/api/connections`,
                { recipientId: studentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSentTo(prev => new Set([...prev, studentId]));
        } catch (err) {
            if (err.response?.status === 409) {
                // Already sent — still show as sent
                setSentTo(prev => new Set([...prev, studentId]));
            }
        } finally {
            setConnecting(null);
        }
    };

    const hasResults = results && (
        results.clubs?.length > 0 ||
        results.communities?.length > 0 ||
        results.students?.length > 0
    );

    return (
        <main className="flex-1 min-w-0 border-r border-white/5 bg-black text-[#e4e6eb] overflow-y-auto">
            {profileModal && (
                <ProfileModal type={profileModal.type} id={profileModal.id} onClose={() => setProfileModal(null)} />
            )}
            {/* Search header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-white/5 px-8 py-5">
                <div className="flex items-center gap-3 mb-1">
                    <Sparkles size={16} className="text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">AI Discovery</span>
                </div>
                <form
                    onSubmit={e => { e.preventDefault(); handleSearch(); }}
                    className="flex gap-3"
                >
                    <div className="relative flex-1">
                        <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Describe what you're looking for..."
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-2 shrink-0"
                    >
                        {loading
                            ? <><Loader size={14} className="animate-spin" /> Searching…</>
                            : <><SearchIcon size={14} /> Search</>}
                    </button>
                </form>
            </div>

            <div className="p-8">
                {/* Error */}
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Sparkles size={24} className="text-indigo-400 animate-pulse" />
                        </div>
                        <p className="text-sm">{loadingPhrase}</p>
                    </div>
                )}

                {/* Idle state — no search yet */}
                {!loading && !results && !error && (
                    <div className="max-w-lg mx-auto text-center pt-12">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                            <Sparkles size={28} className="text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">AI Discovery Hub</h2>
                        <p className="text-gray-500 text-sm mb-8">
                            Describe what you're looking for in plain English. Our AI will find clubs, communities, and students that match.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            {SUGGESTIONS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleSearch(s)}
                                    className="px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:border-indigo-500/30 hover:bg-zinc-800 transition-all text-left flex items-center gap-2 group"
                                >
                                    <ChevronRight size={14} className="text-gray-600 group-hover:text-indigo-400 shrink-0" />
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Zero results */}
                {!loading && results && !hasResults && (
                    <div className="text-center py-20 text-gray-600">
                        <SearchIcon size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No matches found. Try rephrasing your query.</p>
                    </div>
                )}

                {/* Results */}
                {!loading && hasResults && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-10"
                        >
                            {/* Clubs */}
                            {results.clubs?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Building2 size={15} className="text-indigo-400" />
                                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                            Clubs <span className="text-gray-600 normal-case font-normal">({results.clubs.length})</span>
                                        </h2>
                                    </div>
                                    <div className="space-y-3">
                                        {results.clubs.map(club => (
                                            <div
                                                key={club.id}
                                                className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-xl border border-indigo-500/20 shrink-0">
                                                        🏆
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white text-sm truncate">{club.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{club.reason}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setProfileModal({ type: 'club', id: club.id })}
                                                    className="shrink-0 px-3 py-1.5 text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/30 transition-colors"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Communities */}
                            {results.communities?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Users size={15} className="text-purple-400" />
                                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                            Communities <span className="text-gray-600 normal-case font-normal">({results.communities.length})</span>
                                        </h2>
                                    </div>
                                    <div className="space-y-3">
                                        {results.communities.map(comm => (
                                            <div
                                                key={comm.id}
                                                className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-xl border border-purple-500/20 shrink-0">
                                                        🌐
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white text-sm truncate">{comm.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{comm.reason}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setProfileModal({ type: 'community', id: comm.id })}
                                                    className="shrink-0 px-3 py-1.5 text-xs bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Students */}
                            {results.students?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <User size={15} className="text-emerald-400" />
                                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                            Students <span className="text-gray-600 normal-case font-normal">({results.students.length})</span>
                                        </h2>
                                    </div>
                                    <div className="space-y-3">
                                        {results.students.map(student => (
                                            <div
                                                key={student.id}
                                                className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4"
                                            >
                                                <button
                                                    onClick={() => setProfileModal({ type: 'student', id: student.id })}
                                                    className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg border border-white/10 shrink-0">
                                                        {DEPT_AVATARS[student.department] || '👤'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white text-sm truncate hover:text-indigo-300 transition-colors">{student.name}</p>
                                                        <p className="text-xs text-gray-600 font-mono">{student.rollNumber}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{student.reason}</p>
                                                    </div>
                                                </button>
                                                {sentTo.has(student.id) ? (
                                                    <span className="shrink-0 px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg">
                                                        Request Sent
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleConnect(student.id)}
                                                        disabled={connecting === student.id}
                                                        className="shrink-0 px-3 py-1.5 text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {connecting === student.id
                                                            ? <><Loader size={11} className="animate-spin" /> Sending…</>
                                                            : 'Connect'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </main>
    );
};

export default Search;
