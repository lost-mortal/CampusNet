import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import ClubSidebarLeft from '../components/ClubSidebarLeft';
import ClubMemberList from '../components/ClubMemberList';
import axios from 'axios';
import { getToken, getUser } from '../lib/session';
import { usePresenceSocket } from '../lib/presence';

const API = import.meta.env.VITE_API_URL;

const ClubLayout = () => {
    usePresenceSocket();
    const [clubData, setClubData] = useState(null);
    const currentUser = getUser();

    const fetchClub = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/api/clubs/my`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setClubData(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => { fetchClub(); }, [fetchClub]);

    const club = clubData?.club;
    const outletContext = {
        clubId: club?._id ?? null,
        isPresident: club?.isPresident ?? false,
        currentUserId: currentUser?._id ?? null,
        refreshClub: fetchClub,
    };

    return (
        <div className="flex h-screen bg-black overflow-hidden font-sans">
            <div className="w-64 flex-shrink-0 h-full">
                <ClubSidebarLeft />
            </div>

            <div className="flex-1 h-full overflow-hidden bg-black relative custom-scrollbar">
                <div className="h-full">
                    <Outlet context={outletContext} />
                </div>
            </div>

            <div className="w-60 flex-shrink-0 h-full hidden lg:block">
                <ClubMemberList
                    isPresident={club?.isPresident ?? false}
                    clubName={club?.name ?? ''}
                    onChanged={fetchClub}
                />
            </div>
        </div>
    );
};

export default ClubLayout;
