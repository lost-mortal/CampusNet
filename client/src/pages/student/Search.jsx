import React from 'react';
import { Search as SearchIcon, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Search = () => {
    return (
        <main className="flex-1 min-w-0 border-r border-white/5 bg-black text-[#e4e6eb] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(118,75,162,0.1),transparent)]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 text-center max-w-xl"
            >
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-[0_0_30px_rgba(102,126,234,0.2)]">
                    <SearchIcon size={40} className="text-indigo-400" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-gray-400">
                    AI Discovery Hub
                </h1>

                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                    Our neural networks are currently offline for upgrades. The semantic search engine will be online soon.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-sm">
                    <Zap size={16} className="animate-pulse" />
                    <span>SYSTEM_INITIALIZING...</span>
                </div>
            </motion.div>
        </main>
    );
};

export default Search;
