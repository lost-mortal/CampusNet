import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { COMMUNITIES } from '../data/mockData';

const StudentRightSidebar = () => {
    const navigate = useNavigate();

    return (
        <aside className="hidden xl:block w-80 p-6 sticky top-0 h-screen overflow-y-auto bg-black border-l border-white/5">
            {/* CTA Card */}
            <div className="p-1 rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-blue-600/20 mb-8 border border-white/10 relative">
                <div className="bg-[#0f0f13] rounded-xl p-5 relative overflow-hidden z-10 h-full">

                    <h3 className="text-lg font-bold mb-2 relative z-10 text-white">Explore Nexus</h3>
                    <p className="text-xs text-gray-300 mb-4 relative z-10">Discover communities, find collaborators, and join the network.</p>

                    <Link
                        to="/search"
                        className="block w-full py-2.5 text-center bg-[#1a1a1e] text-gray-200 border border-purple-500/30 rounded-lg text-sm font-bold hover:bg-purple-500/10 transition-all relative z-10 cursor-pointer"
                    >
                        Explore Communities
                    </Link>
                </div>
            </div>

            {/* Suggested Communities */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Suggested Communities</h3>
                </div>

                <div className="space-y-3">
                    {COMMUNITIES.map(comm => (
                        <div
                            key={comm._id}
                            onClick={() => navigate(`/community/${comm._id}`)}
                            className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-lg group-hover:bg-indigo-500/20 transition-colors">
                                    {comm.icon}
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-gray-300 group-hover:text-indigo-400 transition-colors">{comm.name}</div>
                                    <div className="text-xs text-gray-500">{comm.members} members</div>
                                </div>
                            </div>
                            <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                                <Users size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default StudentRightSidebar;
