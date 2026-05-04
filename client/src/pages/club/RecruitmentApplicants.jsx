import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, Users, Loader, ChevronDown } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEPT_COLORS = {
  COMP: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  ENTC: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  IT:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MECH: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const STATUS_COLORS = {
  pending:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const RecruitmentApplicants = () => {
  const { postId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // applicationId being acted on

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchApplicants = async () => {
    try {
      const r = await axios.get(`${API}/api/posts/${postId}/applicants`, { headers });
      setData(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplicants(); }, [postId]);

  const handleDecision = async (applicationId, decision) => {
    setActionLoading(applicationId);
    try {
      await axios.patch(`${API}/api/applications/${applicationId}/${decision}`, {}, { headers });
      setData(prev => ({
        ...prev,
        applications: prev.applications.map(a =>
          a._id === applicationId ? { ...a, status: decision === 'accept' ? 'accepted' : 'rejected' } : a
        ),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 gap-3">
        <Loader size={20} className="animate-spin" />
        <span>Loading applicants…</span>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-gray-500">Failed to load applicants.</div>;
  }

  const { post, applications, aggregation } = data;
  const pending = applications.filter(a => a.status === 'pending');
  const decided = applications.filter(a => a.status !== 'pending');

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">{post.title}</h1>
        <p className="text-gray-500 text-sm flex items-center gap-2">
          <Users size={14} />
          {applications.length} total applicant{applications.length !== 1 ? 's' : ''}
          {!post.isActive && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 text-xs border border-gray-700">
              Closed
            </span>
          )}
        </p>
      </div>

      {/* Aggregation cards */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">By Department</h3>
            <div className="space-y-2">
              {Object.entries(aggregation.byDept).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${DEPT_COLORS[dept] || 'bg-zinc-800 text-gray-400 border-gray-700'}`}>
                    {dept}
                  </span>
                  <span className="text-white font-bold text-sm">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">By Year</h3>
            <div className="space-y-2">
              {Object.entries(aggregation.byYear).map(([year, count]) => (
                <div key={year} className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">{year}</span>
                  <span className="text-white font-bold text-sm">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending applicants */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(app => (
              <div key={app._id} className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg border border-white/10 shrink-0">
                    {app.applicant.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{app.applicant.name}</p>
                    <p className="text-xs text-gray-500">{app.applicant.rollNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${DEPT_COLORS[app.applicant.department] || 'bg-zinc-800 text-gray-400 border-gray-700'}`}>
                    {app.applicant.department}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    {app.applicant.year}
                  </span>
                  {actionLoading === app._id ? (
                    <Loader size={16} className="animate-spin text-gray-400" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleDecision(app._id, 'accept')}
                        className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                        title="Accept"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleDecision(app._id, 'reject')}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decided applicants */}
      {decided.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Decided ({decided.length})
          </h2>
          <div className="space-y-3">
            {decided.map(app => (
              <div key={app._id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 opacity-70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg border border-white/10 shrink-0">
                    {app.applicant.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{app.applicant.name}</p>
                    <p className="text-xs text-gray-500">{app.applicant.rollNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${DEPT_COLORS[app.applicant.department] || 'bg-zinc-800 text-gray-400 border-gray-700'}`}>
                    {app.applicant.department}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    {app.applicant.year}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[app.status]}`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {applications.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No applications yet.</p>
        </div>
      )}
    </div>
  );
};

export default RecruitmentApplicants;
