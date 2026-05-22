import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Trash2, AlertTriangle, Loader } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../lib/session';

const API = import.meta.env.VITE_API_URL;

// Confirm + cascade modal used by the club sidebar's event/recruitment lists
// and by EventStats / RecruitmentApplicants. Shared so the messaging stays
// consistent — particularly the approved-payment warning.
//
// Props:
//   open                    — boolean
//   postTitle               — string
//   postType                — 'Event' | 'Recruitment'
//   postId                  — string
//   approvedPaymentsCount   — number (Events only; safe to pass 0 for Recruitments)
//   onCancel                — () => void
//   onDeleted               — (payload: { warning?: string }) => void
const DeletePostModal = ({
  open,
  postTitle,
  postType,
  postId,
  approvedPaymentsCount = 0,
  onCancel,
  onDeleted,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const cascadeLabel = postType === 'Event' ? 'registrations' : 'applications';

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await axios.delete(`${API}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onDeleted?.(data || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post');
    } finally {
      setBusy(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div className="bg-[#0a0a0a] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <Trash2 size={18} className="text-red-300" />
          </div>
          <h3 className="text-white font-bold text-lg">Delete {postType} Post</h3>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Delete <span className="text-white font-semibold">{postTitle}</span>?
          This will permanently delete this post and all associated {cascadeLabel}.
        </p>

        {approvedPaymentsCount > 0 && (
          <div className="mb-5 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <AlertTriangle size={14} className="text-red-300 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed">
              Warning: {approvedPaymentsCount} student{approvedPaymentsCount === 1 ? ' has' : 's have'} approved payments that will also be deleted.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeletePostModal;
