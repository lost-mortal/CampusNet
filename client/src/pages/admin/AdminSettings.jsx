import React, { useState } from 'react';
import { Save, Download, Shield, Database, User, Power, Lock } from 'lucide-react';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowRegistrations: true,
        adminEmail: 'admin@campusnet.edu',
        currentPassword: '',
        newPassword: ''
    });

    const handleToggle = (key) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        console.log("Saving admin profile:", settings);
        alert("Settings saved successfully!");
    };

    const handleExportData = () => {
        console.log("Exporting all data...");
        // Simulate download
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ exportDate: new Date(), ...settings }, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "campusnet_export.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Admin Settings
                </h1>
                <p className="text-gray-500">Configure system parameters and admin preferences</p>
            </div>

            <div className="max-w-4xl space-y-8">
                {/* Section 1: System Controls */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Power size={20} className="text-purple-400" />
                        System Controls
                    </h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div>
                                <h4 className="font-semibold text-white mb-1">Maintenance Mode</h4>
                                <p className="text-sm text-gray-500">Disable access for all students. Only admins can log in.</p>
                            </div>
                            <button
                                onClick={() => handleToggle('maintenanceMode')}
                                className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${settings.maintenanceMode ? 'bg-purple-500' : 'bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.maintenanceMode ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div>
                                <h4 className="font-semibold text-white mb-1">Allow New Registrations</h4>
                                <p className="text-sm text-gray-500">Enable or disable new student sign-ups.</p>
                            </div>
                            <button
                                onClick={() => handleToggle('allowRegistrations')}
                                className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${settings.allowRegistrations ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.allowRegistrations ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 2: Admin Profile */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <User size={20} className="text-indigo-400" />
                        Admin Profile
                    </h3>

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Admin Email</label>
                                <input
                                    type="email"
                                    name="adminEmail"
                                    value={settings.adminEmail}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Role/Access Level</label>
                                <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed flex items-center gap-2">
                                    <Shield size={16} /> Super Admin
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                <Lock size={14} /> Change Password
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input
                                    type="password"
                                    name="currentPassword"
                                    placeholder="Current Password"
                                    value={settings.currentPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none transition-all"
                                />
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="New Password"
                                    value={settings.newPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Section 3: Data Management */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Database size={20} className="text-blue-400" />
                        Data Management
                    </h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-white mb-1">Export System Data</h4>
                            <p className="text-sm text-gray-500">Download a full JSON dump of users, clubs, and events.</p>
                        </div>
                        <button
                            onClick={handleExportData}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-gray-300 hover:text-blue-400 rounded-xl transition-all font-medium"
                        >
                            <Download size={18} />
                            Export JSON
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
