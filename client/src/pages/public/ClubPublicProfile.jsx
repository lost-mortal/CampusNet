import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader, AlertCircle, Users, Calendar, MapPin, Check, X, Ticket, Briefcase,
  ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const ClubPublicProfile = ({ entityId, asModal = false }) => {
  const params = useParams();
  const clubId = entityId || params.clubId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Apply state
  const [applyState, setApplyState] = useState('idle'); // 'idle' | 'submitting' | 'sent' | 'error'
  const [applyError, setApplyError] = useState('');

  // Register-per-event state, keyed by event _id: 'idle' | 'submitting' | 'sent' | 'already'
  const [regState, setRegState] = useState({});
  const [regErrors, setRegErrors] = useState({});

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);
    axios.get(`${API}/api/clubs/${clubId}`, { headers })
      .then(r => { if (!cancelled) setData(r.data); })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load club'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clubId]);

  const handleApply = async () => {
    if (!data?.activeRecruitment) return;
    setApplyState('submitting');
    setApplyError('');
    try {
      await axios.post(`${API}/api/posts/${data.activeRecruitment._id}/apply`, {}, { headers });
      setApplyState('sent');
    } catch (err) {
      if (err.response?.status === 409) {
        setApplyState('sent');
      } else {
        setApplyError(err.response?.data?.error || 'Could not apply');
        setApplyState('error');
      }
    }
  };

  const handleRegister = async (eventId) => {
    setRegState(s => ({ ...s, [eventId]: 'submitting' }));
    setRegErrors(e => ({ ...e, [eventId]: '' }));
    try {
      await axios.post(`${API}/api/registrations`, { postId: eventId }, { headers });
      setRegState(s => ({ ...s, [eventId]: 'sent' }));
    } catch (err) {
      if (err.response?.status === 409) {
        setRegState(s => ({ ...s, [eventId]: 'already' }));
      } else {
        setRegErrors(e => ({ ...e, [eventId]: err.response?.data?.error || 'Could not register' }));
        setRegState(s => ({ ...s, [eventId]: 'idle' }));
      }
    }
  };

  const Wrapper = asModal ? 'div' : 'main';
  const wrapperClass = asModal
    ? 'bg-black text-[#e4e6eb]'
    : 'flex-1 min-w-0 bg-black text-[#e4e6eb] overflow-y-auto border-r border-white/5';

  if (loading) {
    return (
      <Wrapper className={`${wrapperClass} flex items-center justify-center py-20 gap-3 text-gray-500`}>
        <Loader size={20} className="animate-spin" />
        <span>Loading club profile…</span>
      </Wrapper>
    );
  }

  if (error || !data) {
    return (
      <Wrapper className={`${wrapperClass} flex flex-col items-center justify-center py-20 gap-3 p-8 text-gray-500`}>
        <AlertCircle size={36} className="text-red-400" />
        <p>{error || 'Club not found'}</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={wrapperClass}>
      {/* Cover */}
      <div className="relative">
        <div className="h-40 relative overflow-hidden">
          {data.bannerImage
            ? <img src={data.bannerImage} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-zinc-900" />}
        </div>
        <div className="px-8 -mt-16 pb-6">
          <div className="flex items-start gap-6">
            <div className="w-28 h-28 rounded-2xl bg-zinc-900 border-4 border-black flex items-center justify-center text-6xl shadow-2xl flex-shrink-0 overflow-hidden">
              {data.profilePhoto
                ? <img src={data.profilePhoto} alt={data.name} className="w-full h-full object-cover" />
                : data.logoEmoji}
            </div>
            <div className="flex-1 min-w-0 pt-16">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-3xl font-bold text-white">{data.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <ShieldCheck size={11} /> Verified
                </span>
              </div>
              <p className="text-sm text-gray-400 flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5"><Users size={13} /> {data.memberCount} members</span>
                {data.president && <span>Led by <span className="text-indigo-300">{data.president.name}</span></span>}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {data.tags.map(t => (
                  <span key={t} className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-gray-300 text-xs border border-white/10">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {data.description && (
            <p className="text-gray-300 text-sm leading-relaxed mt-6 max-w-3xl">{data.description}</p>
          )}
        </div>
      </div>

      <div className="px-8 pb-12 space-y-8">
        {/* Active Recruitment */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Briefcase size={13} className="text-amber-400" /> Active Recruitment
          </h2>
          {data.activeRecruitment ? (
            <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">{data.activeRecruitment.title}</h3>
              {data.activeRecruitment.body && (
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{data.activeRecruitment.body}</p>
              )}
              {applyError && (
                <p className="text-red-400 text-sm mb-3">{applyError}</p>
              )}
              {applyState === 'sent' ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                  <Check size={14} /> Application Sent
                </span>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applyState === 'submitting'}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {applyState === 'submitting' ? <><Loader size={14} className="animate-spin" /> Sending…</> : 'Apply Now'}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 flex items-center gap-3">
              <X size={20} className="text-gray-600" />
              <p className="text-gray-500 text-sm">Applications are currently closed.</p>
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={13} className="text-indigo-400" /> Upcoming Events
          </h2>
          {data.upcomingEvents.length === 0 ? (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 text-gray-500 text-sm">
              No upcoming events yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingEvents.map(ev => {
                const state = regState[ev._id] || 'idle';
                return (
                  <div key={ev._id} className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white mb-1">{ev.title}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-2">
                          {ev.eventDate && (
                            <span className="flex items-center gap-1.5">
                              <Calendar size={11} />
                              {new Date(ev.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          {ev.venue && <span className="flex items-center gap-1.5"><MapPin size={11} /> {ev.venue}</span>}
                        </div>
                        {ev.body && <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{ev.body}</p>}
                        {regErrors[ev._id] && (
                          <p className="text-red-400 text-xs mt-2">{regErrors[ev._id]}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {state === 'sent' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            <Ticket size={12} /> Registered
                          </span>
                        ) : state === 'already' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/20">
                            <Ticket size={12} /> Already Registered
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRegister(ev._id)}
                            disabled={state === 'submitting'}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {state === 'submitting' ? <><Loader size={11} className="animate-spin" /> …</> : 'Register'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Posts */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Posts</h2>
          {data.recentPosts.length === 0 ? (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 text-gray-500 text-sm">
              No posts from this club yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentPosts.map(p => (
                <div key={p._id} className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {p.body && <p className="text-gray-400 text-sm leading-relaxed">{p.body}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Wrapper>
  );
};

export default ClubPublicProfile;
