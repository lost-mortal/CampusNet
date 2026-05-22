import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
    Loader, AlertCircle, Camera, CameraOff, CheckCircle,
    XCircle, AlertTriangle, RefreshCw, Users, UserCheck, UserX, TrendingUp,
    Eye, X, IndianRupee, Trash2,
} from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';
import DeletePostModal from '../../components/DeletePostModal';

const API = import.meta.env.VITE_API_URL;

const EventStats = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { isPresident } = useOutletContext() || {};
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Scanner
    const [scanLog, setScanLog] = useState([]);
    const [manualInput, setManualInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // 'idle' = not started, 'active' = camera running, 'denied' = permission refused
    const [cameraState, setCameraState] = useState('idle');
    // Payment verification (paid events)
    const [screenshotModalUrl, setScreenshotModalUrl] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const qrCodeRef = useRef(null);
    // Use a ref to always point to the latest handleScan without stale closures
    const handleScanRef = useRef(null);

    const token = getToken();

    const fetchEventData = () => {
        axios.get(`${API}/api/registrations/event/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => { setEventData(r.data); setPageError(null); })
            .catch(err => setPageError(err.response?.data?.error || 'Failed to load event data'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchEventData(); }, [eventId]);

    const handleScan = async (ticketId) => {
        const scanId = Date.now();
        setScanLog(prev => [{ id: scanId, status: 'pending', message: 'Checking…' }, ...prev]);

        try {
            const res = await axios.post(
                `${API}/api/registrations/scan`,
                { ticketId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = res.data;
            setScanLog(prev => prev.map(e =>
                e.id === scanId
                    ? {
                        ...e,
                        status: data.alreadyAttended ? 'warning' : 'success',
                        message: data.alreadyAttended
                            ? `Already marked present — ${data.name}`
                            : `${data.name} — ${data.rollNumber} marked present`,
                    }
                    : e
            ));
            if (!data.alreadyAttended) fetchEventData();
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Ticket not found';
            setScanLog(prev => prev.map(e =>
                e.id === scanId ? { ...e, status: 'error', message: errMsg } : e
            ));
        }
    };

    // Keep ref current on every render so the camera closure always calls the latest version
    handleScanRef.current = handleScan;

    const startCamera = async () => {
        if (qrCodeRef.current) {
            try { await qrCodeRef.current.stop(); } catch {}
            try { qrCodeRef.current.clear(); } catch {}
            qrCodeRef.current = null;
        }
        const el = document.getElementById('qr-reader');
        if (el) el.innerHTML = '';

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const qrCode = new Html5Qrcode('qr-reader');
            qrCodeRef.current = qrCode;

            await qrCode.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                (decodedText) => {
                    qrCode.stop().catch(() => {});
                    const el = document.getElementById('qr-reader');
                    if (el) el.innerHTML = '';
                    setCameraState('idle');
                    handleScanRef.current(decodedText);
                },
                () => {}
            );
            setCameraState('active');
        } catch {
            setCameraState('denied');
        }
    };

    const stopCamera = async () => {
        if (qrCodeRef.current) {
            try { await qrCodeRef.current.stop(); } catch {}
            qrCodeRef.current = null;
        }
        const el = document.getElementById('qr-reader');
        if (el) el.innerHTML = '';
        setCameraState('idle');
    };

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (qrCodeRef.current) qrCodeRef.current.stop().catch(() => {});
        };
    }, []);

    const handleApprovePayment = async (regId) => {
        setApprovingId(regId);
        try {
            await axios.patch(
                `${API}/api/registrations/${regId}/approve-payment`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchEventData();
        } catch (err) {
            console.error(err);
        } finally {
            setApprovingId(null);
        }
    };

    const handleRejectPayment = async (regId) => {
        if (!window.confirm('Reject this payment? The registration will be removed and the student can re-register.')) return;
        setRejectingId(regId);
        try {
            await axios.delete(
                `${API}/api/registrations/${regId}/reject-payment`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchEventData();
        } catch (err) {
            console.error(err);
        } finally {
            setRejectingId(null);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const ticketId = manualInput.trim();
        if (!ticketId) return;
        setManualInput('');
        setSubmitting(true);
        await handleScan(ticketId);
        setSubmitting(false);
    };

    if (!eventId) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-64 text-gray-500">
                <AlertCircle size={40} className="mb-4 text-red-400" />
                <p className="text-lg font-medium text-white">No event selected</p>
                <p className="text-sm mt-1">Select an event from the sidebar.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center gap-3 text-gray-500">
                <Loader size={20} className="animate-spin" />
                <span>Loading event data…</span>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-500">
                <AlertCircle size={40} className="text-red-400 mb-2" />
                <p className="text-white font-medium">{pageError}</p>
                <button
                    onClick={fetchEventData}
                    className="mt-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors flex items-center gap-2"
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    const { eventTitle, eventDate, clubName, totalRegistered, totalAttended, totalNoShow, registrants, isPaid, amount } = eventData;

    const attendanceRate = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;
    const approvedCount = registrants.filter(r => r.paymentStatus === 'approved').length;
    const rateColor = (r) => r >= 70 ? 'text-emerald-400' : r >= 40 ? 'text-amber-400' : 'text-rose-400';

    const DEPTS = ['COMP', 'ENTC', 'IT', 'MECH'];
    const YEARS = ['FE', 'SE', 'TE', 'BE'];

    const deptBreakdown = DEPTS.map(dept => {
        const group = registrants.filter(r => r.department === dept);
        const registered = group.length;
        const attended = group.filter(r => r.attended).length;
        const rate = registered > 0 ? Math.round((attended / registered) * 100) : null;
        return { dept, registered, attended, rate };
    }).filter(d => d.registered > 0);

    const yearBreakdown = YEARS.map(year => {
        const group = registrants.filter(r => r.year === year);
        const registered = group.length;
        const attended = group.filter(r => r.attended).length;
        const rate = registered > 0 ? Math.round((attended / registered) * 100) : null;
        return { year, registered, attended, rate };
    }).filter(y => y.registered > 0);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="p-8">
            {/* Top row: heading (left) + scanner (right) */}
            <div className="flex items-start gap-8 mb-8">

                {/* Heading */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <h1 className="text-2xl font-bold text-white mb-1">
                            {eventTitle} Analytics
                        </h1>
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
                    <p className="text-gray-400 text-sm flex items-center gap-2 flex-wrap">
                        <span>{clubName}</span>
                        {eventDate && <span>· {new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                        {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase tracking-wider">
                                <IndianRupee size={10} />Paid · ₹{amount}
                            </span>
                        )}
                    </p>
                </div>

                {/* Scanner — inlined (not a nested component) to avoid remount on state changes */}
                <div className="w-80 flex-shrink-0 bg-zinc-900 border border-white/10 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Camera size={12} className="text-blue-400" />
                        QR Scanner
                    </h3>

                    {/* Camera view — always in DOM; Html5Qrcode requires a visible element to render the video feed */}
                    <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />

                    {cameraState === 'idle' && (
                        <button
                            onClick={startCamera}
                            className="mb-3 w-full py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-2"
                        >
                            <Camera size={13} /> Start Scanner
                        </button>
                    )}

                    {cameraState === 'active' && (
                        <button
                            onClick={stopCamera}
                            className="mb-3 w-full py-2 rounded-lg bg-zinc-800 border border-white/10 text-gray-400 text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <CameraOff size={13} /> Stop Camera
                        </button>
                    )}

                    {cameraState === 'denied' && (
                        <div className="bg-zinc-800 rounded-xl p-4 text-center mb-3 border border-white/5">
                            <CameraOff size={22} className="text-gray-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Camera access denied — use manual entry</p>
                        </div>
                    )}

                    {/* Manual entry */}
                    <form onSubmit={handleManualSubmit} className="flex gap-2 mb-3">
                        <input
                            value={manualInput}
                            onChange={e => setManualInput(e.target.value)}
                            placeholder="Paste ticket ID…"
                            className="flex-1 min-w-0 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !manualInput.trim()}
                            className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-40 flex-shrink-0"
                        >
                            {submitting ? '…' : 'Go'}
                        </button>
                    </form>

                    {/* Scan log — newest first, in-memory only */}
                    {scanLog.length > 0 && (
                        <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Scan Log</p>
                            {scanLog.map(entry => (
                                <div
                                    key={entry.id}
                                    className={`text-xs p-2.5 rounded-lg flex items-start gap-2 ${
                                        entry.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        entry.status === 'warning'  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        entry.status === 'error'    ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        'bg-zinc-800 text-gray-500'
                                    }`}
                                >
                                    <span className="mt-px flex-shrink-0">
                                        {entry.status === 'success' && <CheckCircle size={12} />}
                                        {entry.status === 'warning'  && <AlertTriangle size={12} />}
                                        {entry.status === 'error'    && <XCircle size={12} />}
                                        {entry.status === 'pending'  && <Loader size={12} className="animate-spin" />}
                                    </span>
                                    <span className="leading-tight">{entry.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={15} className="text-indigo-400" />
                        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Registered</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalRegistered}</p>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <UserCheck size={15} className="text-emerald-400" />
                        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Attended</h3>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">{totalAttended}</p>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <UserX size={15} className="text-rose-400" />
                        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">No-Shows</h3>
                    </div>
                    <p className="text-3xl font-bold text-rose-400">{totalNoShow}</p>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={15} className="text-sky-400" />
                        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Attendance Rate</h3>
                    </div>
                    <p className={`text-3xl font-bold ${rateColor(attendanceRate)}`}>{attendanceRate}%</p>
                </div>
            </div>

            {/* Revenue card — paid events only */}
            {isPaid && (
                <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl px-6 py-4 flex items-center gap-5">
                    <IndianRupee size={22} className="text-amber-400 shrink-0" />
                    <div>
                        <p className="text-[11px] font-semibold text-amber-400/70 uppercase tracking-wider mb-0.5">Total Collected</p>
                        <p className="text-2xl font-bold text-amber-300">₹{approvedCount * amount}</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-1">{approvedCount} of {totalRegistered} payment{totalRegistered !== 1 ? 's' : ''} approved · ₹{amount} per head</span>
                </div>
            )}

            {/* Breakdowns — above the student list so they're always visible */}
            {registrants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Department breakdown */}
                    <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5">
                            <h2 className="font-semibold text-white text-sm">By Department</h2>
                        </div>
                        {deptBreakdown.length === 0 ? (
                            <p className="px-6 py-4 text-xs text-gray-600">No department data available.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-wider text-gray-600 border-b border-white/5">
                                        <th className="text-left px-6 py-3 font-medium">Dept</th>
                                        <th className="text-right px-4 py-3 font-medium">Registered</th>
                                        <th className="text-right px-4 py-3 font-medium">Attended</th>
                                        <th className="text-right px-6 py-3 font-medium">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {deptBreakdown.map(({ dept, registered, attended, rate }) => (
                                        <tr key={dept} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-3 text-gray-200 font-medium font-mono text-xs">{dept}</td>
                                            <td className="px-4 py-3 text-gray-400 text-right">{registered}</td>
                                            <td className="px-4 py-3 text-emerald-400 text-right font-medium">{attended}</td>
                                            <td className={`px-6 py-3 text-right font-bold text-sm ${rateColor(rate)}`}>{rate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Year breakdown */}
                    <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5">
                            <h2 className="font-semibold text-white text-sm">By Year</h2>
                        </div>
                        {yearBreakdown.length === 0 ? (
                            <p className="px-6 py-4 text-xs text-gray-600">No year data available.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-wider text-gray-600 border-b border-white/5">
                                        <th className="text-left px-6 py-3 font-medium">Year</th>
                                        <th className="text-right px-4 py-3 font-medium">Registered</th>
                                        <th className="text-right px-4 py-3 font-medium">Attended</th>
                                        <th className="text-right px-6 py-3 font-medium">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {yearBreakdown.map(({ year, registered, attended, rate }) => (
                                        <tr key={year} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-3 text-gray-200 font-medium">{year}</td>
                                            <td className="px-4 py-3 text-gray-400 text-right">{registered}</td>
                                            <td className="px-4 py-3 text-emerald-400 text-right font-medium">{attended}</td>
                                            <td className={`px-6 py-3 text-right font-bold text-sm ${rateColor(rate)}`}>{rate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Registrants table */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="font-semibold text-white text-sm">Registered Students</h2>
                    <span className="text-xs text-gray-500">{totalRegistered} total</span>
                </div>

                {registrants.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Users size={32} className="mx-auto mb-3 opacity-30" />
                        <p>No registrations yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-wider text-gray-600 border-b border-white/5">
                                    <th className="text-left px-6 py-3 font-medium">Name</th>
                                    <th className="text-left px-6 py-3 font-medium">Roll No.</th>
                                    <th className="text-left px-6 py-3 font-medium">Dept</th>
                                    <th className="text-left px-6 py-3 font-medium">Year</th>
                                    <th className="text-left px-6 py-3 font-medium">Status</th>
                                    {isPaid && <th className="text-left px-6 py-3 font-medium">Payment</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {registrants.map(r => (
                                    <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-3 text-gray-200 font-medium">{r.name}</td>
                                        <td className="px-6 py-3 text-gray-400 font-mono text-xs">{r.rollNumber || '—'}</td>
                                        <td className="px-6 py-3 text-gray-400">{r.department || '—'}</td>
                                        <td className="px-6 py-3 text-gray-400">{r.year || '—'}</td>
                                        <td className="px-6 py-3">
                                            {r.attended ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                                    Attended
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-gray-500 text-xs border border-white/5">
                                                    Not Yet
                                                </span>
                                            )}
                                        </td>
                                        {isPaid && (
                                            <td className="px-6 py-3">
                                                {r.paymentStatus === 'approved' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                                        <CheckCircle size={11} /> Approved
                                                    </span>
                                                )}
                                                {r.paymentStatus === 'pending_verification' && (
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/20">
                                                            Pending Verification
                                                        </span>
                                                        {r.paymentScreenshot && (
                                                            <button
                                                                onClick={() => setScreenshotModalUrl(r.paymentScreenshot)}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors"
                                                            >
                                                                <Eye size={11} /> View Screenshot
                                                            </button>
                                                        )}
                                                        {approvingId === r._id ? (
                                                            <Loader size={14} className="animate-spin text-gray-400" />
                                                        ) : (
                                                            <button
                                                                onClick={() => handleApprovePayment(r._id)}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                                                            >
                                                                <CheckCircle size={11} /> Approve Payment
                                                            </button>
                                                        )}
                                                        {rejectingId === r._id ? (
                                                            <Loader size={14} className="animate-spin text-gray-400" />
                                                        ) : (
                                                            <button
                                                                onClick={() => handleRejectPayment(r._id)}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300 hover:bg-red-500/25 transition-colors"
                                                            >
                                                                <XCircle size={11} /> Reject Payment
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {r.paymentStatus === 'free' && (
                                                    <span className="text-xs text-gray-600">—</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Screenshot viewer modal — portaled below */}
            {screenshotModalUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setScreenshotModalUrl(null)}
                >
                    <div className="relative max-w-2xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setScreenshotModalUrl(null)}
                            className="absolute -top-2 -right-2 p-2 bg-zinc-900 border border-white/20 rounded-full text-gray-300 hover:text-white hover:bg-zinc-800 transition-colors z-10"
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>
                        <img
                            src={screenshotModalUrl}
                            alt="Payment screenshot"
                            className="max-w-full max-h-[85vh] rounded-xl border border-white/10 shadow-2xl"
                        />
                    </div>
                </div>
            )}

        </div>
        <DeletePostModal
            open={deleteOpen}
            postId={eventId}
            postTitle={eventTitle}
            postType="Event"
            approvedPaymentsCount={approvedCount}
            onCancel={() => setDeleteOpen(false)}
            onDeleted={() => { setDeleteOpen(false); navigate('/club/profile'); }}
        />
        </div>
    );
};

export default EventStats;
