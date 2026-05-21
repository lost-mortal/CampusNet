import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Filter, Plus, Users, MapPin, Search, Loader, Calendar, Clock, CheckCircle, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ActionModal from '../../components/ActionModal';
import { getToken, getUser } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const TAG_GRADIENTS = {
  Technical:   'from-indigo-900/60 to-blue-900/40',
  Cultural:    'from-pink-900/60 to-purple-900/40',
  Sports:      'from-green-900/60 to-emerald-900/40',
  Recruitment: 'from-amber-900/60 to-orange-900/40',
  Creative:    'from-rose-900/60 to-pink-900/40',
  Other:       'from-zinc-900/60 to-gray-900/40',
};

const FILTERS = ['All', 'Events', 'Recruitment', 'General', 'Collabs'];
const SUB_FILTERS = ['Closing Soon', 'New', 'Past'];
const SUB_FILTERED_TABS = new Set(['Events', 'Recruitment']);

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const formatShortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const formatDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
const isPast = (d) => d && new Date(d) < new Date();

const COLLAB_TAGS = ['Technical', 'Creative', 'Cultural', 'Sports', 'Other'];

const GeneralCollabModal = ({ onClose, onPosted }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag) => setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !lookingFor.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const token = getToken();
      const { data } = await axios.post(
        `${API}/api/posts/collab`,
        { title, description, lookingFor, tags: selectedTags },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onPosted(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0f0f12] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">Post a General Collaboration Request</h2>
            <p className="text-sm text-gray-500 mt-0.5">This will appear in everyone's feed under Collabs</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 -mt-1">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Looking for a React dev for my startup"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* What are you working on */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              What are you working on? <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the project, idea, or goal..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          {/* Looking for */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              What kind of collaborator are you looking for? <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={lookingFor}
              onChange={e => setLookingFor(e.target.value)}
              placeholder="Skills, year, background, time commitment, etc."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {COLLAB_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/50 hover:text-gray-200'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
            {submitting ? 'Postingâ€¦' : 'Post Collab Request'}
          </button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

const StudentFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSubFilter, setActiveSubFilter] = useState('Closing Soon');
  const [selectedItem, setSelectedItem] = useState(null);
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Reset sub-filter to default whenever the user switches to Events/Recruitment
  const selectFilter = (f) => {
    setActiveFilter(f);
    if (SUB_FILTERED_TABS.has(f)) setActiveSubFilter('Closing Soon');
  };

  const user = getUser() || {};
  const myId = String(user._id || '');

  const deleteCollab = async (postId) => {
    try {
      const token = getToken();
      await axios.delete(`${API}/api/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.filter(p => p._id !== postId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Delete failed', err);
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  useEffect(() => {
    const token = getToken();
    axios.get(`${API}/api/posts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setPosts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCollabPosted = (raw) => {
    const shaped = {
      _id: raw._id,
      type: 'collab',
      title: raw.title,
      description: raw.body,
      tag: raw.tag,
      createdAt: raw.createdAt,
      communityName: null,
      communityId: null,
      authorName: raw.author ? `${raw.author.firstName} ${raw.author.lastName}` : getUser()?.name || 'You',
      authorId: raw.author?._id || null,
      skills: raw.skills || [],
    };
    setPosts(prev => [shaped, ...prev]);
  };

  const byTab = posts.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Events') return p.type === 'event';
    if (activeFilter === 'Recruitment') return p.type === 'recruitment';
    if (activeFilter === 'General') return p.type === 'general';
    if (activeFilter === 'Collabs') return p.type === 'collab';
    return true;
  });

  // Sub-filter only applies to Events/Recruitment tabs.
  // Backend already returns a sensible default order, so for tabs without a
  // sub-filter we just pass it through.
  const filtered = (() => {
    if (!SUB_FILTERED_TABS.has(activeFilter)) return byTab;

    const active = byTab.filter(p => !p.isExpired);
    const expired = byTab.filter(p => p.isExpired);

    if (activeSubFilter === 'Past') {
      return [...expired].sort(
        (a, b) => new Date(b.registrationDeadline) - new Date(a.registrationDeadline)
      );
    }
    if (activeSubFilter === 'New') {
      return [...active].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    // 'Closing Soon' (default): active posts by soonest deadline first.
    // Active posts without a deadline (rare) sort to the end.
    return [...active].sort((a, b) => {
      const ad = a.registrationDeadline ? new Date(a.registrationDeadline).getTime() : Infinity;
      const bd = b.registrationDeadline ? new Date(b.registrationDeadline).getTime() : Infinity;
      return ad - bd;
    });
  })();

  return (
    <main className="flex-1 min-w-0 border-r border-white/5 bg-black">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-6 pb-2 border-b border-white/5">
        <div className="flex items-center justify-between mb-4 px-6">
          <div>
            <h1 className="text-xl font-bold text-white">
              Welcome back, {user.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-sm text-gray-500">Here's what's happening on campus today.</p>
          </div>
          <button className="lg:hidden p-2 bg-white/5 rounded-full text-white">
            <Search size={20} />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 px-6 mb-4">
          {FILTERS.map(f => (
            <button key={f} onClick={() => selectFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeFilter === f
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Sub-filter row â€” only for Events / Recruitment */}
        {SUB_FILTERED_TABS.has(activeFilter) && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-6 mb-4">
            {SUB_FILTERS.map(s => (
              <button key={s} onClick={() => setActiveSubFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  activeSubFilter === s
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
                    : 'bg-transparent text-gray-500 border-white/10 hover:text-gray-300 hover:border-white/20'
                }`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Create Collab Bar */}
        <div className="px-6 mb-2">
          <div onClick={() => setCollabModalOpen(true)}
            className="bg-[#121212] border border-white/10 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-purple-500/40 hover:bg-white/[0.02] transition-colors group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shrink-0">
              {user.name?.[0] || 'S'}
            </div>
            <div className="flex-1 text-gray-500 text-sm font-medium group-hover:text-gray-400 transition-colors">
              Couldn't find your people in any community? Start a general collab
            </div>
            <button onClick={(e) => { e.stopPropagation(); setCollabModalOpen(true); }}
              className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors shrink-0">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="p-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
            <Loader size={20} className="animate-spin" />
            <span>Loading feedâ€¦</span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {filtered.map(item => (
            item.type === 'collab' ? (
              // COLLAB CARD
              <motion.div key={item._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f0f12] border border-l-4 border-white/5 border-l-purple-500 rounded-xl p-5 hover:bg-white/5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-200">{item.communityName}</h3>
                      <p className="text-xs text-gray-500">{item.authorName} â€¢ {timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-600 border border-gray-800 px-2 py-1 rounded">Collab</span>
                    {item.authorId && String(item.authorId) === myId && (
                      <button
                        onClick={() => setDeleteTargetId(item._id)}
                        title="Delete this collab"
                        className="p-1.5 rounded hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {deleteTargetId === item._id && (
                  <div className="mb-3 pl-[52px] flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                    <span className="text-xs text-red-200 flex-1">Delete this collab request?</span>
                    <button
                      onClick={() => deleteCollab(item._id)}
                      className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-medium transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(null)}
                      className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium transition-colors"
                    >
                      No
                    </button>
                  </div>
                )}
                <p className="text-gray-200 text-sm font-semibold mb-1 pl-[52px]">{item.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3 pl-[52px] whitespace-pre-wrap">{item.description}</p>
                {item.skills?.length > 0 && (
                  <div className="pl-[52px] flex flex-wrap gap-1.5 mb-4">
                    {item.skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-300 text-[10px] font-medium">{s}</span>
                    ))}
                  </div>
                )}
                <div className="pl-[52px] flex justify-end">
                  <button onClick={() => setSelectedItem(item)}
                    className="px-4 py-2 bg-purple-600/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2">
                    <Users size={14} />
                    <span>Connect</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              // EVENT / RECRUITMENT / GENERAL CARD
              <motion.div key={item._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300">

                {/* Gradient header (replaces image) */}
                <div className={`h-32 w-full bg-gradient-to-br ${TAG_GRADIENTS[item.tag] || TAG_GRADIENTS.Other} relative flex items-end p-4`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="text-2xl">{item.clubLogo || 'ðŸ†'}</span>
                    <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{item.clubName}</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                    {item.tag || item.type}
                  </div>
                </div>

                <div className="p-6 pt-4">
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-400 transition-colors text-gray-200">
                      {item.title}
                    </h3>
                    {item.isPaid && (
                      <span className="px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/30 whitespace-nowrap">
                        â‚¹{item.amount} Â· PAID
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{item.description}</p>

                  {/* Dates */}
                  {item.type === 'event' && (item.eventDate || item.registrationDeadline) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs">
                      {item.eventDate && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Calendar size={12} className="text-indigo-400" />
                          <span className="text-gray-500">Event:</span>
                          <span className="font-medium text-gray-200">{formatDateTime(item.eventDate)}</span>
                        </div>
                      )}
                      {item.registrationDeadline && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock size={12} className={isPast(item.registrationDeadline) ? 'text-gray-600' : 'text-amber-400'} />
                          <span className="text-gray-500">Register by:</span>
                          <span className={`font-medium ${isPast(item.registrationDeadline) ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                            {formatDateTime(item.registrationDeadline)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {item.type === 'recruitment' && item.registrationDeadline && (
                    <div className="flex items-center gap-1.5 mb-4 text-xs">
                      <Clock size={12} className={isPast(item.registrationDeadline) ? 'text-gray-600' : 'text-amber-400'} />
                      <span className="text-gray-500">Apply by:</span>
                      <span className={`font-medium ${isPast(item.registrationDeadline) ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                        {formatDateTime(item.registrationDeadline)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={14} />
                      <span>{item.location || 'Campus'}</span>
                    </div>

                    {/* Event button states */}
                    {item.type === 'event' && item.myRegistrationStatus === 'pending_verification' && (
                      <span className="px-4 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-1.5 cursor-not-allowed">
                        <Clock size={13} /> Verification Pending
                      </span>
                    )}
                    {item.type === 'event' && item.alreadyRegistered && item.myRegistrationStatus !== 'pending_verification' && (
                      <span className="px-4 py-2 text-xs font-medium text-gray-400 bg-zinc-800 border border-white/10 rounded-lg flex items-center gap-1.5 cursor-not-allowed">
                        <CheckCircle size={13} /> Already Registered
                      </span>
                    )}
                    {item.type === 'event' && !item.alreadyRegistered && item.isExpired && (
                      <span className="px-4 py-2 text-xs font-medium text-gray-500 bg-zinc-900 border border-white/10 rounded-lg cursor-not-allowed select-none">
                        Registration Closed
                      </span>
                    )}
                    {item.type === 'event' && !item.alreadyRegistered && !item.isExpired && (
                      <button onClick={() => setSelectedItem(item)}
                        className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                        Register Now
                      </button>
                    )}

                    {/* Recruitment button states */}
                    {item.type === 'recruitment' && item.isActive && !item.isExpired && (
                      <button onClick={() => setSelectedItem(item)}
                        className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                        Apply Now
                      </button>
                    )}
                    {item.type === 'recruitment' && (item.isExpired || !item.isActive) && (
                      <span className="px-4 py-2 text-xs font-medium text-gray-500 bg-zinc-900 border border-white/10 rounded-lg cursor-not-allowed select-none">
                        Registration Closed
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Filter size={24} />
            </div>
            <p>No posts in this category.</p>
          </div>
        )}
      </div>

      <ActionModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} item={selectedItem} />
      <AnimatePresence>
        {collabModalOpen && (
          <GeneralCollabModal onClose={() => setCollabModalOpen(false)} onPosted={handleCollabPosted} />
        )}
      </AnimatePresence>
    </main>
  );
};

export default StudentFeed;
