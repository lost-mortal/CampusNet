import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, Users, Plus, Lock, Globe, Hourglass } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const CommunityPublicProfile = ({ entityId, asModal = false, onClose }) => {
  const params = useParams();
  const communityId = entityId || params.communityId;
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!communityId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);
    axios.get(`${API}/api/communities/${communityId}`, { headers })
      .then(r => {
        if (cancelled) return;
        if (r.data.isMember || r.data.isManager) {
          if (asModal) { onClose?.(); navigate(`/community/${communityId}`); return; }
          navigate(`/community/${communityId}`, { replace: true });
          return;
        }
        setData(r.data);
      })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load community'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [communityId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      if (data.isPrivate) {
        await axios.post(`${API}/api/communities/${communityId}/request-join`, {}, { headers });
        setData(d => ({ ...d, hasRequested: true }));
      } else {
        await axios.post(`${API}/api/communities/${communityId}/join`, {}, { headers });
        navigate(`/community/${communityId}`, { replace: true });
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
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
        <span>Loading community…</span>
      </Wrapper>
    );
  }

  if (error || !data) {
    return (
      <Wrapper className={`${wrapperClass} flex flex-col items-center justify-center py-20 gap-3 p-8 text-gray-500`}>
        <AlertCircle size={36} className="text-red-400" />
        <p>{error || 'Community not found'}</p>
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
            : <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-zinc-900" />}
        </div>
        <div className="relative z-10 px-8 -mt-16 pb-6">
          <div className="flex items-start gap-6">
            <div className="w-28 h-28 rounded-2xl bg-zinc-900 border-4 border-black flex items-center justify-center text-6xl shadow-2xl flex-shrink-0 overflow-hidden">
              {data.profilePhoto
                ? <img src={data.profilePhoto} alt={data.name} className="w-full h-full object-cover" />
                : data.icon}
            </div>
            <div className="flex-1 min-w-0 pt-16">
              <h1 className="text-3xl font-bold text-white mb-1">{data.name}</h1>
              <p className="text-sm text-gray-400 flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5"><Users size={13} /> {data.memberCount} members</span>
                <span className="flex items-center gap-1.5">
                  {data.isPrivate
                    ? <><Lock size={12} className="text-amber-300" /> <span className="text-amber-300">Private</span></>
                    : <><Globe size={12} className="text-emerald-300" /> <span className="text-emerald-300">Public</span></>}
                </span>
                {data.manager && <span>Managed by <span className="text-purple-300">{data.manager.name}</span></span>}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {data.tags.map(t => (
                  <span key={t} className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-gray-300 text-xs border border-white/10">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-16">
              {data.hasRequested ? (
                <button
                  disabled
                  className="px-5 py-2.5 bg-white/5 text-gray-500 text-sm font-bold rounded-xl border border-white/10 flex items-center gap-2 cursor-not-allowed"
                >
                  <Hourglass size={14} /> Requested
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {joining
                    ? <><Loader size={14} className="animate-spin" /> {data.isPrivate ? 'Requesting…' : 'Joining…'}</>
                    : <><Plus size={14} /> {data.isPrivate ? 'Request to Join' : 'Join'}</>}
                </button>
              )}
            </div>
          </div>
          {data.description && (
            <p className="text-gray-300 text-sm leading-relaxed mt-6 max-w-3xl">{data.description}</p>
          )}
        </div>
      </div>

      <div className="px-8 pb-12 space-y-8">
        {/* Recent Activity (using community posts as substitute for announcements) */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h2>
          {data.recentActivity.length === 0 ? (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 text-gray-500 text-sm">
              No recent activity to preview.
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map(p => (
                <div key={p._id} className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    by <span className="text-gray-400">{p.authorName}</span> · {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  {p.body && <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{p.body}</p>}
                </div>
              ))}
              {!data.isMember && (
                <p className="text-xs text-gray-600 italic mt-2">Join to access General and Discussion channels.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </Wrapper>
  );
};

export default CommunityPublicProfile;
