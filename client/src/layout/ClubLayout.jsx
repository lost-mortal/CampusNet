import React from 'react';
import { Outlet } from 'react-router-dom';
import ClubSidebarLeft from '../components/ClubSidebarLeft';
import ClubMemberList from '../components/ClubMemberList';

const ClubLayout = () => {
    return (
        <div className="flex h-screen bg-black overflow-hidden font-sans">
            {/* Left Sidebar - Navigation */}
            <div className="w-64 flex-shrink-0 h-full">
                <ClubSidebarLeft />
            </div>

            {/* Center - Main Content */}
            <div className="flex-1 h-full overflow-y-auto bg-black relative custom-scrollbar">
                {/* We can add a top gradient fade or similar polish here if needed */}
                <div className="min-h-full">
                    <Outlet />
                </div>
            </div>

            {/* Right Sidebar - Member List */}
            <div className="w-60 flex-shrink-0 h-full hidden lg:block">
                <ClubMemberList />
            </div>
        </div>
    );
};

export default ClubLayout;
