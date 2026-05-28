import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3, Users, CheckSquare, Megaphone, ShieldCheck, Settings,
  Briefcase, Edit3, X, Loader, GraduationCap,
} from 'lucide-react';
import api from '../lib/api';

const navItems = [
  { path: '/admin/dashboard', label: 'Analytics Dashboard', icon: BarChart3 },
  { path: '/admin/users', label: 'Manage Users', icon: Users },
  { path: '/admin/clubs', label: 'Manage Clubs', icon: Briefcase },
  { path: '/admin/communities', label: 'Manage Communities', icon: CheckSquare },
  { path: '/admin/announcements', label: 'Post Announcement', icon: Megaphone },
  { path: '/admin/alumni', label: 'Alumni', icon: GraduationCap },
];

const initialsOf = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'A';

const AdminSidebar = () => {
  const [profile, setProfile] = useState({ name: 'Campus Admin', designation: 'Campus Administrator', email: '', phone: '', bio: '' });
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    api.get('/api/admin/profile')
      .then(r => setProfile(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="w-64 h-screen bg-[#0a0a0a] border-r border-white/5 flex flex-col sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Admin Panel</h2>
            <p className="text-xs text-gray-500">Campus Management</p>
          </div>
        </div>

        {/* Admin profile card (replaces the old search bar) */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 border border-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initialsOf(profile.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-white truncate">{profile.name || 'Campus Admin'}</p>
              <button
                onClick={() => setEditOpen(true)}
                title="Edit admin profile"
                className="text-gray-500 hover:text-indigo-300 transition-colors shrink-0"
              >
                <Edit3 size={12} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{profile.designation || 'Campus Administrator'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/50 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                  : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                }`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-3 ${isActive
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Settings size={20} />
          <span className="text-sm font-medium">Settings</span>
        </NavLink>

        <div className="px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Logged in as</p>
          <p className="text-sm font-semibold text-purple-400">Campus Admin</p>
        </div>
      </div>

      {editOpen && (
        <EditProfileModal
          initial={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(p) => { setProfile(p); setEditOpen(false); }}
        />
      )}
    </div>
  );
};

const EditProfileModal = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    designation: initial.designation || '',
    bio: initial.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/api/admin/profile', form);
      onSaved(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Edit Admin Profile</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={save} className="space-y-4">
            <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Field label="Designation" value={form.designation} onChange={v => setForm(f => ({ ...f, designation: v }))} placeholder="Campus Administrator" />
            <Field label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="admin@sinhgad.edu" />
            <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+91 …" />
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">Bio</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                placeholder="Short bio (optional)"
              />
            </div>

            {error && <p className="text-rose-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader size={14} className="animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
    />
  </div>
);

export default AdminSidebar;
