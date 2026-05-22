import React, { useState, useEffect, useCallback } from 'react';
import { UserMinus, Crown, UserPlus, UserX, Loader, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { getToken, getUser } from '../../lib/session';
import ProfileModal from '../../components/ProfileModal';
import RemoveMemberModal from '../../components/RemoveMemberModal';

const API = import.meta.env.VITE_API_URL;

const CommunityMemberList = ({ members, pendingRequests = [], isManager, communityId, communityName, onChanged }) => {
    const me = getUser() || {};
    const myId = String(me._id || '');
    const [promoteTarget, setPromoteTarget] = useState(null);
    const [promoting, setPromoting] = useState(false);
    const [promoteError, setPromoteError] = useState(null); // { title, message }

    const promote = async () => {
        if (!promoteTarget) return;
        setPromoting(true);
        try {
            await axios.post(
                `${API}/api/communities/${communityId}/promote/${promoteTarget._id}`,
                {},
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setPromoteTarget(null);
            onChanged?.();
        } catch (err) {
            console.error('Promote failed', err);
            const data = err.response?.data;
            const targetName = promoteTarget.name;
            setPromoteTarget(null);
            if (data?.error === 'ALREADY_COMMUNITY_MANAGER') {
                setPromoteError({
                    title: 'Already a Community Manager',
                    message: `${targetName} is already the manager of ${data.otherCommunityName}. A student can manage at most one community — ask them to step down first.`,
                });
            } else {
                setPromoteError({
                    title: 'Promotion failed',
                    message: data?.message || data?.error || 'Failed to promote member',
                });
            }
        } finally {
            setPromoting(false);
        }
    };

    const [acceptingId, setAcceptingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [onlineIds, setOnlineIds] = useState(new Set());
    const [profileModal, setProfileModal] = useState(null);
    const [removeTarget, setRemoveTarget] = useState(null);

    const refreshOnline = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/api/users/online`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setOnlineIds(new Set(data.map(String)));
        } catch {}
    }, []);

    useEffect(() => {
        refreshOnline();
        const t = setInterval(refreshOnline, 15000);
        return () => clearInterval(t);
    }, [refreshOnline]);

    const acceptJoin = async (userId) => {
        const token = getToken();
        setAcceptingId(userId);
        try {
            await axios.post(`${API}/api/communities/${communityId}/accept-join/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onChanged?.();
        } catch (err) {
            console.error('Failed to accept join request', err);
            alert(err.response?.data?.error || 'Failed to accept request');
        } finally {
            setAcceptingId(null);
        }
    };

    const rejectJoin = async (userId) => {
        const token = getToken();
        setRejectingId(userId);
        try {
            await axios.post(`${API}/api/communities/${communityId}/reject-join/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onChanged?.();
        } catch (err) {
            console.error('Failed to reject join request', err);
            alert(err.response?.data?.error || 'Failed to reject request');
        } finally {
            setRejectingId(null);
        }
    };

    const remove = async (userId, reason) => {
        const token = getToken();
        await axios.delete(`${API}/api/communities/${communityId}/members/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { reason },
        });
        setRemoveTarget(null);
        onChanged?.();
    };

    return (
        <div className="h-full w-full flex flex-col bg-zinc-900 border-l border-white/10 text-gray-300 font-sans">
            {profileModal && (
                <ProfileModal type="student" id={profileModal.id} onClose={() => setProfileModal(null)} />
            )}
            {removeTarget && (
                <RemoveMemberModal
                    memberName={removeTarget.name}
                    contextName={communityName}
                    onConfirm={(reason) => remove(removeTarget._id, reason)}
                    onClose={() => setRemoveTarget(null)}
                />
            )}
            {promoteError && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setPromoteError(null); }}
                >
                    <div className="bg-[#0f0f12] border border-amber-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                                <AlertTriangle size={18} className="text-amber-300" />
                            </div>
                            <h3 className="text-white font-bold text-lg">{promoteError.title}</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6">{promoteError.message}</p>
                        <button
                            onClick={() => setPromoteError(null)}
                            className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            {promoteTarget && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget && !promoting) setPromoteTarget(null); }}
                >
                    <div className="bg-[#0f0f12] border border-purple-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                <Crown size={18} className="text-purple-300" />
                            </div>
                            <h3 className="text-white font-bold text-lg">Promote to Manager</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6">
                            Promote <span className="text-white font-semibold">{promoteTarget.name}</span> to Community Manager?
                            You will become a regular member.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPromoteTarget(null)}
                                disabled={promoting}
                                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium transition-colors disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={promote}
                                disabled={promoting}
                                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {promoting && <Loader size={14} className="animate-spin" />}
                                Promote
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Members — {members.length}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
                {isManager && pendingRequests.length > 0 && (
                    <div className="mb-2">
                        <div className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
                            Pending requests — {pendingRequests.length}
                        </div>
                        {pendingRequests.map(r => (
                            <div
                                key={r._id}
                                className="flex items-center gap-3 px-2 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15 mb-1"
                            >
                                <button
                                    onClick={() => setProfileModal({ id: r._id })}
                                    className="flex items-center gap-3 flex-1 min-w-0 group text-left"
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
                                            {r.avatar}
                                        </div>
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${
                                            onlineIds.has(String(r._id)) ? 'bg-emerald-500' : 'bg-zinc-600'
                                        }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                                            {r.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {`${r.year || ''} ${r.department || ''}`.trim()}
                                        </p>
                                    </div>
                                </button>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => acceptJoin(r._id)}
                                        disabled={acceptingId === r._id || rejectingId === r._id}
                                        title="Accept request"
                                        className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all disabled:opacity-50"
                                    >
                                        {acceptingId === r._id
                                            ? <Loader size={14} className="animate-spin" />
                                            : <UserPlus size={14} />}
                                    </button>
                                    <button
                                        onClick={() => rejectJoin(r._id)}
                                        disabled={acceptingId === r._id || rejectingId === r._id}
                                        title="Reject request"
                                        className="p-1.5 rounded-md bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30 transition-all disabled:opacity-50"
                                    >
                                        {rejectingId === r._id
                                            ? <Loader size={14} className="animate-spin" />
                                            : <UserX size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="border-t border-white/5 my-2" />
                    </div>
                )}

                {members.map((m) => {
                    const isM = m.role === 'manager';
                    return (
                        <div
                            key={m._id}
                            className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <button
                                onClick={() => setProfileModal({ id: m._id })}
                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
                                        {m.avatar}
                                    </div>
                                    {isM ? (
                                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500/30 border border-zinc-900 flex items-center justify-center">
                                            <Crown size={9} className="text-purple-200" />
                                        </span>
                                    ) : (
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${
                                            onlineIds.has(String(m._id)) ? 'bg-emerald-500' : 'bg-zinc-600'
                                        }`} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                                        {m.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {isM ? 'Manager' : `${m.year || ''} ${m.department || ''}`.trim()}
                                    </p>
                                </div>
                            </button>

                            {isManager && !isM && String(m._id) !== myId && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0 transition-all">
                                    <button
                                        onClick={() => setPromoteTarget({ _id: m._id, name: m.name })}
                                        title="Promote to manager"
                                        className="p-1 rounded hover:bg-purple-500/20 text-purple-300 transition-all"
                                    >
                                        <Crown size={14} />
                                    </button>
                                    <button
                                        onClick={() => setRemoveTarget({ _id: m._id, name: m.name })}
                                        title="Remove member"
                                        className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                                    >
                                        <UserMinus size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CommunityMemberList;
