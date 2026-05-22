import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader, Globe, Lock, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };

const ManageCommunities = () => {
  const [tab, setTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedCommunities, setApprovedCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [actingId, setActingId] = useState(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/communities`, { headers }),
      axios.get(`${API}/api/admin/communities/approved`, { headers }),
    ]).then(([pendingRes, approvedRes]) => {
      setPendingRequests(pendingRes.data);
      setApprovedCommunities(approvedRes.data);
    }).catch(() => showFeedback('error', 'Failed to load communities'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (request) => {
    setActingId(request._id);
    try {
      await axios.patch(`${API}/api/admin/communities/${request._id}/approve`, {}, { headers });
      setPendingRequests(prev => prev.filter(r => r._id !== request._id));
      showFeedback('success', `"${request.name}" approved! ${request.requestedBy?.name} is now the Community Manager.`);
      // Refresh approved list
      const res = await axios.get(`${API}/api/admin/communities/approved`, { headers });
      setApprovedCommunities(res.data);
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to approve');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (request) => {
    setActingId(request._id);
    try {
      await axios.patch(`${API}/api/admin/communities/${request._id}/reject`, {}, { headers });
      setPendingRequests(prev => prev.filter(r => r._id !== request._id));
      showFeedback('error', `"${request.name}" request has been rejected.`);
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to reject');
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (community) => {
    if (!confirm(`Delete "${community.name}"? This will remove the community and revoke the manager's role.`)) return;
    setActingId(community._id);
    try {
      await axios.delete(`${API}/api/admin/communities/${community._id}`, { headers });
      setApprovedCommunities(prev => prev.filter(c => c._id !== community._id));
      showFeedback('success', `"${community.name}" deleted.`);
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to delete');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Manage Communities
        </h1>
        <p className="text-gray-500">Review community requests and manage approved communities</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'pending'
              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
          }`}
        >
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('approved')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'approved'
              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
          }`}
        >
          Approved Communities
          <span className="ml-2 px-1.5 py-0.5 bg-white/10 text-gray-400 text-xs rounded-full">
            {approvedCommunities.length}
          </span>
        </button>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-xl border ${
          feedback.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        } flex items-center gap-3`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 py-20 justify-center">
          <Loader size={20} className="animate-spin" />
          <span>Loading…</span>
        </div>
      ) : tab === 'pending' ? (
        pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={40} className="text-gray-600" />
            </div>
            <p className="text-xl font-semibold text-gray-400 mb-2">No Pending Requests</p>
            <p className="text-sm text-gray-600">All community requests have been reviewed!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingRequests.map((request) => (
              <div
                key={request._id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-xl font-bold text-white">{request.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        request.isPrivate
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {request.isPrivate ? <><Lock size={9} /> Private</> : <><Globe size={9} /> Public</>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      <span>Requested on {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {request.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {request.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-zinc-800 text-gray-400 text-[10px] border border-white/10">{t}</span>
                    ))}
                  </div>
                )}

                <div className="mb-4 p-3 bg-white/5 border border-white/5 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Why it should be approved</p>
                  <p className="text-sm text-gray-300">{request.reason || request.description || '—'}</p>
                </div>

                {request.requestedBy && (
                  <div className="flex items-center gap-3 mb-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <div className="text-2xl">{DEPT_AVATARS[request.requestedBy.department] || '👤'}</div>
                    <div>
                      <p className="text-xs text-gray-500">Requested by</p>
                      <p className="text-sm font-semibold text-indigo-400">{request.requestedBy.name}</p>
                      <p className="text-xs text-gray-500">{request.requestedBy.year} · {request.requestedBy.department} · {request.requestedBy.rollNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={actingId === request._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 rounded-xl font-semibold text-green-400 transition-all disabled:opacity-50"
                  >
                    {actingId === request._id ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={18} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    disabled={actingId === request._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-xl font-semibold text-red-400 transition-all disabled:opacity-50"
                  >
                    {actingId === request._id ? <Loader size={16} className="animate-spin" /> : <XCircle size={18} />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        approvedCommunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-xl font-semibold text-gray-400 mb-2">No Approved Communities</p>
            <p className="text-sm text-gray-600">Approve pending requests to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedCommunities.map((community) => (
              <div
                key={community._id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{community.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{community.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          community.isPrivate
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {community.isPrivate ? <Lock size={8} /> : <Globe size={8} />}
                          {community.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Users size={11} /> {community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(community)}
                    disabled={actingId === community._id}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {actingId === community._id
                      ? <Loader size={15} className="text-red-400 animate-spin" />
                      : <Trash2 size={15} className="text-red-400" />}
                  </button>
                </div>

                {community.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {community.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-zinc-800 text-gray-400 text-[10px] border border-white/10">{t}</span>
                    ))}
                  </div>
                )}

                {community.manager && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xl">{DEPT_AVATARS[community.manager.department] || '👤'}</span>
                    <div>
                      <p className="text-xs text-gray-500">Manager</p>
                      <p className="text-purple-400 font-semibold text-sm">{community.manager.name}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default ManageCommunities;
