import React, { useEffect, useState } from 'react';
import {
  Users, Briefcase, Globe, Calendar, UserCheck, IndianRupee, TrendingUp,
  Link2, Loader, X, Sparkles, RefreshCw, Lightbulb, AlertTriangle, Trophy,
  PiggyBank, FileText, Building2, GraduationCap, Wallet, Repeat,
} from 'lucide-react';
import api from '../../lib/api';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};
const fmtRupees = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// ──────────────────────────────────────────────────────────────────────────
// Section 1 — Stats at a Glance
// ──────────────────────────────────────────────────────────────────────────
const STAT_CARDS = [
  { key: 'totalStudents',       label: 'Total Students',      icon: Users,       color: 'indigo'  },
  { key: 'totalClubs',          label: 'Active Clubs',        icon: Briefcase,   color: 'purple'  },
  { key: 'approvedCommunities', label: 'Approved Communities',icon: Globe,       color: 'cyan'    },
  { key: 'totalEventsEver',     label: 'Total Events',        icon: Calendar,    color: 'pink'    },
  { key: 'activeRecruitments',  label: 'Active Recruitments', icon: UserCheck,   color: 'amber'   },
  { key: 'campusRevenue',       label: 'Campus Revenue',      icon: IndianRupee, color: 'emerald', isMoney: true },
  { key: 'campusAvgAttendance', label: 'Avg Attendance Rate', icon: TrendingUp,  color: 'sky',     isPercent: true },
  { key: 'totalConnections',    label: 'Total Connections',   icon: Link2,       color: 'fuchsia' },
];

const COLOR_CLASS = {
  indigo:  { bg: 'bg-indigo-500/10',  bd: 'border-indigo-500/30',  fg: 'text-indigo-400'  },
  purple:  { bg: 'bg-purple-500/10',  bd: 'border-purple-500/30',  fg: 'text-purple-400'  },
  cyan:    { bg: 'bg-cyan-500/10',    bd: 'border-cyan-500/30',    fg: 'text-cyan-400'    },
  pink:    { bg: 'bg-pink-500/10',    bd: 'border-pink-500/30',    fg: 'text-pink-400'    },
  amber:   { bg: 'bg-amber-500/10',   bd: 'border-amber-500/30',   fg: 'text-amber-400'   },
  emerald: { bg: 'bg-emerald-500/10', bd: 'border-emerald-500/30', fg: 'text-emerald-400' },
  sky:     { bg: 'bg-sky-500/10',     bd: 'border-sky-500/30',     fg: 'text-sky-400'     },
  fuchsia: { bg: 'bg-fuchsia-500/10', bd: 'border-fuchsia-500/30', fg: 'text-fuchsia-400' },
};

