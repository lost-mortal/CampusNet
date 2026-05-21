import React, { useState, useEffect, useCallback } from 'react';
import { UserMinus } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../lib/session';
import ProfileModal from './ProfileModal';
import RemoveMemberModal from './RemoveMemberModal';

const API = import.meta.env.VITE_API_URL;

async function fetchOnlineIds() {
    const { data } = await axios.get(`${API}/api/users/online`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    });
    return new Set(data.map(String));
}

const ROLE_COLOR = {
  President: 'text-violet-400',
  Member: 'text-gray-400',
};

const ClubMemberList = ({ isPresident = false, clubName = '', onChanged }) => {
    const [members, setMembers] = useState([]);
    const [onlineIds, setOnlineIds] = useState(new Set());
    const [profileModal, setProfileModal] = useState(null);
    const [removeTarget, setRemoveTarget] = useState(null);

    const fetchMembers = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/api/clubs/my/members`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setMembers(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const refreshOnline = useCallback(async () => {
        try { setOnlineIds(await fetchOnlineIds()); } catch {}
    }, []);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    useEffect(() => {
        refreshOnline();
        const t = setInterval(refreshOnline, 15000);
        return () => clearInterval(t);
    }, [refreshOnline]);

    const removeMember = async (userId, reason) => {
        await axios.delete(`${API}/api/clubs/my/members/${userId}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
            data: { reason },
        });
        setRemoveTarget(null);
        await fetchMembers();
        onChanged?.();
    };

    return (
        <div className="h-full w-full bg-zinc-900 border-l border-white/10 p-4 font-sans text-gray-300 overflow-y-auto custom-scrollbar">
            {profileModal && (
                <ProfileModal type="student" id={profileModal.id} onClose={() => setProfileModal(null)} />
            )}
            {removeTarget && (
                <RemoveMemberModal
                    memberName={removeTarget.name}
                    contextName={clubName}
                    onConfirm={(reason) => removeMember(removeTarget._id, reason)}
                    onClose={() => setRemoveTarget(null)}
                />
            )}
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Club Members â€” {members.length}
            </h3>

            <div className="space-y-3">
                {members.map((member) => {
                    const canRemove = isPresident && member.role !== 'President';
                    return (
                        <div
                            key={member._id}
                            className="group flex items-center gap-3 hover:bg-white/5 rounded-lg px-1 py-1 -mx-1 transition-colors"
                        >
                            <button
                                onClick={() => setProfileModal({ id: member._id })}
                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm border border-white/10">
                                        {member.avatar}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${
                                        onlineIds.has(String(member._id)) ? 'bg-emerald-500' : 'bg-zinc-600'
                                    }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">
                                        {member.name}
                                    </p>
                                    <p className={`text-xs truncate ${ROLE_COLOR[member.role] || 'text-gray-500'}`}>
                                        {member.role} Â· {member.year} {member.dept}
                                    </p>
                                </div>
                            </button>

                            {canRemove && (
                                <button
                                    onClick={() => setRemoveTarget({ _id: member._id, name: member.name })}
                                    title="Remove member"
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"
                                >
                                    <UserMinus size={14} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ClubMemberList;
