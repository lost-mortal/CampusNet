import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentLeftSidebar from '../components/StudentLeftSidebar';
import StudentRightSidebar from '../components/StudentRightSidebar';
import { USER_DATA } from '../data/mockData';

const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-[#000000] text-[#e4e6eb] font-sans selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(102,126,234,0.05),transparent)]" />
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 blur-[100px]" />
            </div>

            <div className="flex min-h-screen relative z-10 w-full">
                {/* Left Sidebar */}
                <StudentLeftSidebar user={USER_DATA} />

                {/* Center Content (Feed, Announcements, etc.) */}
                <Outlet />

                {/* Right Sidebar */}
                <StudentRightSidebar />
            </div>
        </div>
    );
};

export default DashboardLayout;
