import React from 'react';
import { Megaphone, Calendar, Tag } from 'lucide-react';
import { ANNOUNCEMENTS } from '../../data/mockData';
import { motion } from 'framer-motion';

const Announcements = () => {
    return (
        <main className="flex-1 min-w-0 border-r border-white/5 bg-black">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-6 pb-6 border-b border-white/5 px-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Megaphone size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-white">Campus Announcements</h1>
                </div>
                <p className="text-sm text-gray-500 ml-13">Official updates and notices from the administration.</p>
            </div>

            {/* Announcements List */}
            <div className="p-6 space-y-4">
                {ANNOUNCEMENTS.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-[#0f0f12] border border-white/5 rounded-xl p-5 hover:bg-white/5 transition-all border-l-4 border-l-orange-500"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-bold text-gray-200 group-hover:text-orange-400 transition-colors">
                                {item.title}
                            </h3>
                            <span className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full whitespace-nowrap">
                                <Calendar size={12} />
                                {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>

                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            {item.content}
                        </p>

                        <div className="flex items-center gap-2">
                            <Tag size={12} className="text-orange-500/70" />
                            <span className="text-xs font-medium text-orange-500/70 tracking-wide uppercase">
                                {item.type}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </main>
    );
};

export default Announcements;
