import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { Check, X, Users, Loader, TrendingUp, Clock, ExternalLink, Trash2 } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';
import ProfileModal from '../../components/ProfileModal';
import DeletePostModal from '../../components/DeletePostModal';

const API = import.meta.env.VITE_API_URL;

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
  const navigate = useNavigate();
  const { isPresident } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // applicationId being acted on
  const [profileModal, setProfileModal] = useState(null); // { id } or null
  const [deleteOpen, setDeleteOpen] = useState(false);

  const token = getToken();
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

  const { post, applications } = data;
  const pending = applications.filter(a => a.status === 'pending');
  const decided = applications.filter(a => a.status !== 'pending');

  const acceptedCount = applications.filter(a => a.status === 'accepted').length;
  const acceptanceRate = applications.length > 0 ? Math.round((acceptedCount / applications.length) * 100) : 0;
  const rateColor = (r) => r >= 70 ? 'text-emerald-400' : r >= 40 ? 'text-amber-400' : 'text-rose-400';

  const DEPTS = ['COMP', 'ENTC', 'IT', 'MECH'];
  const YEARS = ['FE', 'SE', 'TE', 'BE'];

  const deptBreakdown = DEPTS.map(dept => {
    const group = applications.filter(a => a.applicant.department === dept);
    const applied = group.length;
    const accepted = group.filter(a => a.status === 'accepted').length;
    const rate = applied > 0 ? Math.round((accepted / applied) * 100) : null;
    return { dept, applied, accepted, rate };
  }).filter(d => d.applied > 0);

  const yearBreakdown = YEARS.map(year => {
    const group = applications.filter(a => a.applicant.year === year);
    const applied = group.length;
    const accepted = group.filter(a => a.status === 'accepted').length;
    const rate = applied > 0 ? Math.round((accepted / applied) * 100) : null;
    return { year, applied, accepted, rate };
  }).filter(y => y.applied > 0);

  return (
    <>
    {profileModal && (
      <ProfileModal type="student" id={profileModal.id} onClose={() => setProfileModal(null)} />
    )}
    <div className="h-full overflow-y-auto custom-scrollbar">
    <div className="p-8 text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
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
        {isPresident && (
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors shrink-0"
          >
            <Trash2 size={13} />
            Delete Post
          </button>
        )}
      </div>

      {/* Stat cards */}
      {applications.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-indigo-400" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Applied</h3>
              </div>
              <p className="text-3xl font-bold text-white">{applications.length}</p>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Check size={14} className="text-emerald-400" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accepted</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-400">{acceptedCount}</p>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-400" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</h3>
              </div>
              <p className="text-3xl font-bold text-amber-400">{pending.length}</p>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-sky-400" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Acceptance Rate</h3>
              </div>
              <p className={`text-3xl font-bold ${rateColor(acceptanceRate)}`}>{acceptanceRate}%</p>
            </div>
          </div>

          {/* Dept + Year breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">By Department</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-gray-600 border-b border-white/5">
                    <th className="text-left px-5 py-2.5 font-medium">Dept</th>
                    <th className="text-right px-4 py-2.5 font-medium">Applied</th>
                    <th className="text-right px-4 py-2.5 font-medium">Accepted</th>
                    <th className="text-right px-5 py-2.5 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deptBreakdown.map(({ dept, applied, accepted, rate }) => (
                    <tr key={dept} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-gray-200 font-mono text-xs font-medium">{dept}</td>
                      <td className="px-4 py-3 text-gray-400 text-right">{applied}</td>
                      <td className="px-4 py-3 text-emerald-400 text-right font-medium">{accepted}</td>
                      <td className={`px-5 py-3 text-right font-bold ${rateColor(rate)}`}>{rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">By Year</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-gray-600 border-b border-white/5">
                    <th className="text-left px-5 py-2.5 font-medium">Year</th>
                    <th className="text-right px-4 py-2.5 font-medium">Applied</th>
                    <th className="text-right px-4 py-2.5 font-medium">Accepted</th>
                    <th className="text-right px-5 py-2.5 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {yearBreakdown.map(({ year, applied, accepted, rate }) => (
                    <tr key={year} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-gray-200 font-medium">{year}</td>
                      <td className="px-4 py-3 text-gray-400 text-right">{applied}</td>
                      <td className="px-4 py-3 text-emerald-400 text-right font-medium">{accepted}</td>
                      <td className={`px-5 py-3 text-right font-bold ${rateColor(rate)}`}>{rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
                  <button
                    onClick={() => setProfileModal({ id: app.applicant._id })}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-xs flex items-center gap-1.5"
                    title="View profile"
                  >
                    <ExternalLink size={11} /> Profile
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${DEPT_COLORS[app.applicant.department] || 'bg-zinc-800 text-gray-400 border-gray-700'}`}>
                    {app.applicant.department}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    {app.applicant.year}
                  </span>
                  {isPresident && (
                    actionLoading === app._id ? (
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
                    )
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
                  <button
                    onClick={() => setProfileModal({ id: app.applicant._id })}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-xs flex items-center gap-1.5"
                    title="View profile"
                  >
                    <ExternalLink size={11} /> Profile
                  </button>
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
    </div>
    <DeletePostModal
      open={deleteOpen}
      postId={post._id}
      postTitle={post.title}
      postType="Recruitment"
      approvedPaymentsCount={0}
      onCancel={() => setDeleteOpen(false)}
      onDeleted={() => { setDeleteOpen(false); navigate('/club/profile'); }}
    />
    </>
  );
};

export default RecruitmentApplicants;
