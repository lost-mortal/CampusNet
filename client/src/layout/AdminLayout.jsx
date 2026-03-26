import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-[#000000] text-[#e4e6eb] font-sans selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(102,126,234,0.05),transparent)]" />
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 blur-[100px]" />
            </div>

            <div className="flex min-h-screen relative z-10 w-full">
                {/* Left Sidebar - Admin Navigation */}
                <AdminSidebar />

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
