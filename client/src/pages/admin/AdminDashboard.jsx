import React from 'react';
import { ADMIN_STATS } from '../../data/mockData';
import { Users, Briefcase, Calendar, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
    const metrics = [
        { label: 'Total Students', value: ADMIN_STATS.totalStudents.toLocaleString(), icon: Users, color: 'indigo' },
        { label: 'Active Clubs', value: ADMIN_STATS.activeClubs, icon: Briefcase, color: 'purple' },
        { label: 'Total Events', value: ADMIN_STATS.totalEvents, icon: Calendar, color: 'pink' },
        { label: 'Avg Attendance', value: ADMIN_STATS.eventEngagement.avgAttendance, icon: TrendingUp, color: 'cyan' }
    ];

    // Find max members for chart scaling
    const maxMembers = Math.max(...ADMIN_STATS.clubPopularity.map(c => c.members));

    return (
        <div className="min-h-screen p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Analytics Dashboard
                </h1>
                <p className="text-gray-500">High-level overview of campus activity</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((metric, idx) => {
                    const Icon = metric.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 bg-${metric.color}-500/10 border border-${metric.color}-500/30 rounded-lg flex items-center justify-center`}>
                                    <Icon size={24} className={`text-${metric.color}-400`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">{metric.label}</p>
                                <p className="text-3xl font-bold text-white">{metric.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Club Popularity Chart */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        Club Popularity
                    </h3>
                    <div className="space-y-4">
                        {ADMIN_STATS.clubPopularity.map((club, idx) => {
                            const percentage = (club.members / maxMembers) * 100;
                            return (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{club.logo}</span>
                                            <span className="text-sm font-medium text-gray-300">{club.clubName}</span>
                                        </div>
                                        <span className="text-sm font-bold text-white">{club.members}</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Event Engagement */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-2xl">📈</span>
                        Event Engagement
                    </h3>
                    <div className="space-y-6">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <p className="text-sm text-gray-400 mb-1">Total Registrations</p>
                            <p className="text-3xl font-bold text-green-400">
                                {ADMIN_STATS.eventEngagement.registered.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-sm text-gray-400 mb-1">Total Attended</p>
                            <p className="text-3xl font-bold text-blue-400">
                                {ADMIN_STATS.eventEngagement.attended.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <p className="text-sm text-gray-400 mb-1">Average Attendance Rate</p>
                            <p className="text-3xl font-bold text-purple-400">
                                {ADMIN_STATS.eventEngagement.avgAttendance}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
