import React from 'react';
import { useParams } from 'react-router-dom';
import { CLUB_DASHBOARD_DATA } from '../../data/mockData';

const ChannelChat = () => {
    const { channelId } = useParams();
    const channel = channelId
        ? CLUB_DASHBOARD_DATA.channels.find(c => c.id === channelId)
        : CLUB_DASHBOARD_DATA.channels[0]; // Default to first channel if no ID

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-gray-500">#</span>
                    {channel ? channel.name : 'unknown-channel'}
                </h2>
            </div>

            {/* Messages Placeholder */}
            <div className="flex-1 p-6 space-y-6">
                <div className="text-center py-10">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                        #
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Welcome to #{channel?.name}!</h3>
                    <p className="text-gray-500">This is the start of the {channel?.name} channel.</p>
                </div>

                {/* Dummy Messages */}
                <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0"></div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">Sarah Jenkins</span>
                            <span className="text-xs text-gray-500">Today at 9:42 AM</span>
                        </div>
                        <p className="text-gray-300">Has everyone registered for the upcoming hackathon?</p>
                    </div>
                </div>
                <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0"></div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">Mike Chen</span>
                            <span className="text-xs text-gray-500">Today at 9:45 AM</span>
                        </div>
                        <p className="text-gray-300">Yes! Just waiting for the team confirmation.</p>
                    </div>
                </div>
            </div>

            {/* Input Placeholder */}
            <div className="p-4 border-t border-white/10 bg-zinc-900/50">
                <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center gap-2 border border-white/5 focus-within:border-white/20 transition-colors">
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        placeholder={`Message #${channel?.name || 'channel'}`}
                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default ChannelChat;
