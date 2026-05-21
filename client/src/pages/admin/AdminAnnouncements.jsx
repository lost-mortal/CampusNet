import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const DEPARTMENTS = ['COMP', 'ENTC', 'IT', 'MECH'];
const YEARS = ['FE', 'SE', 'TE', 'BE'];

const AdminAnnouncements = () => {
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'normal' });
  const [targetDepartments, setTargetDepartments] = useState([]);
  const [targetYears, setTargetYears] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  useEffect(() => {
    axios.get(`${API}/api/admin/announcements`, { headers })
      .then(r => setRecentAnnouncements(r.data))
      .catch(console.error);
  }, []);

  const handleDepartmentToggle = (dept) => {
    if (dept === 'All') {
      setTargetDepartments(targetDepartments.length === DEPARTMENTS.length ? [] : [...DEPARTMENTS]);
    } else {
      setTargetDepartments(prev =>
        prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
      );
    }
  };

  const handleYearToggle = (year) => {
    if (year === 'All') {
      setTargetYears(targetYears.length === YEARS.length ? [] : [...YEARS]);
    } else {
      setTargetYears(prev =>
        prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        targetDepartments: targetDepartments.length === DEPARTMENTS.length ? ['ALL'] : targetDepartments,
        targetYears: targetYears.length === YEARS.length ? ['ALL'] : targetYears,
      };
      const res = await axios.post(`${API}/api/admin/announcements`, payload, { headers });
      setRecentAnnouncements(prev => [res.data, ...prev]);
      setFormData({ title: '', content: '', priority: 'normal' });
      setTargetDepartments([]);
      setTargetYears([]);
      setFeedback({ type: 'success', message: 'Announcement posted successfully!' });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to post announcement' });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Post Announcement
        </h1>
        <p className="text-gray-500">Create targeted announcements for students</p>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          feedback.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Announcement Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all"
                placeholder="e.g., Campus Wi-Fi Maintenance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Content <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all resize-none"
                placeholder="Enter the announcement detailsâ€¦"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Priority</label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-purple-500/30 transition-all">
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={formData.priority === 'normal'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="accent-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-300">Normal</span>
                </label>
                <label className="flex-1 flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-red-500/30 transition-all">
                  <input
                    type="radio"
                    name="priority"
                    value="high"
                    checked={formData.priority === 'high'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="accent-red-500"
                  />
                  <span className="text-sm font-medium text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} /> High
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Target Departments</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                  <input
                    type="checkbox"
                    checked={targetDepartments.length === DEPARTMENTS.length}
                    onChange={() => handleDepartmentToggle('All')}
                    className="accent-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-300">All</span>
                </label>
                {DEPARTMENTS.map(dept => (
                  <label key={dept} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={targetDepartments.includes(dept)}
                      onChange={() => handleDepartmentToggle(dept)}
                      className="accent-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-300">{dept}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Target Year</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                  <input
                    type="checkbox"
                    checked={targetYears.length === YEARS.length}
                    onChange={() => handleYearToggle('All')}
                    className="accent-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-300">All</span>
                </label>
                {YEARS.map(year => (
                  <label key={year} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={targetYears.includes(year)}
                      onChange={() => handleYearToggle(year)}
                      className="accent-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-300">{year}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl font-bold text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100"
            >
              {submitting ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
              Post Announcement
            </button>
          </form>
        </div>

        {/* Recent Announcements Preview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">ðŸ“¢</span>
            Recent Announcements
          </h3>
          {recentAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No announcements posted yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {recentAnnouncements.map((ann) => (
                <div
                  key={ann._id}
                  className={`p-4 rounded-xl border ${
                    ann.priority === 'high'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-white">{ann.title}</h4>
                    {ann.priority === 'high' && (
                      <span className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs font-bold text-red-400 shrink-0 ml-2">
                        HIGH
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{ann.body}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded">
                      <span className="text-gray-500">Depts: </span>
                      <span className="text-indigo-400 font-semibold">
                        {ann.targetDepartments?.join(', ') || 'ALL'}
                      </span>
                    </div>
                    <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded">
                      <span className="text-gray-500">Years: </span>
                      <span className="text-purple-400 font-semibold">
                        {ann.targetYears?.join(', ') || 'ALL'}
                      </span>
                    </div>
                    <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-500">
                      {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
