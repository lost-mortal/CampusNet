import React from 'react';
import { useParams } from 'react-router-dom';
import { CLUB_DASHBOARD_DATA } from '../../data/mockData';

const EventStats = () => {
    const { eventId } = useParams();
    const event = CLUB_DASHBOARD_DATA.liveOps.find(e => e.id === eventId);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">{event?.name || 'Event'} Analytics</h1>
                <p className="text-gray-400">Real-time performance metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Total Applicants</h3>
                    <p className="text-3xl font-bold text-white">{event?.stats.split(' ')[0] || '0'}</p>
                    <div className="mt-2 text-emerald-400 text-sm flex items-center gap-1">
                        <span>↑ 12%</span>
                        <span className="text-gray-500">vs last week</span>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Page Views</h3>
                    <p className="text-3xl font-bold text-white">1,204</p>
                    <div className="mt-2 text-emerald-400 text-sm flex items-center gap-1">
                        <span>↑ 24%</span>
                        <span className="text-gray-500">vs last week</span>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Conversion Rate</h3>
                    <p className="text-3xl font-bold text-white">11.8%</p>
                    <div className="mt-2 text-rose-400 text-sm flex items-center gap-1">
                        <span>↓ 2.1%</span>
                        <span className="text-gray-500">vs last week</span>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 h-96 flex items-center justify-center">
                <p className="text-gray-500">Chart Visualization Placeholder</p>
            </div>
        </div>
    );
};

export default EventStats;
