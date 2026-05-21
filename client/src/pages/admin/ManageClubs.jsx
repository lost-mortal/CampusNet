import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Loader, Users, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

// Searchable student picker â€” replaces native <select> for scalability
const StudentPicker = ({ students, value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = students.find(s => s._id === value) || null;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? students.filter(s => {
        const name = `${s.firstName} ${s.lastName}`.toLowerCase();
        const meta = `${s.year} ${s.department} ${s.rollNumber || ''}`.toLowerCase();
        const q = query.toLowerCase();
        return name.includes(q) || meta.includes(q);
      })
    : students;

  const handleSelect = (s) => {
    onChange(s._id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 w-full px-4 py-3 bg-white/5 border rounded-xl transition-all cursor-text ${
          open ? 'border-purple-500/50' : 'border-white/10'
        }`}
        onClick={() => { setOpen(true); }}
      >
        {selected && !open ? (
          <>
            <span className="flex-1 text-white text-sm">
              {selected.firstName} {selected.lastName}
              <span className="text-gray-500 ml-2 text-xs">({selected.year} Â· {selected.department})</span>
            </span>
            <button type="button" onClick={handleClear} className="text-gray-600 hover:text-gray-300 transition-colors">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <input
              autoFocus={open}
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder={selected ? `${selected.firstName} ${selected.lastName}` : 'Search by name, dept, yearâ€¦'}
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-500"
            />
            <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
          </>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl custom-scrollbar">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500">No students match</li>
          ) : (
            filtered.map(s => (
              <li
                key={s._id}
                onMouseDown={() => handleSelect(s)}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  s._id === value
                    ? 'bg-purple-600/20 text-purple-300'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{s.firstName} {s.lastName}</span>
                <span className="text-xs text-gray-500">{s.year} Â· {s.department}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

const API = import.meta.env.VITE_API_URL;

const DEPT_AVATARS = { COMP: 'ðŸ‘¨â€ðŸ’»', ENTC: 'âš¡', IT: 'ðŸ–¥ï¸', MECH: 'âš™ï¸' };

const ManageClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [formData, setFormData] = useState({ name: '', logoEmoji: '', description: '', presidentId: '' });

  const headers = { Authorization: `Bearer ${getToken()}` };

  // Build the set of student IDs already attached to any club (president or member).
  // While editing, the current president of THIS club is exempt so they stay visible
  // as the default value (and can be reselected without being filtered out).
  const assignedIds = useMemo(() => {
    const s = new Set();
    for (const c of clubs) {
      if (c.president?._id) s.add(String(c.president._id));
      for (const mid of (c.memberIds || [])) s.add(String(mid));
    }
    return s;
  }, [clubs]);

  const allowedPresidentId = editingClub?.president?._id ? String(editingClub.president._id) : null;

  // Create flow: only students not in any club (existing behavior).
  // Edit flow: only this club's own members + its current president â€” so the
  // admin reassigns the presidency from within the club.
  const eligibleStudents = editingClub
    ? (() => {
        const allowed = new Set((editingClub.memberIds || []).map(String));
        if (allowedPresidentId) allowed.add(allowedPresidentId);
        return students.filter(s => allowed.has(String(s._id)));
      })()
    : students.filter(s => !assignedIds.has(String(s._id)));

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/admin/clubs`, { headers }),
      axios.get(`${API}/api/admin/users`, { headers }),
    ]).then(([clubsRes, usersRes]) => {
      setClubs(clubsRes.data);
      setStudents(usersRes.data);
    }).catch(() => showFeedback('error', 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenForm = (club = null) => {
    if (club) {
      setEditingClub(club);
      setFormData({
        name: club.name,
        logoEmoji: club.logoEmoji,
        description: club.description,
        presidentId: club.president?._id || '',
      });
    } else {
      setEditingClub(null);
      setFormData({ name: '', logoEmoji: 'ðŸ†', description: '', presidentId: '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClub(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingClub) {
        const res = await axios.patch(`${API}/api/admin/clubs/${editingClub._id}`, formData, { headers });
        setClubs(clubs.map(c => c._id === editingClub._id ? res.data : c));
        showFeedback('success', `"${res.data.name}" updated.`);
      } else {
        const res = await axios.post(`${API}/api/admin/clubs`, formData, { headers });
        setClubs([...clubs, res.data]);
        showFeedback('success', `"${res.data.name}" created successfully.`);
      }
      handleCloseForm();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (club) => {
    if (!confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
    setDeletingId(club._id);
    try {
      await axios.delete(`${API}/api/admin/clubs/${club._id}`, { headers });
      setClubs(clubs.filter(c => c._id !== club._id));
      showFeedback('success', `"${club.name}" deleted.`);
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Manage Clubs
          </h1>
          <p className="text-gray-500">Create, edit, and manage campus clubs</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl font-bold text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] hover:scale-105 transition-all"
        >
          <Plus size={20} />
          Create New Club
        </button>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          feedback.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 py-20 justify-center">
          <Loader size={20} className="animate-spin" />
          <span>Loading clubsâ€¦</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div
              key={club._id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{club.logoEmoji}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{club.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Users size={12} />
                      {club.memberCount} member{club.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenForm(club)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all"
                  >
                    <Edit2 size={16} className="text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(club)}
                    disabled={deletingId === club._id}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all disabled:opacity-50"
                  >
                    {deletingId === club._id
                      ? <Loader size={16} className="text-red-400 animate-spin" />
                      : <Trash2 size={16} className="text-red-400" />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">{club.description || 'â€”'}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-2xl">{DEPT_AVATARS[club.president?.department] || 'ðŸ‘¤'}</span>
                <div>
                  <p className="text-xs text-gray-500">President</p>
                  <p className="text-purple-400 font-semibold text-sm">{club.president?.name || 'â€”'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{editingClub ? 'Edit Club' : 'Create New Club'}</h2>
                <button onClick={handleCloseForm} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Club Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all"
                    placeholder="e.g., Robotics Club"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Logo (Emoji)</label>
                  <input
                    type="text"
                    value={formData.logoEmoji}
                    onChange={(e) => setFormData({ ...formData, logoEmoji: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all"
                    placeholder="e.g., ðŸ¤–"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Assign President</label>
                  <StudentPicker
                    students={eligibleStudents}
                    value={formData.presidentId}
                    onChange={(id) => setFormData({ ...formData, presidentId: id })}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {editingClub
                      ? 'Pick a new president from this clubâ€™s existing members.'
                      : 'Only students who arenâ€™t already in a club are shown.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all resize-none"
                    placeholder="Describe what the club doesâ€¦"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl font-bold disabled:opacity-60 transition-all"
                  >
                    {saving && <Loader size={16} className="animate-spin" />}
                    {editingClub ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClubs;
