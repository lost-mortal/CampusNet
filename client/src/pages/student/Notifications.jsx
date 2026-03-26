import React from 'react';
import { Bell } from 'lucide-react';

const Notifications = () => {
    return (
        <main className="flex-1 min-w-0 border-r border-white/5 bg-black text-gray-200">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-6 pb-6 border-b border-white/5 px-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Bell size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-white">Notifications</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 text-center py-20">
                <p className="text-gray-500">No new alerts.</p>
            </div>
        </main>
    );
};

export default Notifications;
