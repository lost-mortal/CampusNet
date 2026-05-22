import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Plus, XCircle, X, Users, CalendarDays, Loader, Check, Trash2 } from 'lucide-react';
import axios from 'axios';
import CreatePostModal from '../pages/club/CreatePostModal';
import DeletePostModal from './DeletePostModal';
import { getToken } from '../lib/session';

const API = import.meta.env.VITE_API_URL;

const ClubSidebarLeft = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clubData, setClubData] = useState(null);
  const [channels, setChannels] = useState([]);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [liveOpsOpen, setLiveOpsOpen] = useState(true);
  const [createModal, setCreateModal] = useState(null);
  const [closingId, setClosingId] = useState(null);
  // Pending deletion: { _id, title, type: 'Event'|'Recruitment', approvedPaymentsCount, routeMatch }
  const [deleteTarget, setDeleteTarget] = useState(null);

  // new-channel inline input
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);
  const newChannelInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  const fetchClubData = useCallback(() => {
    axios.get(`${API}/api/clubs/my`, { headers })
      .then(r => setClubData(r.data))
      .catch(console.error);
  }, []);

  const fetchChannels = useCallback(() => {
    axios.get(`${API}/api/clubs/my/channels`, { headers })
      .then(r => setChannels(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchClubData();
    fetchChannels();
  }, [fetchClubData, fetchChannels]);

  useEffect(() => {
    if (showNewChannel) newChannelInputRef.current?.focus();
  }, [showNewChannel]);

  // After server deletion: refetch sidebar AND, if the user was viewing the
  // deleted post's page, bounce them back to the club home so they don't sit
  // on a 404.
  const handleDeleted = () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    fetchClubData();
    if (target?.routeMatch && location.pathname.startsWith(target.routeMatch)) {
      navigate('/club/profile');
    }
  };

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

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setCreatingChannel(true);
    try {
      await axios.post(`${API}/api/clubs/my/channels`, { name: newChannelName.trim() }, { headers });
      setNewChannelName('');
      setShowNewChannel(false);
      fetchChannels();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingChannel(false);
    }
  };

  const club = clubData?.club;
  const recruitments = clubData?.recruitments || [];
  const activeRecruitment = recruitments.find(r => r.isActive) || null;
  const closedRecruitments = recruitments.filter(r => !r.isActive);
  const rawEvents = clubData?.events || [];

  // Active events (isExpired=false) on top, sorted by event date ascending;
  // closed events (isExpired=true) below, sorted by registrationDeadline desc.
  const events = (() => {
    const active = rawEvents.filter(e => !e.isExpired)
      .sort((a, b) => new Date(a.eventDate || 0) - new Date(b.eventDate || 0));
    const closed = rawEvents.filter(e => e.isExpired)
      .sort((a, b) => new Date(b.registrationDeadline || 0) - new Date(a.registrationDeadline || 0));
    return [...active, ...closed];
  })();

  return (
    <div className="h-full w-full flex flex-col bg-zinc-900 border-r border-white/10 text-gray-300 font-sans">
      {/* Club header */}
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
          <div className="flex items-center justify-between px-2 py-1.5">
            <button
              onClick={() => setChannelsOpen(!channelsOpen)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors"
            >
              <span>Channels</span>
              <span className={`transform transition-transform duration-200 ml-1 ${channelsOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {club?.isPresident && (
              <button
                onClick={() => setShowNewChannel(v => !v)}
                title="Add channel"
                className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
              >
                <Plus size={13} />
              </button>
            )}
          </div>

          {/* New channel inline input */}
          {showNewChannel && (
            <form onSubmit={handleCreateChannel} className="mt-1 mb-2 flex items-center gap-1.5 px-2">
              <span className="text-gray-500 text-sm">#</span>
              <input
                ref={newChannelInputRef}
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="new-channel"
                className="flex-1 bg-zinc-800 border border-violet-500/30 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500/60"
                onKeyDown={e => e.key === 'Escape' && setShowNewChannel(false)}
              />
              <button
                type="submit"
                disabled={creatingChannel || !newChannelName.trim()}
                className="text-violet-400 hover:text-violet-300 disabled:opacity-40"
              >
                {creatingChannel ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button
                type="button"
                onClick={() => { setShowNewChannel(false); setNewChannelName(''); }}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            </form>
          )}

          {channelsOpen && (
            <div className="mt-1 space-y-0.5">
              {channels.map(ch => (
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
              {/* Recruitment */}
              <div>
                <div className="flex items-center gap-1.5 px-2 mb-1.5">
                  <Users size={10} className="text-amber-500/70" />
                  <span className="text-[10px] font-semibold text-amber-500/70 uppercase tracking-wider">Recruitment</span>
                </div>

                {recruitments.length === 0 && (
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

                <div className="space-y-1.5">
                  {activeRecruitment && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                      <NavLink
                        to={`/club/recruitment/${activeRecruitment._id}`}
                        className={({ isActive }) =>
                          `flex flex-col px-3 py-2.5 transition-colors ${isActive ? 'bg-amber-500/10' : 'hover:bg-amber-500/10'}`
                        }
                      >
                        <span className="font-medium text-sm text-gray-200 truncate mb-1">{activeRecruitment.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span className="text-xs text-amber-500/80 font-mono">
                            {activeRecruitment.count} Application{activeRecruitment.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </NavLink>
                      {club?.isPresident && (
                        <div className="flex border-t border-amber-500/10">
                          <button
                            onClick={() => handleCloseRecruitment(activeRecruitment._id)}
                            disabled={closingId === activeRecruitment._id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            {closingId === activeRecruitment._id ? 'Closing…' : 'Close Applications'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              _id: activeRecruitment._id,
                              title: activeRecruitment.title,
                              type: 'Recruitment',
                              approvedPaymentsCount: 0,
                              routeMatch: `/club/recruitment/${activeRecruitment._id}`,
                            })}
                            title="Delete recruitment post"
                            className="px-3 py-1.5 border-l border-amber-500/10 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {closedRecruitments.map(r => (
                    <div key={r._id} className="group relative">
                      <NavLink
                        to={`/club/recruitment/${r._id}`}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-zinc-800/40 transition-colors ${
                            isActive ? 'bg-zinc-800 border-amber-500/20' : 'hover:bg-zinc-800/70 hover:border-white/10'
                          }`
                        }
                        title={r.pendingCount > 0 ? `${r.pendingCount} pending decision${r.pendingCount > 1 ? 's' : ''}` : undefined}
                      >
                        <span className="text-xs text-gray-400 truncate flex-1">{r.title}</span>
                        {r.pendingCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 shrink-0 font-mono">
                            {r.pendingCount}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-400 shrink-0">Closed</span>
                      </NavLink>
                      {club?.isPresident && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget({
                              _id: r._id,
                              title: r.title,
                              type: 'Recruitment',
                              approvedPaymentsCount: 0,
                              routeMatch: `/club/recruitment/${r._id}`,
                            });
                          }}
                          title="Delete recruitment post"
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  ))}

                  {!activeRecruitment && recruitments.length > 0 && club?.isPresident && (
                    <button
                      onClick={() => setCreateModal('Recruitment')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-500/70 border border-dashed border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-400 transition-all"
                    >
                      <Plus size={14} />
                      <span>New Recruitment Round</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Events */}
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
                      <div key={event._id} className="group relative">
                        <NavLink
                          to={`/club/stats/${event._id}`}
                          className={({ isActive }) => `
                            flex flex-col px-3 py-2.5 rounded-lg text-sm group transition-all border border-transparent
                            ${isActive ? 'bg-blue-600/10 border-blue-500/20' : 'hover:bg-white/5 hover:border-white/5'}
                            ${event.isExpired ? 'opacity-50' : ''}
                          `}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-medium truncate text-gray-300 group-hover:text-white">{event.title}</span>
                            {event.isExpired && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-400 shrink-0 uppercase tracking-wider">
                                Closed
                              </span>
                            )}
                          </div>
                          {event.eventDate && (
                            <span className="text-xs text-gray-600 font-mono">
                              {new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </NavLink>
                        {club?.isPresident && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTarget({
                                _id: event._id,
                                title: event.title,
                                type: 'Event',
                                approvedPaymentsCount: event.approvedPaymentsCount || 0,
                                routeMatch: `/club/stats/${event._id}`,
                              });
                            }}
                            title="Delete event post"
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
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

      <DeletePostModal
        open={!!deleteTarget}
        postId={deleteTarget?._id}
        postTitle={deleteTarget?.title}
        postType={deleteTarget?.type}
        approvedPaymentsCount={deleteTarget?.approvedPaymentsCount || 0}
        onCancel={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default ClubSidebarLeft;
