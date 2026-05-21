import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Calendar, Clock, MapPin, Users, Briefcase, Share2, Loader, Ticket, IndianRupee, Upload, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../lib/session';

const API = import.meta.env.VITE_API_URL;

const formatDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

const ActionModal = ({ isOpen, onClose, item }) => {
    const [step, setStep] = useState('initial'); // initial | success | pending_verification | already_registered | error
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [paymentScreenshot, setPaymentScreenshot] = useState(''); // data URL

    useEffect(() => {
        if (isOpen) {
            setStep('initial'); setErrorMsg(''); setPaymentScreenshot('');
        }
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const handleScreenshotFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPaymentScreenshot(reader.result);
        reader.readAsDataURL(file);
    };

    const handleAction = async () => {
        if (item.type === 'event') {
            if (item.isPaid && !paymentScreenshot) {
                setErrorMsg('Please upload your payment screenshot before registering.');
                return;
            }
            setLoading(true);
            try {
                const token = getToken();
                const body = item.isPaid
                    ? { postId: item._id, paymentScreenshot }
                    : { postId: item._id };
                await axios.post(`${API}/api/registrations`, body, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStep(item.isPaid ? 'pending_verification' : 'success');
            } catch (err) {
                if (err.response?.status === 409) {
                    setStep('already_registered');
                } else {
                    setErrorMsg(err.response?.data?.error || 'Something went wrong');
                    setStep('error');
                }
            } finally {
                setLoading(false);
            }
            return;
        }
        if (item.type === 'recruitment') {
            setLoading(true);
            try {
                const token = getToken();
                await axios.post(`${API}/api/posts/${item._id}/apply`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStep('success');
            } catch (err) {
                setErrorMsg(err.response?.data?.error || 'Something went wrong');
                setStep('error');
            } finally {
                setLoading(false);
            }
            return;
        }
        if (item.type === 'collab') {
            setLoading(true);
            try {
                const token = getToken();
                await axios.post(`${API}/api/connections`,
                    { type: 'collab', sourcePostId: item._id },
                    { headers: { Authorization: `Bearer ${token}` } });
                setStep('success');
            } catch (err) {
                if (err.response?.status === 409) {
                    setErrorMsg('You\'ve already sent a connection request to this person.');
                } else {
                    setErrorMsg(err.response?.data?.error || 'Failed to send connection request');
                }
                setStep('error');
            } finally {
                setLoading(false);
            }
            return;
        }
        setStep('success');
    };

    const renderEventDetailBlock = () => (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2 text-sm">
            <div className="flex items-start justify-between gap-3">
                <span className="text-gray-500 shrink-0">Organized by</span>
                <span className="text-indigo-400 font-medium text-right">{item.clubName}</span>
            </div>
            {item.eventDate && (
                <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-500 shrink-0 flex items-center gap-1.5"><Calendar size={13} /> Event</span>
                    <span className="text-gray-200 text-right">{formatDateTime(item.eventDate)}</span>
                </div>
            )}
            {item.registrationDeadline && (
                <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-500 shrink-0 flex items-center gap-1.5"><Clock size={13} /> Register by</span>
                    <span className="text-gray-200 text-right">{formatDateTime(item.registrationDeadline)}</span>
                </div>
            )}
            {item.location && (
                <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-500 shrink-0 flex items-center gap-1.5"><MapPin size={13} /> Venue</span>
                    <span className="text-gray-200 text-right">{item.location}</span>
                </div>
            )}
            <div className="flex items-start justify-between gap-3 pt-2 border-t border-white/5">
                <span className="text-gray-500 shrink-0">Ticket</span>
                {item.isPaid ? (
                    <span className="text-amber-400 font-bold">PAID EVENT â€” â‚¹{item.amount}</span>
                ) : (
                    <span className="text-emerald-400 font-medium">Free</span>
                )}
            </div>
        </div>
    );

    const getModalContent = () => {
        // EVENT
        if (item.type === 'event') {
            if (step === 'success') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                            <Check size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">You're In!</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Registered! Check your Activity for your ticket.
                        </p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Done
                        </button>
                    </div>
                );
            }

            if (step === 'pending_verification') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-4 border border-amber-500/30">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Registration submitted</h3>
                        <p className="text-gray-400 text-sm mb-2">
                            Pending payment verification by {item.clubName}.
                        </p>
                        <p className="text-gray-500 text-xs mb-6">
                            Your ticket will appear in your Activity hub once a club member approves your payment.
                        </p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Close
                        </button>
                    </div>
                );
            }

            if (step === 'already_registered') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-4 border border-amber-500/30">
                            <Ticket size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Already Registered</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            You've already registered for this event. Check your Activity for your ticket.
                        </p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Close
                        </button>
                    </div>
                );
            }

            if (step === 'error') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                            <X size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Registration Failed</h3>
                        <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Close
                        </button>
                    </div>
                );
            }

            // Initial event view â€” expanded for both free + paid
            return (
                <div>
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl shrink-0 border border-indigo-500/30">
                            {item.clubLogo || 'ðŸ†'}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-indigo-400 text-sm">{item.clubName}</p>
                        </div>
                    </div>

                    {item.description && (
                        <p className="text-gray-300 text-sm mb-4 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                            {item.description}
                        </p>
                    )}

                    <div className="mb-5">{renderEventDetailBlock()}</div>

                    {/* Paid event: QR + screenshot upload */}
                    {item.isPaid && (
                        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 mb-5">
                            <div className="flex items-center justify-center gap-2 mb-3 text-amber-300 text-sm font-bold tracking-wide">
                                <IndianRupee size={15} /> PAID EVENT â€” â‚¹{item.amount}
                            </div>

                            {item.paymentQrImage ? (
                                <div className="flex flex-col items-center mb-3">
                                    <img
                                        src={item.paymentQrImage}
                                        alt="Payment QR"
                                        className="w-48 h-48 rounded-lg object-contain bg-white border border-white/10"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 text-center mb-3">No QR provided by the club.</p>
                            )}

                            <p className="text-xs text-amber-200/80 text-center mb-4">
                                Scan to pay, then upload your payment screenshot below.
                            </p>

                            <label className="block">
                                <span className="text-xs text-gray-400 font-medium mb-1.5 flex items-center gap-1.5">
                                    <Upload size={12} /> Upload Payment Screenshot *
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleScreenshotFile}
                                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/15"
                                />
                            </label>

                            {paymentScreenshot && (
                                <div className="mt-3 flex items-center gap-3 bg-white/5 rounded-lg p-2 border border-white/10">
                                    <img src={paymentScreenshot} alt="screenshot preview" className="w-12 h-12 object-cover rounded border border-white/10" />
                                    <span className="text-xs text-emerald-400 flex items-center gap-1.5"><Check size={12} /> Screenshot ready</span>
                                </div>
                            )}
                        </div>
                    )}

                    {errorMsg && (
                        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-3 flex items-start gap-2">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {errorMsg}
                        </p>
                    )}

                    <button
                        onClick={handleAction}
                        disabled={loading || (item.isPaid && !paymentScreenshot)}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading
                            ? <><Loader size={16} className="animate-spin" /> {item.isPaid ? 'Submittingâ€¦' : 'Registeringâ€¦'}</>
                            : (item.isPaid ? 'Register & Submit Payment' : 'Confirm Registration')}
                    </button>
                    <p className="text-center text-xs text-gray-500">
                        By registering, you agree to the event terms.
                    </p>
                </div>
            );
        }

        // RECRUITMENT
        if (item.type === 'recruitment') {
            if (step === 'success') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                            <Check size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Application Sent!</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Your profile has been shared with {item.clubName}. They will contact you shortly.
                        </p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Close
                        </button>
                    </div>
                );
            }

            if (step === 'error') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                            <X size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Could Not Apply</h3>
                        <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Close
                        </button>
                    </div>
                );
            }

            return (
                <div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center text-2xl border border-indigo-500/30">
                            {item.clubLogo}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-0.5">Apply for Positions</h3>
                            <p className="text-indigo-400 text-sm">{item.clubName}</p>
                        </div>
                    </div>

                    <div className="text-gray-300 text-sm mb-4 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className='mb-2 font-medium text-white'>Roles Available:</p>
                        <p>{item.description}</p>
                    </div>

                    {item.registrationDeadline && (
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-6 flex items-center justify-between text-sm">
                            <span className="text-gray-500 flex items-center gap-1.5"><Clock size={13} /> Apply by</span>
                            <span className="text-gray-200">{formatDateTime(item.registrationDeadline)}</span>
                        </div>
                    )}

                    <button
                        onClick={handleAction}
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader size={16} className="animate-spin" /> Submittingâ€¦</> : 'Submit Profile'}
                    </button>
                </div>
            );
        }

        // COLLAB
        if (item.type === 'collab') {
            if (step === 'success') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
                            <Share2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Request Sent!</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Your collab request has been sent to {item.authorName}. They'll see it in their Activity Hub.
                        </p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Back to Feed
                        </button>
                    </div>
                );
            }

            if (step === 'error') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                            <X size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Couldn't send request</h3>
                        <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Close
                        </button>
                    </div>
                );
            }

            return (
                <div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-white mb-0.5 truncate">{item.title}</h3>
                            <p className="text-gray-400 text-sm truncate">by {item.authorName}{item.communityName ? ` Â· ${item.communityName}` : ''}</p>
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                        <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm font-medium">
                            <Briefcase size={16} />
                            <span>Description</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {item.description}
                        </p>
                        {item.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
                                {item.skills.map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-300 text-[10px] font-medium">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAction}
                        disabled={loading}
                        className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-60"
                    >
                        {loading ? 'Sendingâ€¦' : 'Send Connection Request'}
                    </button>
                </div>
            );
        }

        return null;
    };

    const isEventInitial = item.type === 'event' && step === 'initial';
    const modalMaxWidth = isEventInitial ? 'max-w-2xl' : 'max-w-md';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`bg-[#18181b] border border-white/10 w-full ${modalMaxWidth} rounded-2xl p-6 relative shadow-2xl overflow-hidden my-auto max-h-[92vh] overflow-y-auto custom-scrollbar`}
                        >
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[50px]" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                            >
                                <X size={18} />
                            </button>

                            <div className="relative z-10 mt-2">
                                {getModalContent()}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ActionModal;
