import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Sparkles, Loader, RefreshCw, FileText, UserCheck, TrendingUp,
    Building2, GraduationCap, Calendar, Trophy, Wallet, PiggyBank,
    Repeat, AlertCircle,
} from 'lucide-react';
import api from '../../lib/api';

const PHRASES = [
    'Analyzing your club data…',
    'Crunching numbers and looking for patterns…',
    'Spotting the trends your data is hiding…',
    'Reading between the rows…',
    'Distilling insights from your activity…',
];

const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

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

const AIInsights = () => {
    const ctx = useOutletContext();
    const isPresident = ctx?.isPresident ?? false;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [phrase, setPhrase] = useState(PHRASES[0]);

    const fetchData = async () => {
        try {
            const res = await api.get('/api/clubs/my/insights');
            setData(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
        try {
            const res = await api.post('/api/clubs/my/insights/generate');
            setData(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate insights');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader className="animate-spin text-violet-400" size={28} />
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-8">
                <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    const snapshot = data?.snapshot;
    const insight = data?.insight;
    const exists = data?.exists;
    const rt = snapshot?.recruitmentTotals;
    const et = snapshot?.eventTotals;
    const insightHasError = insight?.error;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
          <div className="p-8 max-w-7xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        AI Insights
                    </h1>
                    <p className="text-gray-400">Data-driven recommendations for your club</p>
                </div>
                {isPresident && (
                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {generating ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Generating…
                                </>
                            ) : (
                                <>
                                    {exists ? <RefreshCw size={14} /> : <Sparkles size={14} />}
                                    {exists ? 'Regenerate Report' : 'Generate Report'}
                                </>
                            )}
                        </button>
                        {exists && data?.generatedAt && (
                            <span className="text-xs text-gray-500">
                                Last generated: {fmtDate(data.generatedAt)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {generating && (
                <div className="bg-violet-950/30 border border-violet-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <Loader size={16} className="animate-spin text-violet-300" />
                    <span className="text-sm text-violet-200">{phrase}</span>
                </div>
            )}

            {error && data && (
                <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-3 mb-6 text-sm flex items-center gap-3">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats — always live */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recruitment Summary */}
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
                    <div className="grid grid-cols-3 gap-3 text-xs pt-3 border-t border-white/5">
                        <MiniStat label="Top Dept" value={rt?.topDepartment || '—'} />
                        <MiniStat label="Top Year" value={rt?.topYear || '—'} />
                        <MiniStat label="Rejected" value={rt?.rejected ?? 0} color="text-rose-400" />
                    </div>
                </div>

                {/* Events Summary */}
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
                                <PiggyBank size={12} className="text-amber-300 flex-shrink-0" />
                                <span className="text-gray-400">
                                    ₹{(et.paidRevenue ?? 0).toLocaleString('en-IN')} collected across {et.paidEvents} paid event{et.paidEvents > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                        {et?.bestAttendedEvent && (
                            <div className="flex items-center gap-2">
                                <Trophy size={12} className="text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-400 truncate">
                                    Best: <span className="text-white">{et.bestAttendedEvent.name}</span>{' '}
                                    <span className="text-emerald-400">({et.bestAttendedEvent.attendanceRate}%)</span>
                                </span>
                            </div>
                        )}
                        {snapshot?.loyalty?.totalUniqueAttendees > 0 && (
                            <div className="flex items-center gap-2">
                                <Repeat size={12} className="text-fuchsia-300 flex-shrink-0" />
                                <span className="text-gray-400">
                                    {snapshot.loyalty.studentsWith2PlusEvents} returning attendees
                                    {' '}({snapshot.loyalty.loyaltyRate}% of {snapshot.loyalty.totalUniqueAttendees})
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {!exists && !generating && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-12 text-center">
                    <Sparkles className="text-violet-400 mx-auto mb-4" size={32} />
                    <h3 className="text-white font-semibold mb-2">No report generated yet</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                        {isPresident
                            ? "Click Generate Report and AI will analyze your club's recruitment funnel, event attendance, and member engagement to surface what's working and what isn't."
                            : "Your club president hasn't generated an AI insights report yet. Check back later."}
                    </p>
                    {isPresident && (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-5 py-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60"
                        >
                            <Sparkles size={14} />
                            Generate Report
                        </button>
                    )}
                </div>
            )}

            {/* AI insight cards */}
            {exists && insightHasError && (
                <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span>AI couldn't generate a clean report ({insight.error}). Try regenerating.</span>
                </div>
            )}

            {exists && insight && !insightHasError && (
                <>
                    <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-violet-400" />
                        AI's Read
                    </h2>

                    {insight.healthSummary && (
                        <InsightCard k="healthSummary" body={insight.healthSummary} />
                    )}

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
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 text-sm font-semibold">
                                            {i + 1}
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed pt-1">{rec}</p>
                                    </li>
                                ))}
                            </ol>
                        </>
                    )}
                </>
            )}
          </div>
        </div>
    );
};

const Stat = ({ label, value, color = 'text-white' }) => (
    <div>
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
);

const MiniStat = ({ label, value, color = 'text-white' }) => (
    <div>
        <div className="text-gray-500 mb-1">{label}</div>
        <div className={color}>{value}</div>
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

export default AIInsights;