const StatCard = ({ card, value }) => {
  const Icon = card.icon;
  const cc = COLOR_CLASS[card.color];
  const display = card.isMoney
    ? fmtRupees(value)
    : card.isPercent
      ? `${value || 0}%`
      : (value ?? 0).toLocaleString('en-IN');
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all hover:-translate-y-1">
      <div className={`w-12 h-12 ${cc.bg} border ${cc.bd} rounded-lg flex items-center justify-center mb-4`}>
        <Icon size={24} className={cc.fg} />
      </div>
      <p className="text-gray-500 text-sm mb-1">{card.label}</p>
      <p className="text-3xl font-bold text-white truncate">{display}</p>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Section 2 — Club Performance grid
// ──────────────────────────────────────────────────────────────────────────
const ClubCard = ({ club, onOpen }) => (
  <button
    onClick={() => onOpen(club)}
    className="text-left bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all hover:-translate-y-0.5"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-3xl">{club.logoEmoji}</div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white truncate">{club.name}</h3>
          <p className="text-xs text-gray-500">
            {club.memberCount} member{club.memberCount !== 1 ? 's' : ''} · {club.eventsCount} event{club.eventsCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border whitespace-nowrap ${
        club.activeRecruitment
          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          : 'bg-zinc-800 text-gray-500 border-white/10'
      }`}>
        {club.activeRecruitment ? 'Recruiting' : 'Closed'}
      </span>
    </div>

    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <span className="text-xs px-2 py-1 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
        {club.avgAttendance}% attendance
      </span>
      {club.revenueCollected > 0 && (
        <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          {fmtRupees(club.revenueCollected)}
        </span>
      )}
    </div>

    <p className={`text-xs ${club.hasInsight ? 'text-gray-500' : 'text-amber-400'}`}>
      {club.hasInsight
        ? `Last report: ${fmtDate(club.insightGeneratedAt)}`
        : 'No report yet'}
    </p>
  </button>
);

// ──────────────────────────────────────────────────────────────────────────
// Club Insight Modal
// ──────────────────────────────────────────────────────────────────────────
const INSIGHT_META = {
  healthSummary:      { icon: Sparkles,    label: 'Health Summary',       accent: 'text-violet-300',  ring: 'border-violet-500/20' },
  departmentInsights: { icon: Building2,   label: 'Department Insights',  accent: 'text-cyan-300',    ring: 'border-cyan-500/20' },
  yearInsights:       { icon: GraduationCap, label: 'Year Insights',      accent: 'text-emerald-300', ring: 'border-emerald-500/20' },
  eventInsights:      { icon: Calendar,    label: 'Event Insights',       accent: 'text-pink-300',    ring: 'border-pink-500/20' },
  paidVsFree:         { icon: Wallet,      label: 'Paid vs Free',         accent: 'text-amber-300',   ring: 'border-amber-500/20' },
  recruitmentFunnel:  { icon: UserCheck,   label: 'Recruitment Funnel',   accent: 'text-sky-300',     ring: 'border-sky-500/20' },
  loyaltyInsight:     { icon: Repeat,      label: 'Loyalty Insight',      accent: 'text-fuchsia-300', ring: 'border-fuchsia-500/20' },
};
const SECONDARY_KEYS = ['departmentInsights', 'yearInsights', 'eventInsights', 'paidVsFree', 'recruitmentFunnel', 'loyaltyInsight'];

const Stat = ({ label, value, color = 'text-white' }) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);
const MiniStat = ({ label, value, color = 'text-white' }) => (
  <div>
    <div className="text-gray-500 mb-1 text-xs">{label}</div>
    <div className={`${color} text-sm`}>{value}</div>
  </div>
);
const InsightCard = ({ k, body }) => {
  const meta = INSIGHT_META[k] || { icon: Sparkles, label: k, accent: 'text-violet-300', ring: 'border-violet-500/20' };
  const Icon = meta.icon;
  return (
    <div className={`bg-zinc-900 border ${meta.ring} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={meta.accent} />
        <h4 className={`font-semibold text-sm ${meta.accent}`}>{meta.label}</h4>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{body}</p>
    </div>
  );
};

const ClubInsightModal = ({ clubId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    api.get(`/api/admin/clubs/${clubId}/insights`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [clubId]);

  if (!clubId) return null;

  const club = data?.club;
  const exists = data?.exists;
  const snapshot = data?.statsSnapshot;
  const insight = data?.insight;
  const rt = snapshot?.recruitmentTotals;
  const et = snapshot?.eventTotals;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl">{club?.logoEmoji || '🏆'}</span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{club?.name || 'Club Report'}</h2>
              {exists && (
                <p className="text-xs text-gray-500">
                  Report generated on {fmtDate(data.generatedAt)}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
              <Loader size={20} className="animate-spin" /> Loading report…
            </div>
          )}
          {error && !loading && (
            <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {/* Fallback: no insight yet — show club info only */}
          {!loading && !error && exists === false && (
            <>
              {club?.description && (
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{club.description}</p>
              )}
              {club?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {club.tags.map((t, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="text-white font-semibold mb-3">Members ({club?.members?.length || 0})</h3>
              <div className="space-y-1 mb-6">
                {(club?.members || []).map(m => (
                  <div key={m._id} className="flex items-center justify-between px-3 py-2 bg-zinc-900/50 border border-white/5 rounded-lg">
                    <span className="text-gray-300 text-sm">{m.name}</span>
                    <span className="text-xs text-gray-500">{m.role} · {m.year} {m.dept}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200 flex items-start gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>The club president has not generated an AI report yet.</span>
              </div>
            </>
          )}

          {/* Insight present: stats + insight cards */}
          {!loading && !error && exists === true && (
            <>
              {/* Stats — same layout as club's own insights page */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-zinc-900 border border-blue-500/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck size={16} className="text-blue-400" />
                    <h3 className="text-white font-semibold">Recruitment Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Stat label="Total Applications" value={rt?.totalApplications ?? 0} />
                    <Stat label="Acceptance Rate" value={`${rt?.acceptanceRate ?? 0}%`} color="text-emerald-400" />
                    <Stat label="Accepted" value={rt?.accepted ?? 0} color="text-emerald-400" />
                    <Stat label="Pending" value={rt?.pending ?? 0} color="text-amber-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                    <MiniStat label="Top Dept" value={rt?.topDepartment || '—'} />
                    <MiniStat label="Top Year" value={rt?.topYear || '—'} />
                    <MiniStat label="Rejected" value={rt?.rejected ?? 0} color="text-rose-400" />
                  </div>
                </div>

                <div className="bg-zinc-900 border border-purple-500/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={16} className="text-purple-400" />
                    <h3 className="text-white font-semibold">Events Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Stat label="Total Events" value={et?.totalEvents ?? 0} />
                    <Stat label="Avg Attendance" value={`${et?.avgAttendanceRate ?? 0}%`} color="text-emerald-400" />
                    <Stat label="Total Registered" value={et?.totalRegistrations ?? 0} />
                    <Stat label="Total Attended" value={et?.totalAttended ?? 0} color="text-emerald-400" />
                  </div>
                  <div className="space-y-2 text-xs pt-3 border-t border-white/5">
                    {et?.paidEvents > 0 && (
                      <div className="flex items-center gap-2">
                        <PiggyBank size={12} className="text-amber-300 shrink-0" />
                        <span className="text-gray-400">
                          {fmtRupees(et.paidRevenue)} collected across {et.paidEvents} paid event{et.paidEvents > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {et?.bestAttendedEvent && (
                      <div className="flex items-center gap-2">
                        <Trophy size={12} className="text-yellow-400 shrink-0" />
                        <span className="text-gray-400 truncate">
                          Best: <span className="text-white">{et.bestAttendedEvent.name}</span>{' '}
                          <span className="text-emerald-400">({et.bestAttendedEvent.attendanceRate}%)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Insight cards */}
              {insight?.error ? (
                <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">
                  AI couldn't generate a clean report ({insight.error}). Ask the president to regenerate.
                </div>
              ) : insight ? (
                <>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-violet-400" />
                    AI's Read
                  </h3>
                  {insight.healthSummary && <InsightCard k="healthSummary" body={insight.healthSummary} />}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {SECONDARY_KEYS.map(k => (insight[k] ? <InsightCard key={k} k={k} body={insight[k]} /> : null))}
                  </div>

                  {Array.isArray(insight.recommendations) && insight.recommendations.length > 0 && (
                    <>
                      <h3 className="text-white font-semibold mt-8 mb-4 flex items-center gap-2">
                        <FileText size={14} className="text-blue-400" />
                        Actionable Recommendations
                      </h3>
                      <ol className="space-y-3">
                        {insight.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 text-sm font-semibold">
                              {i + 1}
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed pt-1">{rec}</p>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Section 3 — Community Insights
// ──────────────────────────────────────────────────────────────────────────
const CommunityInsightSection = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/admin/dashboard/community-insights');
      setData(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load community insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/api/admin/dashboard/community-insights/generate');
      setData(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const exists = data?.exists;
  const insight = data?.insight;
  const insightErr = insight?.error;

  return (
    <section>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Campus Interest Signals</h2>
          <p className="text-gray-500 text-sm">AI analysis of student communities and collab activity</p>
        </div>
        {exists && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            >
              {generating ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {generating ? 'Analyzing campus communities…' : 'Regenerate'}
            </button>
            <span className="text-xs text-gray-500">Last generated: {fmtDate(data.generatedAt)}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-gray-500 py-10 justify-center">
          <Loader size={20} className="animate-spin" /> Loading…
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && !exists && (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center">
          <Sparkles className="text-purple-400 mx-auto mb-4" size={32} />
          <h3 className="text-white font-semibold mb-2">No community analysis yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Generate an AI summary of campus interests, topic clusters, and underserved areas using current community + collab post data.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {generating ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Analyzing campus communities…' : 'Generate Community Insights'}
          </button>
        </div>
      )}

      {!loading && exists && insightErr && (
        <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">
          AI couldn't generate a clean report ({insightErr}). Try regenerating.
        </div>
      )}

      {!loading && exists && insight && !insightErr && (
        <div className="space-y-6">
          {insight.interestMap && (
            <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-purple-300 font-semibold text-sm mb-3 flex items-center gap-2">
                <Sparkles size={14} /> Interest Map
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">{insight.interestMap}</p>
            </div>
          )}

          {Array.isArray(insight.topicClusters) && insight.topicClusters.length > 0 && (
            <div className="bg-zinc-900 border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-cyan-300 font-semibold text-sm mb-4 flex items-center gap-2">
                <Globe size={14} /> Topic Clusters
              </h3>
              <div className="space-y-4">
                {insight.topicClusters.map((cluster, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">{cluster.theme}</span>
                      {typeof cluster.totalMembers === 'number' && (
                        <span className="text-xs text-gray-500">{cluster.totalMembers} members</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(cluster.communities || []).map((c, j) => (
                        <span key={j} className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(insight.adminSuggestions) && insight.adminSuggestions.length > 0 && (
            <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-6">
              <h3 className="text-amber-300 font-semibold text-sm mb-4 flex items-center gap-2">
                <Lightbulb size={14} /> Admin Suggestions
              </h3>
              <ol className="space-y-3">
                {insight.adminSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Lightbulb size={12} className="text-amber-300" />
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed pt-1">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {insight.underservedInterests && (
            <div className="bg-gradient-to-br from-rose-900/30 to-amber-900/20 border border-rose-500/30 rounded-xl p-6">
              <h3 className="text-rose-300 font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Underserved Interests
              </h3>
              <p className="text-gray-200 text-sm leading-relaxed">{insight.underservedInterests}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Page root
// ──────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openClubId, setOpenClubId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/dashboard/stats'),
      api.get('/api/admin/dashboard/clubs'),
    ])
      .then(([sRes, cRes]) => { setStats(sRes.data); setClubs(cRes.data); })
      .catch(e => setError(e.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Analytics Dashboard
        </h1>
        <p className="text-gray-500">High-level overview of campus activity</p>
      </div>

      {error && (
        <div className="mb-6 bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Section 1 — Stats */}
      <section className="mb-12">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-10 justify-center">
            <Loader size={20} className="animate-spin" /> Loading stats…
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STAT_CARDS.map(card => (
              <StatCard key={card.key} card={card} value={stats?.[card.key]} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Club Performance */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Club Performance</h2>
          <p className="text-gray-500 text-sm">Click any club to view its latest AI report</p>
        </div>
        {loading ? null : clubs.length === 0 ? (
          <p className="text-gray-500 text-sm">No clubs yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clubs.map(c => (
              <ClubCard key={c._id} club={c} onOpen={(cl) => setOpenClubId(cl._id)} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — Community Insights */}
      <CommunityInsightSection />

      <ClubInsightModal clubId={openClubId} onClose={() => setOpenClubId(null)} />
    </div>
  );
};

export default AdminDashboard;
