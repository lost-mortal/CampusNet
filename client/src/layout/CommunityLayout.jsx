import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CommunitySidebarLeft from '../pages/community/CommunitySidebarLeft';
import CommunityMemberList from '../pages/community/CommunityMemberList';
import { getToken, getUser } from '../lib/session';
import { usePresenceSocket } from '../lib/presence';
import { Loader } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const CommunityLayout = () => {
    usePresenceSocket();
    const { id } = useParams();
    const navigate = useNavigate();
    const wasEverMember = useRef(false);
    const [community, setCommunity] = useState(null);
    const [members, setMembers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const me = getUser() || {};

    const fetchAll = useCallback(async () => {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [c, m] = await Promise.all([
                axios.get(`${API}/api/communities/${id}`, { headers }),
                axios.get(`${API}/api/communities/${id}/members`, { headers }),
            ]);
            // Detect mid-session kick: was a member, no longer is
            if (!c.data.isMember && !c.data.isManager && wasEverMember.current) {
                navigate(`/communities/${id}`, { replace: true });
                return;
            }
            if (c.data.isMember || c.data.isManager) wasEverMember.current = true;

            setCommunity(c.data);
            setMembers(m.data.members || []);
            setPendingRequests(m.data.pendingRequests || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load community');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        setLoading(true);
        fetchAll();
    }, [fetchAll]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-gray-500 gap-2">
                <Loader size={18} className="animate-spin" /> Loading community…
            </div>
        );
    }
    if (error || !community) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-red-400">
                {error || 'Community not found'}
            </div>
        );
    }

    const context = {
        community,
        members,
        currentUserId: String(me._id || ''),
        isManager: !!community.isManager,
        isMember: !!community.isMember,
        refreshCommunity: fetchAll,
    };

    return (
        <div className="flex h-screen bg-black overflow-hidden font-sans">
            <div className="w-64 flex-shrink-0 h-full">
                <CommunitySidebarLeft community={community} />
            </div>
            <div className="flex-1 h-full overflow-y-auto bg-black relative custom-scrollbar">
                <div className="min-h-full">
                    <Outlet context={context} />
                </div>
            </div>
            <div className="w-60 flex-shrink-0 h-full hidden lg:block">
                <CommunityMemberList
                    members={members}
                    pendingRequests={pendingRequests}
                    isManager={context.isManager}
                    communityId={community._id}
                    communityName={community.name}
                    onChanged={fetchAll}
                />
            </div>
        </div>
    );
};

export default CommunityLayout;
