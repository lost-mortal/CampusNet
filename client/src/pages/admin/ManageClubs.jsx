import React, { useState } from 'react';
import { CLUBS_LIST, STUDENTS_LIST } from '../../data/mockData';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const ManageClubs = () => {
    const [clubs, setClubs] = useState(CLUBS_LIST);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClub, setEditingClub] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        logo: '',
        president: '',
        description: ''
    });

    const handleOpenForm = (club = null) => {
        if (club) {
            setEditingClub(club);
            setFormData({
                name: club.name,
                logo: club.logo,
                president: club.president,
                description: club.description
            });
        } else {
            setEditingClub(null);
            setFormData({ name: '', logo: '', president: '', description: '' });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingClub(null);
        setFormData({ name: '', logo: '', president: '', description: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingClub) {
            // Update existing club
            setClubs(clubs.map(club =>
                club.id === editingClub.id
                    ? { ...club, ...formData }
                    : club
            ));
            console.log('Updated club:', { ...editingClub, ...formData });
        } else {
            // Create new club
            const newClub = {
                id: `club_${Date.now()}`,
                ...formData,
                members: 0
            };
            setClubs([...clubs, newClub]);
            console.log('Created new club:', newClub);
        }
        handleCloseForm();
    };

    const handleDelete = (clubId) => {
        if (confirm('Are you sure you want to delete this club?')) {
            setClubs(clubs.filter(club => club.id !== clubId));
            console.log('Deleted club:', clubId);
        }
    };

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
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

            {/* Clubs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                    <div
                        key={club.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">{club.logo}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{club.name}</h3>
                                    <p className="text-sm text-gray-500">{club.members} members</p>
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
                                    onClick={() => handleDelete(club.id)}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} className="text-red-400" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{club.description}</p>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">President:</span>
                            <span className="text-purple-400 font-semibold">{club.president}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">
                                    {editingClub ? 'Edit Club' : 'Create New Club'}
                                </h2>
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
                                        required
                                        value={formData.logo}
                                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all"
                                        placeholder="e.g., 🤖"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Assign President</label>
                                    <select
                                        required
                                        value={formData.president}
                                        onChange={(e) => setFormData({ ...formData, president: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none transition-all"
                                    >
                                        <option value="" className="bg-[#0a0a0a]">Select a student...</option>
                                        {STUDENTS_LIST.map((student) => (
                                            <option key={student.id} value={student.name} className="bg-[#0a0a0a]">
                                                {student.name} ({student.year} - {student.department})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all resize-none"
                                        placeholder="Describe what the club does..."
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
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] transition-all"
                                    >
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
