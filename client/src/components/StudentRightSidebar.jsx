import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader, ChevronRight, Hourglass, Lock } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../lib/session';
import CreateCommunityModal from './CreateCommunityModal';

const API = import.meta.env.VITE_API_URL;

const StudentRightSidebar = () => {
    const navigate = useNavigate();
    const [mine, setMine] = useState({ managed: null, pending: null, member: [] });
    const [allCommunities, setAllCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joiningId, setJoiningId] = useState(null);

    const fetchAll = useCallback(async () => {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [mineRes, allRes] = await Promise.all([
                axios.get(`${API}/api/communities/mine`, { headers }),
                axios.get(`${API}/api/communities`, { headers }),
            ]);
            setMine(mineRes.data);
            setAllCommunities(allRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleJoin = async (community, e) => {
        e.stopPropagation();
        setJoiningId(community._id);
        try {
            const token = getToken();
            const endpoint = community.isPrivate ? 'request-join' : 'join';
            await axios.post(`${API}/api/communities/${community._id}/${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchAll();
        } catch (err) {
            console.error(err);
        } finally {
            setJoiningId(null);
        }
    };

    // Build the "my communities" list = managed (if any) + member-of
    const myList = [
        ...(mine.managed ? [{ ...mine.managed, isManager: true }] : []),
        ...mine.member,
    ];
    const myIds = new Set(myList.map(c => c._id));

    // Suggestions = approved communities the student has NOT joined, max 5
    const suggestions = allCommunities
        .filter(c => !myIds.has(c._id) && !c.isMember)
        .slice(0, 5);

    return (
        <aside className="hidden xl:block w-80 p-6 sticky top-0 h-screen overflow-y-auto bg-black border-l border-white/5">
            {/* Explore + Create / Pending / Manager card */}
            <div className="mb-8 space-y-3">
                <Link
                    to="/search"
                    className="block w-full py-2.5 text-center bg-[#1a1a1e] text-gray-200 border border-purple-500/30 rounded-lg text-sm font-bold hover:bg-purple-500/10 transition-all"
                >
                    Explore Communities
                </Link>

                {loading ? (
                    <div className="w-full py-2.5 flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <Loader size={14} className="animate-spin" />
                    </div>
                ) : mine.managed ? (
                    <Link
                        to={`/community/${mine.managed._id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group cursor-pointer"
                    >
                        <div className="relative w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl border border-purple-500/30 group-hover:border-purple-500/50 flex-shrink-0">
                            {mine.managed.icon}
                            {mine.managed.pendingRequestsCount > 0 && (
                                <span
                                    title={`${mine.managed.pendingRequestsCount} pending join request${mine.managed.pendingRequestsCount === 1 ? '' : 's'}`}
                                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-400 text-black text-[10px] font-bold flex items-center justify-center border-2 border-black shadow-[0_0_10px_rgba(250,204,21,0.7)] animate-pulse"
                                >
                                    {mine.managed.pendingRequestsCount}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-purple-200 group-hover:text-white truncate">
                                {mine.managed.name}
                            </div>
                            <div className="text-xs text-purple-400/70 uppercase tracking-wider font-semibold">
                                Manager
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-purple-500/50 group-hover:text-purple-300" />
                    </Link>
                ) : mine.pending ? (
                    <div className="w-full py-2.5 px-3 flex items-center justify-center gap-2 bg-white/[0.03] border border-dashed border-white/10 rounded-lg text-gray-500 text-sm cursor-not-allowed">
                        <Hourglass size={14} />
                        <span>Request Pending…</span>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full py-2.5 flex items-center justify-center gap-2 bg-[#1a1a1e] text-gray-200 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/5 hover:border-purple-500/30 transition-all"
                    >
                        <Plus size={14} />
                        Create Community
                    </button>
                )}
            </div>

            {/* My Communities */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">My Communities</h3>
                {loading ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                        <Loader size={14} className="animate-spin" />
                        <span>Loading…</span>
                    </div>
                ) : myList.length === 0 ? (
                    <p className="text-xs text-gray-600">You haven't joined any communities yet</p>
                ) : (
                    <div className="space-y-2">
                        {myList.map(c => (
                            <div
                                key={c._id}
                                onClick={() => navigate(`/community/${c._id}`)}
                                className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                            >
                                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-lg group-hover:bg-indigo-500/20 transition-colors flex-shrink-0">
                                    {c.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm text-gray-300 group-hover:text-white truncate">{c.name}</div>
                                    {c.isManager && (
                                        <div className="text-[10px] text-purple-400/70 uppercase tracking-wider font-semibold">Manager</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Suggested Communities */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Suggested Communities</h3>
                {loading ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                        <Loader size={14} className="animate-spin" />
                        <span>Loading…</span>
                    </div>
                ) : suggestions.length === 0 ? (
                    <p className="text-xs text-gray-600">No suggestions right now</p>
                ) : (
                    <div className="space-y-3">
                        {suggestions.map(c => (
                            <div
                                key={c._id}
                                onClick={() => navigate(`/communities/${c._id}`)}
                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-lg group-hover:bg-indigo-500/20 transition-colors flex-shrink-0">
                                        {c.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-gray-300 group-hover:text-indigo-400 transition-colors truncate flex items-center gap-1.5">
                                            {c.name}
                                            {c.isPrivate && <Lock size={10} className="text-amber-300/80 flex-shrink-0" />}
                                        </div>
                                        <div className="text-xs text-gray-500">{c.memberCount} members</div>
                                    </div>
                                </div>
                                {c.hasRequested ? (
                                    <span
                                        onClick={(e) => e.stopPropagation()}
                                        title="Request pending"
                                        className="p-1.5 rounded-lg text-gray-600 flex-shrink-0 cursor-not-allowed"
                                    >
                                        <Hourglass size={14} />
                                    </span>
                                ) : (
                                    <button
                                        onClick={(e) => handleJoin(c, e)}
                                        disabled={joiningId === c._id}
                                        title={c.isPrivate ? 'Request to join' : 'Join community'}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex-shrink-0 disabled:opacity-50"
                                    >
                                        {joiningId === c._id
                                            ? <Loader size={16} className="animate-spin" />
                                            : <Plus size={16} />}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateCommunityModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmitted={fetchAll}
            />
        </aside>
    );
};

export default StudentRightSidebar;
