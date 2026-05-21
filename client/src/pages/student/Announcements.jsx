import React, { useEffect, useState } from 'react';
import { Megaphone, Calendar, AlertCircle, Loader, Mail, Phone, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    api.get('/api/announcements/me')
      .then(r => setAnnouncements(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get('/api/admin/profile')
      .then(r => setAdminProfile(r.data))
      .catch(() => {});
  }, []);

  const hasContact = adminProfile && (adminProfile.email || adminProfile.phone);

  return (
    <main className="flex-1 min-w-0 border-r border-white/5 bg-black">
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-6 pb-6 border-b border-white/5 px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Megaphone size={20} />
          </div>
          <h1 className="text-xl font-bold text-white">Campus Announcements</h1>
        </div>
        <p className="text-sm text-gray-500 ml-13">Official updates and notices from the administration.</p>
      </div>

      {/* Admin contact card — read-only, fetched from /api/admin/profile */}
      {adminProfile && (
        <div className="px-6 pt-6">
          <div className="bg-[#0f0f12] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-indigo-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Contact Campus Admin</p>
                <p className="text-sm font-semibold text-white truncate">
                  {adminProfile.name || 'Campus Admin'}
                  {adminProfile.designation && (
                    <span className="text-gray-500 font-normal text-xs ml-2">· {adminProfile.designation}</span>
                  )}
                </p>
              </div>
            </div>
            {hasContact ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {adminProfile.email && (
                  <a
                    href={`mailto:${adminProfile.email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    <Mail size={12} /> {adminProfile.email}
                  </a>
                )}
                {adminProfile.phone && (
                  <a
                    href={`tel:${adminProfile.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    <Phone size={12} /> {adminProfile.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Contact information not set</p>
            )}
          </div>
        </div>
      )}

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-20 justify-center">
            <Loader size={20} className="animate-spin" />
            <span>Loading announcements…</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
              <Megaphone size={28} className="text-orange-500/50" />
            </div>
            <p className="text-gray-500">No announcements for you yet.</p>
          </div>
        ) : (
          announcements.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative bg-[#0f0f12] border border-white/5 rounded-xl p-5 hover:bg-white/5 transition-all border-l-4 ${
                item.priority === 'high' ? 'border-l-red-500' : 'border-l-orange-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-2">
                  {item.priority === 'high' && (
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <h3 className={`text-lg font-bold transition-colors ${
                    item.priority === 'high'
                      ? 'text-red-300 group-hover:text-red-400'
                      : 'text-gray-200 group-hover:text-orange-400'
                  }`}>
                    {item.title}
                  </h3>
                </div>
                <span className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full whitespace-nowrap">
                  <Calendar size={12} />
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.body}</p>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400">
                  {item.targetDepartments?.includes('ALL') ? 'All Departments' : item.targetDepartments?.join(', ')}
                </span>
                <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-purple-400">
                  {item.targetYears?.includes('ALL') ? 'All Years' : item.targetYears?.join(', ')}
                </span>
                {item.priority === 'high' && (
                  <span className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-400 font-bold">
                    HIGH PRIORITY
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
};

export default Announcements;
