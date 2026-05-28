import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader, AlertCircle, Hash, Building, GraduationCap, UserPlus,
  Check, Clock, MessageCircle, ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

// entityId prop: when rendered inside ProfileModal, id is passed directly.
// Falls back to useParams when rendered as a route component.
const StudentPublicProfile = ({ entityId, asModal = false, onClose, hideActions = false }) => {
  const params = useParams();
  const studentId = entityId || params.studentId;
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connStatus, setConnStatus] = useState(null); // 'none' | 'sent' | 'received' | 'connected' | 'self'
  const [connecting, setConnecting] = useState(false);

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);
    // Admin / view-only callers don't have (or want) a connection status — skip it.
    const reqs = [axios.get(`${API}/api/students/${studentId}`, { headers })];
    if (!hideActions) reqs.push(axios.get(`${API}/api/connections/status/${studentId}`, { headers }));
    Promise.all(reqs)
      .then(([s, c]) => {
        if (cancelled) return;
        setData(s.data);
        if (!hideActions && c) {
          setConnStatus(c.data.status);
          if (c.data.status === 'self') {
            if (asModal) onClose?.();
            else navigate('/profile', { replace: true });
          }
        }
      })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load profile'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [studentId]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await axios.post(`${API}/api/connections`, { recipientId: studentId }, { headers });
      setConnStatus('sent');
    } catch (err) {
      if (err.response?.status === 409) setConnStatus('sent');
    } finally {
      setConnecting(false);
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
        <span>Loading profile…</span>
      </Wrapper>
    );
  }

  if (error || !data) {
    return (
      <Wrapper className={`${wrapperClass} flex flex-col items-center justify-center py-20 gap-3 p-8 text-gray-500`}>
        <AlertCircle size={36} className="text-red-400" />
        <p>{error || 'Profile not found'}</p>
      </Wrapper>
    );
  }

  const renderActionButton = () => {
    if (hideActions) return null;
    if (connStatus === 'connected') {
      return (
        <div className="flex flex-col gap-2 items-end">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-medium border border-emerald-500/20">
            <Check size={14} /> Connected
          </span>
          <button
            disabled
            className="px-4 py-2 rounded-xl bg-zinc-800 text-gray-400 text-sm font-medium border border-white/10 flex items-center gap-2 cursor-not-allowed opacity-70"
            title="Chat coming in Phase 3.1"
          >
            <MessageCircle size={14} /> Message
          </button>
        </div>
      );
    }
    if (connStatus === 'sent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 text-sm font-medium border border-amber-500/20">
          <Clock size={14} /> Request Sent
        </span>
      );
    }
    if (connStatus === 'received') {
      return (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/15 text-indigo-400 text-sm font-medium border border-indigo-500/20">
          <Clock size={14} /> Awaiting Your Response
        </span>
      );
    }
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
      >
        {connecting
          ? <><Loader size={14} className="animate-spin" /> Sending…</>
          : <><UserPlus size={14} /> Connect</>}
      </button>
    );
  };

  return (
    <Wrapper className={wrapperClass}>
      {/* Cover */}
      <div className="relative">
        <div className="h-40 relative overflow-hidden">
          {data.bannerImage
            ? <img src={data.bannerImage} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]" />}
        </div>
        <div className="px-8 -mt-16 pb-6">
          <div className="flex items-start gap-6">
            <div className="w-28 h-28 rounded-2xl bg-zinc-900 border-4 border-black flex items-center justify-center text-5xl shadow-2xl flex-shrink-0 overflow-hidden">
              {data.profilePic
                ? <img src={data.profilePic} alt={data.name} className="w-full h-full object-cover" />
                : data.avatar}
            </div>
            <div className="flex-1 min-w-0 pt-16">
              <h1 className="text-3xl font-bold text-white mb-1">{data.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><Hash size={13} /> {data.rollNumber}</span>
                <span className="flex items-center gap-1.5"><Building size={13} /> {data.department}</span>
                <span className="flex items-center gap-1.5"><GraduationCap size={13} /> {data.year}</span>
              </div>
            </div>
            <div className="pt-16">{renderActionButton()}</div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bio + Skills (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">About</h2>
            {data.bio ? (
              <p className="text-gray-300 text-sm leading-relaxed">{data.bio}</p>
            ) : (
              <p className="text-gray-600 italic text-sm">No bio yet.</p>
            )}
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Skills</h2>
            {data.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.skills.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/25 rounded-lg text-sm text-indigo-300">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic text-sm">No skills listed yet.</p>
            )}
          </div>
        </div>

        {/* Clubs + Communities (col 3) */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Clubs</h2>
            {data.clubs.length === 0 ? (
              <p className="text-gray-600 italic text-sm">Not part of any club.</p>
            ) : (
              <div className="space-y-2">
                {data.clubs.map(c => (
                  <Link
                    key={c._id}
                    to={`/clubs/${c._id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-lg border border-indigo-500/20">
                      {c.logoEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.role}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Communities</h2>
            {data.communities.length === 0 ? (
              <p className="text-gray-600 italic text-sm">No communities yet.</p>
            ) : (
              <div className="space-y-2">
                {data.communities.map(c => (
                  <Link
                    key={c._id}
                    to={`/communities/${c._id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center text-lg border border-purple-500/20">
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.role}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default StudentPublicProfile;
