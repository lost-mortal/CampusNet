import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, CheckCircle2, Globe, Lock } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../lib/session';

const API = import.meta.env.VITE_API_URL;

const TAG_OPTIONS = ['Technical', 'Cultural', 'Sports', 'Creative', 'Other'];

const CreateCommunityModal = ({ isOpen, onClose, onSubmitted }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(''); setDescription(''); setTags([]);
      setIsPrivate(false); setReason('');
      setError(''); setSubmitted(false); setLoading(false);
    }
  }, [isOpen]);

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Community name is required'); return; }
    if (!reason.trim()) { setError('Please explain why this community should be approved'); return; }

    setLoading(true);
    try {
      const token = getToken();
      await axios.post(`${API}/api/communities`, {
        name, description, tags, isPrivate, reason,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#18181b] border border-white/10 w-full max-w-lg rounded-2xl relative shadow-2xl flex flex-col max-h-[90vh]"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-20"
              >
                <X size={18} />
              </button>

              {submitted ? (
                <div className="p-8 text-center">
                  <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-lg font-bold text-white mb-2">Request submitted</h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Your request has been submitted and is pending admin approval.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-6 pt-6 pb-3 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white mb-1">Create Community</h2>
                    <p className="text-xs text-gray-500">Submitted to the admin for approval.</p>
                  </div>

                  <div className="px-6 overflow-y-auto flex-1 space-y-4 pb-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                        Community Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Robotics Enthusiasts"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="What is this community about?"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1 text-xs rounded-full border transition-all ${
                              tags.includes(t)
                                ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                        Visibility
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPrivate(false)}
                          className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                            !isPrivate
                              ? 'bg-emerald-500/10 border-emerald-500/40'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <Globe size={16} className={!isPrivate ? 'text-emerald-300 mt-0.5' : 'text-gray-500 mt-0.5'} />
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold ${!isPrivate ? 'text-emerald-200' : 'text-gray-300'}`}>Public</div>
                            <div className="text-[10px] text-gray-500 leading-snug">Anyone can join instantly</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPrivate(true)}
                          className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                            isPrivate
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <Lock size={16} className={isPrivate ? 'text-amber-300 mt-0.5' : 'text-gray-500 mt-0.5'} />
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold ${isPrivate ? 'text-amber-200' : 'text-gray-300'}`}>Private</div>
                            <div className="text-[10px] text-gray-500 leading-snug">Manager approves each join</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                        Why should this community be approved?
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="For admin review only — not shown publicly."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                      />
                      <p className="text-[10px] text-gray-600 mt-1">This message is visible to the admin only.</p>
                    </div>

                    {error && (
                      <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {error}
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-white/5 flex gap-3 flex-shrink-0">
                    <button
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <><Loader size={14} className="animate-spin" /> Submitting…</>
                        : 'Submit Request'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CreateCommunityModal;
