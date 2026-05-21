import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Pencil, X, Plus, Loader, Crown, Tag } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';
import ImageUploadField from '../../components/ImageUploadField';

const API = import.meta.env.VITE_API_URL;

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CommunityAbout = () => {
    const { community, isManager, refreshCommunity } = useOutletContext();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: community.name,
        description: community.description || '',
        icon: community.icon || 'ðŸŒ',
        tags: community.tags || [],
        profilePhoto: community.profilePhoto || '',
        bannerImage: community.bannerImage || '',
    });
    const [tagDraft, setTagDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const openEdit = () => {
        setForm({
            name: community.name,
            description: community.description || '',
            icon: community.icon || 'ðŸŒ',
            tags: [...(community.tags || [])],
            profilePhoto: community.profilePhoto || '',
            bannerImage: community.bannerImage || '',
        });
        setTagDraft('');
        setError('');
        setEditing(true);
    };

    const addTag = () => {
        const t = tagDraft.trim();
        if (!t || form.tags.includes(t)) return;
        setForm(f => ({ ...f, tags: [...f.tags, t] }));
        setTagDraft('');
    };

    const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

    const save = async (e) => {
        e?.preventDefault?.();
        if (!form.name.trim()) {
            setError('Name is required');
            return;
        }
        const token = getToken();
        setSaving(true);
        setError('');
        try {
            await axios.patch(`${API}/api/communities/${community._id}`, {
                name: form.name.trim(),
                description: form.description.trim(),
                icon: form.icon.trim() || 'ðŸŒ',
                tags: form.tags,
                profilePhoto: form.profilePhoto,
                bannerImage: form.bannerImage,
            }, { headers: { Authorization: `Bearer ${token}` } });
            await refreshCommunity?.();
            setEditing(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="flex-1 min-w-0 bg-black text-[#e4e6eb] overflow-y-auto">
            {/* Cover */}
            <div className="relative">
                <div className="h-40 relative overflow-hidden">
                    {community.bannerImage ? (
                        <img src={community.bannerImage} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-zinc-900" />
                    )}
                </div>
                <div className="px-8 -mt-16 pb-6">
                    <div className="flex items-start gap-6 flex-wrap">
                        <div className="w-28 h-28 rounded-2xl bg-zinc-900 border-4 border-black flex items-center justify-center text-6xl shadow-2xl flex-shrink-0 overflow-hidden">
                            {community.profilePhoto
                                ? <img src={community.profilePhoto} alt={community.name} className="w-full h-full object-cover" />
                                : community.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-16">
                            <h1 className="text-3xl font-bold text-white mb-1">{community.name}</h1>
                            <p className="text-sm text-gray-400 flex flex-wrap items-center gap-3 mt-1">
                                <span className="flex items-center gap-1.5"><Users size={13} /> {community.memberCount} members</span>
                                {community.manager && (
                                    <span className="flex items-center gap-1.5">
                                        <Crown size={13} className="text-purple-400" />
                                        Managed by <span className="text-purple-300 font-medium">{community.manager.name}</span>
                                    </span>
                                )}
                            </p>
                            {community.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {community.tags.map(t => (
                                        <span key={t} className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-gray-300 text-xs border border-white/10">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {isManager && (
                            <div className="pt-16">
                                <button
                                    onClick={openEdit}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-all"
                                >
                                    <Pencil size={14} />
                                    Edit Profile
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="px-8 pb-12 space-y-6 max-w-4xl">
                <section className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">About</h2>
                    {community.description ? (
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{community.description}</p>
                    ) : (
                        <p className="text-gray-600 italic text-sm">
                            {isManager ? 'No description yet. Click Edit Profile to add one.' : 'No description yet.'}
                        </p>
                    )}
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
                            <Users size={12} /> Members
                        </div>
                        <p className="text-2xl font-bold text-white">{community.memberCount}</p>
                    </div>
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
                            <Tag size={12} /> Tags
                        </div>
                        <p className="text-2xl font-bold text-white">{community.tags?.length || 0}</p>
                    </div>
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
                            <Crown size={12} className="text-purple-400" /> Manager
                        </div>
                        <p className="text-sm font-bold text-white truncate">{community.manager?.name || 'â€”'}</p>
                        {community.manager?.rollNumber && (
                            <p className="text-xs text-gray-500 mt-0.5">{community.manager.rollNumber}</p>
                        )}
                    </div>
                </section>

                {community.recentActivity?.length > 0 && (
                    <section>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h2>
                        <div className="space-y-3">
                            {community.recentActivity.map(p => (
                                <div key={p._id} className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                                    <h3 className="text-sm font-bold text-white mb-1">{p.title}</h3>
                                    <p className="text-xs text-gray-600 mb-2">
                                        by <span className="text-gray-400">{p.authorName}</span> Â· {formatDate(p.createdAt)}
                                    </p>
                                    {p.body && <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 whitespace-pre-wrap">{p.body}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <form onSubmit={save} className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Edit Community Profile</h2>
                            <button type="button" onClick={() => setEditing(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <ImageUploadField
                                label="Banner Image"
                                value={form.bannerImage}
                                onChange={(v) => setForm(f => ({ ...f, bannerImage: v }))}
                                aspect="banner"
                            />
                            <ImageUploadField
                                label="Profile Photo"
                                value={form.profilePhoto}
                                onChange={(v) => setForm(f => ({ ...f, profilePhoto: v }))}
                            />
                            <div className="flex items-end gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Icon <span className="text-gray-600">(emoji fallback)</span></label>
                                    <input
                                        value={form.icon}
                                        onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                                        maxLength={4}
                                        className="w-20 h-20 text-4xl text-center bg-zinc-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Name</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={5}
                                    placeholder="What's this community about?"
                                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">Tags</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        value={tagDraft}
                                        onChange={e => setTagDraft(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Add a tag and press Enter"
                                        className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                    <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-sm flex items-center gap-1">
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {form.tags.map(t => (
                                        <span key={t} className="px-2.5 py-1 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-1.5">
                                            {t}
                                            <button type="button" onClick={() => removeTag(t)} className="hover:text-red-300">
                                                <X size={11} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-xs">{error}</p>}
                        </div>

                        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 p-6 flex gap-3">
                            <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !form.name.trim()}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader size={14} className="animate-spin" /> Savingâ€¦</> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
};

export default CommunityAbout;
