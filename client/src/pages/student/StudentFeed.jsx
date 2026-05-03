import React, { useState, useEffect } from 'react';
import { Filter, Plus, Users, MapPin, Search, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ActionModal from '../../components/ActionModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TAG_GRADIENTS = {
  Technical:   'from-indigo-900/60 to-blue-900/40',
  Cultural:    'from-pink-900/60 to-purple-900/40',
  Sports:      'from-green-900/60 to-emerald-900/40',
  Recruitment: 'from-amber-900/60 to-orange-900/40',
  Creative:    'from-rose-900/60 to-pink-900/40',
  Other:       'from-zinc-900/60 to-gray-900/40',
};

const FILTERS = ['All', 'Events', 'Recruitment', 'General', 'Collabs'];

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const StudentFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/api/posts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setPosts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Events') return p.type === 'event';
    if (activeFilter === 'Recruitment') return p.type === 'recruitment';
    if (activeFilter === 'General') return p.type === 'general';
    if (activeFilter === 'Collabs') return p.type === 'collab';
    return true;
  });

  return (
    <main className="flex-1 min-w-0 border-r border-white/5 bg-black">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-6 pb-2 border-b border-white/5">
        <div className="flex items-center justify-between mb-4 px-6">
          <div>
            <h1 className="text-xl font-bold text-white">
              Welcome back, {user.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-sm text-gray-500">Here's what's happening on campus today.</p>
          </div>
          <button className="lg:hidden p-2 bg-white/5 rounded-full text-white">
            <Search size={20} />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 px-6 mb-4">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeFilter === f
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Create Post Input */}
        <div className="px-6 mb-2">
          <div className="bg-[#121212] border border-white/10 rounded-xl p-4 flex items-center gap-4 cursor-text hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
              {user.name?.[0] || 'S'}
            </div>
            <div className="flex-1 text-gray-500 text-sm font-medium">Start a collaboration...</div>
            <button className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="p-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
            <Loader size={20} className="animate-spin" />
            <span>Loading feed…</span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {filtered.map(item => (
            item.type === 'collab' ? (
              // COLLAB CARD
              <motion.div key={item._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f0f12] border border-l-4 border-white/5 border-l-purple-500 rounded-xl p-5 hover:bg-white/5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-200">{item.communityName}</h3>
                      <p className="text-xs text-gray-500">{item.authorName} • {timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-600 border border-gray-800 px-2 py-1 rounded">Collab</span>
                </div>
                <p className="text-gray-200 text-sm font-semibold mb-1 pl-[52px]">{item.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 pl-[52px]">{item.description}</p>
                <div className="pl-[52px] flex justify-end">
                  <button onClick={() => setSelectedItem(item)}
                    className="px-4 py-2 bg-purple-600/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2">
                    <Users size={14} />
                    <span>Collaborate</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              // EVENT / RECRUITMENT / GENERAL CARD
              <motion.div key={item._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300">

                {/* Gradient header (replaces image) */}
                <div className={`h-32 w-full bg-gradient-to-br ${TAG_GRADIENTS[item.tag] || TAG_GRADIENTS.Other} relative flex items-end p-4`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="text-2xl">{item.clubLogo || '🏆'}</span>
                    <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{item.clubName}</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                    {item.tag || item.type}
                  </div>
                </div>

                <div className="p-6 pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-400 transition-colors text-gray-200">
                      {item.title}
                    </h3>
                    {item.date && (
                      <div className="text-sm font-bold text-gray-400 whitespace-nowrap ml-4">
                        {new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">{item.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={14} />
                      <span>{item.location || 'Campus'}</span>
                    </div>
                    {item.type === 'event' && (
                      <button onClick={() => setSelectedItem(item)}
                        className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                        Register Now
                      </button>
                    )}
                    {item.type === 'recruitment' && item.isActive && (
                      <button onClick={() => setSelectedItem(item)}
                        className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                        Apply Now
                      </button>
                    )}
                    {item.type === 'recruitment' && !item.isActive && (
                      <span className="px-4 py-2 text-xs text-gray-500 border border-gray-800 rounded-lg">Applications Closed</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Filter size={24} />
            </div>
            <p>No posts in this category.</p>
          </div>
        )}
      </div>

      <ActionModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} item={selectedItem} />
    </main>
  );
};

export default StudentFeed;
