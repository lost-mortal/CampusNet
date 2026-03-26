import React, { useState } from 'react';
import {
    Filter,
    Plus,
    Users,
    MapPin,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FEED_ITEMS, USER_DATA } from '../../data/mockData';
import ActionModal from '../../components/ActionModal';

const StudentFeed = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);

    // Filter Logic
    const filteredEvents = activeFilter === 'All'
        ? FEED_ITEMS
        : activeFilter === 'Registrations'
            ? FEED_ITEMS.filter(item => item.type === 'event')
            : activeFilter === 'Club Posts'
                ? FEED_ITEMS.filter(item => item.type === 'post')
                : activeFilter === 'Collabs'
                    ? FEED_ITEMS.filter(item => item.type === 'collab')
                    : FEED_ITEMS;

    return (
        <main className="flex-1 min-w-0 border-r border-white/5 bg-black">
            {/* Unified Sticky Header */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-6 pb-2 border-b border-white/5 transition-all">
                {/* Welcome Header */}
                <div className="flex items-center justify-between mb-4 px-6">
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            Welcome back, {JSON.parse(localStorage.getItem('user') || '{}').name || 'Student'}
                        </h1>
                        <p className="text-sm text-gray-500">Here's what's happening on campus today.</p>
                    </div>
                    <button className="lg:hidden p-2 bg-white/5 rounded-full text-white">
                        <Search size={20} />
                    </button>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 px-6 mb-4">
                    {['All', 'Registrations', 'Club Posts', 'Collabs'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeFilter === filter
                                ? 'bg-white text-black border-white'
                                : 'bg-black text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Create Post Input */}
                <div className="px-6 mb-2">
                    <div className="bg-[#121212] border border-white/10 rounded-xl p-4 flex items-center gap-4 cursor-text hover:border-white/20 transition-colors shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {USER_DATA.name[0]}
                        </div>
                        <div className="flex-1 text-gray-500 text-sm font-medium">
                            Start a collaboration...
                        </div>
                        <button className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Stream */}
            <div className="p-6 space-y-6">
                <AnimatePresence mode='popLayout'>
                    {filteredEvents.map((item) => (
                        item.type === 'collab' ? (
                            // COLLAB CARD
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#0f0f12] border border-l-4 border-white/5 border-l-purple-500 rounded-xl p-5 hover:bg-white/5 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-200">
                                                {item.communityName}
                                                <span className="text-gray-500 font-normal ml-2">needed a</span>
                                                <span className="text-purple-400 ml-1.5">{item.role}</span>
                                            </h3>
                                            <p className="text-xs text-gray-500">{item.authorName} • {item.timePosted}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-600 border border-gray-800 px-2 py-1 rounded">
                                        Collab
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-4 pl-[52px]">
                                    {item.description}
                                </p>
                                <div className="pl-[52px] flex justify-end">
                                    <button
                                        onClick={() => setSelectedItem(item)}
                                        className="px-4 py-2 bg-purple-600/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <Users size={14} />
                                        <span>Collaborate</span>
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            // EVENT & POST CARD
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300"
                            >
                                {/* Event Image */}
                                <div className="h-48 w-full overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                                        {item.category}
                                    </div>
                                </div>

                                <div className="p-6 pt-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl border border-white/5">
                                                {item.clubLogo}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-400 transition-colors text-gray-200">
                                                    {item.title}
                                                </h3>
                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                    <span>{item.clubName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-300">
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <MapPin size={14} />
                                            <span>{item.location || 'Campus'}</span>
                                        </div>
                                        {item.type === 'event' && (
                                            <button
                                                onClick={() => setSelectedItem(item)}
                                                className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                            >
                                                Register Now
                                            </button>
                                        )}
                                        {item.type === 'recruitment' && (
                                            <button
                                                onClick={() => setSelectedItem(item)}
                                                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                                            >
                                                Apply Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    ))}
                </AnimatePresence>

                {filteredEvents.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                            <Filter size={24} />
                        </div>
                        <p>No events found in this category.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ActionModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />
        </main>
    );
};

export default StudentFeed;
