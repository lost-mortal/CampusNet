import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, Pencil, X, Loader, Check } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';
import ImageUploadField from '../../components/ImageUploadField';

const API = import.meta.env.VITE_API_URL;

const TAG_OPTIONS = ['Technical', 'Cultural', 'Sports', 'Recruitment', 'Creative', 'Other'];

function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const ClubProfile = () => {
    const { clubId, isPresident } = useOutletContext() || {};
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // edit modal
    const [showEdit, setShowEdit] = useState(false);
    const [editEmoji, setEditEmoji] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editTags, setEditTags] = useState([]);
    const [editProfilePhoto, setEditProfilePhoto] = useState('');
    const [editBanner, setEditBanner] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const fetchProfile = useCallback(async () => {
        if (!clubId) return;
        try {
            const { data } = await axios.get(`${API}/api/clubs/${clubId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setProfile(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [clubId]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const openEdit = () => {
        setEditEmoji(profile?.logoEmoji || 'ðŸ†');
        setEditDesc(profile?.description || '');
        setEditTags(profile?.tags || []);
        setEditProfilePhoto(profile?.profilePhoto || '');
        setEditBanner(profile?.bannerImage || '');
        setSaveError('');
        setShowEdit(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        try {
            await axios.patch(`${API}/api/clubs/my/profile`, {
                logoEmoji: editEmoji,
                description: editDesc,
                tags: editTags,
                profilePhoto: editProfilePhoto,
                bannerImage: editBanner,
            }, { headers: { Authorization: `Bearer ${getToken()}` } });
            setShowEdit(false);
            await fetchProfile();
        } catch (err) {
            setSaveError(err.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const toggleTag = (tag) => {
        setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    if (!clubId || loading) {
        return (
            <div className="flex items-center justify-center h-full gap-2 text-gray-500">
                <Loader size={18} className="animate-spin" /> Loadingâ€¦
            </div>
        );
    }

    if (!profile) {
        return <div className="flex items-center justify-center h-full text-gray-500">Club not found</div>;
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-8 max-w-4xl mx-auto">
                {/* Banner */}
                {profile.bannerImage && (
                    <div className="h-32 mb-4 rounded-2xl overflow-hidden border border-white/10">
                        <img src={profile.bannerImage} alt={`${profile.name} banner`} className="w-full h-full object-cover" />
                    </div>
                )}
                {/* Profile Card */}
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 mb-6 relative">
                    {isPresident && (
                        <button
                            onClick={openEdit}
                            className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 border border-white/10 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                        >
                            <Pencil size={12} />
                            Edit Profile
                        </button>
                    )}

                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-zinc-800 flex items-center justify-center text-5xl border border-white/10 flex-shrink-0 overflow-hidden">
                            {profile.profilePhoto
                                ? <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                                : profile.logoEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                                    âœ“ Verified Club
                                </span>
                                <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-sm font-medium border border-violet-500/20">
                                    {isPresident ? 'President' : 'Member'}
                                </span>
                                {(profile.tags || []).map(tag => (
                                    <span key={tag} className="px-2.5 py-1 rounded-full bg-zinc-800 text-gray-400 text-xs border border-white/5">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            {profile.description ? (
                                <p className="text-gray-400 text-sm leading-relaxed">{profile.description}</p>
                            ) : (
                                <p className="text-gray-600 text-sm italic">No description yet.{isPresident ? ' Click Edit Profile to add one.' : ''}</p>
                            )}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-8 mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Users size={15} className="text-violet-400" />
                            <span className="text-white font-semibold">{profile.memberCount}</span>
                            <span className="text-sm">members</span>
                        </div>
                        {profile.president && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <span>President:</span>
                                <span className="text-white font-medium">{profile.president.name}</span>
                                <span className="text-gray-600">Â·</span>
                                <span className="font-mono text-xs text-gray-500">{profile.president.rollNumber}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Posts */}
                {profile.recentPosts?.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4">Recent Posts</h2>
                        <div className="space-y-3">
                            {profile.recentPosts.map(post => (
                                <div key={post._id} className="bg-zinc-900/60 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
                                    {post.title && <h3 className="font-semibold text-white mb-2">{post.title}</h3>}
                                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">{post.body}</p>
                                    <p className="text-xs text-gray-600 mt-3">{timeAgo(post.createdAt)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {profile.recentPosts?.length === 0 && (
                    <div className="text-center py-12 bg-zinc-900/40 rounded-xl border border-white/5">
                        <p className="text-gray-500 text-sm">No general posts yet.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h2 className="font-bold text-white text-lg">Edit Club Profile</h2>
                            <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <ImageUploadField
                                label="Banner Image"
                                value={editBanner}
                                onChange={setEditBanner}
                                aspect="banner"
                            />
                            <ImageUploadField
                                label="Profile Photo"
                                value={editProfilePhoto}
                                onChange={setEditProfilePhoto}
                            />
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Club Emoji <span className="text-gray-600">(fallback if no profile photo)</span></label>
                                <input
                                    value={editEmoji}
                                    onChange={e => setEditEmoji(e.target.value)}
                                    placeholder="ðŸ†"
                                    className="w-24 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-2xl text-center focus:outline-none focus:border-violet-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                                <textarea
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    rows={4}
                                    placeholder="What does your club do?"
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {TAG_OPTIONS.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                                editTags.includes(tag)
                                                    ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                                                    : 'bg-zinc-800 border-white/10 text-gray-400 hover:border-white/20'
                                            }`}
                                        >
                                            {editTags.includes(tag) && <Check size={10} className="inline mr-1" />}
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader size={13} className="animate-spin" /> : null}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClubProfile;
