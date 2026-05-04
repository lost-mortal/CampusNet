import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Plus, XCircle, Users, CalendarDays } from 'lucide-react';
import axios from 'axios';
import CreatePostModal from '../pages/club/CreatePostModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATIC_CHANNELS = [
  { id: 'announcements', name: 'announcements' },
  { id: 'general', name: 'general' },
  { id: 'projects', name: 'projects' },
];

const ClubSidebarLeft = () => {
  const navigate = useNavigate();
  const [clubData, setClubData] = useState(null);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [liveOpsOpen, setLiveOpsOpen] = useState(true);
  const [createModal, setCreateModal] = useState(null); // 'Recruitment' | 'Event' | null
  const [closingId, setClosingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchClubData = useCallback(() => {
    axios.get(`${API}/api/clubs/my`, { headers })
      .then(r => setClubData(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => { fetchClubData(); }, [fetchClubData]);

  const handleCloseRecruitment = async (postId) => {
    setClosingId(postId);
    try {
      await axios.patch(`${API}/api/posts/${postId}/close`, {}, { headers });
      fetchClubData();
    } catch (err) {
      console.error(err);
    } finally {
      setClosingId(null);
    }
  };

  const club = clubData?.club;
  const recruitment = clubData?.recruitment;
  const events = clubData?.events || [];

  return (
    <div className="h-full w-full flex flex-col bg-zinc-900 border-r border-white/10 text-gray-300 font-sans">
      {/* Header */}
      <div
        onClick={() => navigate('/club/profile')}
        className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-2xl border border-violet-500/30 group-hover:border-violet-500/50 transition-colors">
            {club?.logo || '🏆'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-sm truncate">{club?.name || '…'}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">
                {club?.isPresident ? 'President' : 'Member'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
        {/* Channels */}
        <div className="px-3">
          <div
            onClick={() => setChannelsOpen(!channelsOpen)}
            className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors"
          >
            <span>Channels</span>
            <span className={`transform transition-transform duration-200 ${channelsOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>
          {channelsOpen && (
            <div className="mt-1 space-y-0.5">
              {STATIC_CHANNELS.map(ch => (
                <NavLink
                  key={ch.id}
                  to={`/club/chat/${ch.id}`}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-2 py-2 rounded-lg text-sm group transition-all
                    ${isActive ? 'bg-violet-600/10 text-violet-300' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}
                  `}
                >
                  <span className="text-lg leading-none opacity-50 group-hover:opacity-100">#</span>
                  <span className="truncate">{ch.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Live Operations */}
        <div className="px-3">
          <div
            onClick={() => setLiveOpsOpen(!liveOpsOpen)}
            className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors"
          >
            <span>Live Operations</span>
            <span className={`transform transition-transform duration-200 ${liveOpsOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>

          {liveOpsOpen && (
            <div className="mt-1 space-y-4">

              {/* — Recruitment subsection — */}
              <div>
                <div className="flex items-center gap-1.5 px-2 mb-1.5">
                  <Users size={10} className="text-amber-500/70" />
                  <span className="text-[10px] font-semibold text-amber-500/70 uppercase tracking-wider">Recruitment</span>
                </div>

                {!recruitment && (
                  /* No recruitment post ever created */
                  club?.isPresident ? (
                    <button
                      onClick={() => setCreateModal('Recruitment')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-500/70 border border-dashed border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-400 transition-all"
                    >
                      <Plus size={14} />
                      <span>Create Recruitment Post</span>
                    </button>
                  ) : (
                    <p className="px-2 text-xs text-gray-600">No active recruitment.</p>
                  )
                )}

                {recruitment?.isActive && (
                  /* Active recruitment post */
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                    <NavLink
                      to={`/club/recruitment/${recruitment._id}`}
                      className={({ isActive }) =>
                        `flex flex-col px-3 py-2.5 transition-colors ${isActive ? 'bg-amber-500/10' : 'hover:bg-amber-500/10'}`
                      }
                    >
                      <span className="font-medium text-sm text-gray-200 truncate mb-1">{recruitment.title}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-xs text-amber-500/80 font-mono">
                          {recruitment.count} Application{recruitment.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </NavLink>
                    {club?.isPresident && (
                      <button
                        onClick={() => handleCloseRecruitment(recruitment._id)}
                        disabled={closingId === recruitment._id}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border-t border-amber-500/10 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={12} />
                        {closingId === recruitment._id ? 'Closing…' : 'Close Applications'}
                      </button>
                    )}
                  </div>
                )}

                {recruitment && !recruitment.isActive && (
                  /* Closed recruitment post */
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/5 opacity-50">
                      <span className="text-xs text-gray-500 truncate flex-1">{recruitment.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-500 shrink-0">Closed</span>
                    </div>
                    {club?.isPresident && (
                      <button
                        onClick={() => setCreateModal('Recruitment')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-500/70 border border-dashed border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-400 transition-all"
                      >
                        <Plus size={14} />
                        <span>New Recruitment Round</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* — Events subsection — */}
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={10} className="text-blue-500/70" />
                    <span className="text-[10px] font-semibold text-blue-500/70 uppercase tracking-wider">Events</span>
                  </div>
                  {club?.isPresident && (
                    <button
                      onClick={() => setCreateModal('Event')}
                      className="w-5 h-5 rounded flex items-center justify-center text-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="Create Event"
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </div>

                {events.length === 0 ? (
                  club?.isPresident ? (
                    <button
                      onClick={() => setCreateModal('Event')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-500/70 border border-dashed border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-400 transition-all"
                    >
                      <Plus size={14} />
                      <span>Create Event</span>
                    </button>
                  ) : (
                    <p className="px-2 text-xs text-gray-600">No upcoming events.</p>
                  )
                ) : (
                  <div className="space-y-0.5">
                    {events.map(event => (
                      <NavLink
                        key={event._id}
                        to={`/club/stats/${event._id}`}
                        className={({ isActive }) => `
                          flex flex-col px-3 py-2.5 rounded-lg text-sm group transition-all border border-transparent
                          ${isActive ? 'bg-blue-600/10 border-blue-500/20' : 'hover:bg-white/5 hover:border-white/5'}
                        `}
                      >
                        <span className="font-medium truncate text-gray-300 group-hover:text-white mb-0.5">{event.title}</span>
                        {event.eventDate && (
                          <span className="text-xs text-gray-600 font-mono">
                            {new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="px-3">
          <NavLink
            to="/club/insights"
            className={({ isActive }) => `
              relative overflow-hidden flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-sm font-medium
              ${isActive
                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'bg-zinc-800/50 border-white/5 text-gray-400 hover:border-white/10 hover:bg-zinc-800 hover:text-gray-200'}
            `}
          >
            <div className="p-1.5 rounded-lg bg-zinc-700/50 text-gray-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span>AI Insights</span>
          </NavLink>
        </div>
      </div>

      {/* Exit */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => navigate('/home')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Exit Club View
        </button>
      </div>

      <CreatePostModal
        isOpen={!!createModal}
        onClose={() => setCreateModal(null)}
        type={createModal}
        onCreated={fetchClubData}
      />
    </div>
  );
};

export default ClubSidebarLeft;
