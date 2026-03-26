import React from 'react';
import { Outlet } from 'react-router-dom';
import CommunitySidebarLeft from '../pages/community/CommunitySidebarLeft';
import CommunityMemberList from '../pages/community/CommunityMemberList';

const CommunityLayout = () => {
    return (
        <div className="flex h-screen bg-black overflow-hidden font-sans">
            {/* Left Sidebar - Navigation */}
            <div className="w-64 flex-shrink-0 h-full">
                <CommunitySidebarLeft />
            </div>

            {/* Center - Main Content */}
            <div className="flex-1 h-full overflow-y-auto bg-black relative custom-scrollbar">
                <div className="min-h-full">
                    <Outlet />
                </div>
            </div>

            {/* Right Sidebar - Member List */}
            <div className="w-60 flex-shrink-0 h-full hidden lg:block">
                <CommunityMemberList />
            </div>
        </div>
    );
};

export default CommunityLayout;
