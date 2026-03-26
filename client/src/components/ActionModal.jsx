import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Calendar, MapPin, Users, Briefcase, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';

const ActionModal = ({ isOpen, onClose, item }) => {
    const [step, setStep] = useState('initial'); // 'initial', 'success', 'qr'

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) setStep('initial');
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const handleAction = () => {
        if (item.type === 'event') {
            setStep('qr');
        } else {
            setStep('success');
        }
    };

    const getModalContent = () => {
        // SCENARIO A: EVENT (QR TICKET)
        if (item.type === 'event') {
            if (step === 'qr') {
                return (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="bg-white p-4 rounded-xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            <QRCode
                                value={`TICKET-${item._id}-${item.title}`}
                                size={180}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Ticket Confirmed!</h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            Scan this QR code at the venue entrance. A copy has been sent to your email.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                );
            }

            // Initial Event View
            return (
                <div>
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                            <div className="flex flex-wrap gap-y-1 gap-x-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(item.date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><MapPin size={14} /> {item.location}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Ticket Price</span>
                            <span className="text-white font-bold">Free</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Organized By</span>
                            <span className="text-indigo-400 text-sm">{item.clubName}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleAction}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] mb-3"
                    >
                        Confirm Registration
                    </button>
                    <p className="text-center text-xs text-gray-500">
                        By registering, you agree to the event terms.
                    </p>
                </div>
            );
        }

        // SCENARIO B: RECRUITMENT
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

                    <div className="text-gray-300 text-sm mb-6 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className='mb-2 font-medium text-white'>Roles Available:</p>
                        <p>{item.description}</p>
                    </div>

                    <button
                        onClick={handleAction}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                    >
                        Submit Profile
                    </button>
                </div>
            );
        }

        // SCENARIO C: COLLAB
        if (item.type === 'collab') {
            if (step === 'success') {
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
                            <Share2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Request Sent!</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            {item.authorName} has generated a notification. Good luck!
                        </p>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Back to Feed
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
                        <div>
                            <h3 className="text-lg font-bold text-white mb-0.5">Connect for {item.role}</h3>
                            <p className="text-gray-400 text-sm">with {item.authorName} ({item.communityName})</p>
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                        <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm font-medium">
                            <Briefcase size={16} />
                            <span>Role Description</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {item.description}
                        </p>
                    </div>

                    <button
                        onClick={handleAction}
                        className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    >
                        Send Connection Request
                    </button>
                </div>
            );
        }

        // DEFAULT FALLBACK (Shouldn't happen)
        return null;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#18181b] border border-white/10 w-full max-w-md rounded-2xl p-6 relative shadow-2xl overflow-hidden"
                        >
                            {/* Glow Effect */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[50px]" />

                            {/* Header (Close Button) */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                            >
                                <X size={18} />
                            </button>

                            {/* Content */}
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
