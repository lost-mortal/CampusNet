import React from 'react';
import { COMMUNITY_DASHBOARD_DATA } from '../../data/mockData';

const AnnouncementsChannel = () => {
    const channel = COMMUNITY_DASHBOARD_DATA.channels.find(c => c.id === 'announcements');

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-gray-500">#</span>
                    {channel ? channel.name : 'announcements'}
                </h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 space-y-6">
                <div className="text-center py-10">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                        📢
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Welcome to #{channel?.name}!</h3>
                    <p className="text-gray-500">Official announcements from community moderators.</p>
                </div>

                {/* Sample Announcement */}
                <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex-shrink-0 flex items-center justify-center text-lg">
                        👩‍💼
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">Priya Patel</span>
                            <span className="text-xs px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded-full">Moderator</span>
                            <span className="text-xs text-gray-500">Today at 10:00 AM</span>
                        </div>
                        <p className="text-gray-300">Welcome to the Web Dev Forum! 🎉 We're excited to have you here. Feel free to share your projects, ask questions, and collaborate with fellow developers.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsChannel;
