import React from 'react';
import { CLUB_DASHBOARD_DATA } from '../../data/mockData';

const ClubProfile = () => {
    const { clubDetails } = CLUB_DASHBOARD_DATA;

    return (
        <div className="p-8 text-white max-w-4xl mx-auto">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 mb-8">
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-zinc-800 flex items-center justify-center text-5xl border border-white/10">
                        {clubDetails.logo}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            {clubDetails.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                                Verified Club
                            </span>
                            <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-sm font-medium border border-violet-500/20">
                                {clubDetails.role} View
                            </span>
                        </div>
                        <p className="mt-4 text-gray-400 max-w-xl">
                            Official robotics club of the university. Building the future, one bot at a time.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors">
                    <h3 className="text-lg font-semibold mb-2">Club Settings</h3>
                    <p className="text-gray-500 text-sm mb-4">Manage member roles, permissions, and club details.</p>
                    <button className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        Edit Details
                    </button>
                </div>
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors">
                    <h3 className="text-lg font-semibold mb-2">Public Page</h3>
                    <p className="text-gray-500 text-sm mb-4">Preview how your club looks to students.</p>
                    <button className="px-4 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors text-sm">
                        View Public Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClubProfile;
