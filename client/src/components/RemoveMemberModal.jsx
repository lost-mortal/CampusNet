import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { UserMinus, X, Loader } from 'lucide-react';

const RemoveMemberModal = ({ memberName, contextName, onConfirm, onClose }) => {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError('Please enter a reason for removal.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await onConfirm(trimmed);
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to remove member');
            setSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                            <UserMinus size={18} className="text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">Remove Member</h3>
                            <p className="text-xs text-gray-500">
                                {memberName}{contextName ? ` · ${contextName}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
                        disabled={submitting}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Reason for removal
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Briefly explain why this member is being removed. They will see this in their notifications."
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
                        autoFocus
                        disabled={submitting}
                    />
                    {error && (
                        <p className="text-xs text-red-400">{error}</p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 p-5 pt-0">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !reason.trim()}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting ? <Loader size={14} className="animate-spin" /> : <UserMinus size={14} />}
                        Remove
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RemoveMemberModal;
