import React, { useState, useEffect } from 'react';
import { Search, Loader, GraduationCap } from 'lucide-react';
import api from '../../lib/api';
import ProfileModal from '../../components/ProfileModal';

const DEPT_COLORS = {
  COMP: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  ENTC: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  IT:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
  MECH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};
const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };

const AlumniDirectory = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    api.get('/api/admin/alumni')
      .then(r => setAlumni(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = alumni.filter(s => {
    const q = searchTerm.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Alumni
        </h1>
        <p className="text-gray-500">Graduated students — kept out of the active directory</p>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap size={20} className="text-indigo-400" />
            Alumni Directory
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">
              {loading ? '…' : filtered.length}
            </span>
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            >
              <option value="ALL">All Departments</option>
              <option value="COMP">COMP</option>
              <option value="ENTC">ENTC</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
            </select>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search by name, roll no or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-white placeholder-gray-600"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
            <Loader size={18} className="animate-spin" />
            <span>Loading alumni…</span>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#111] border-b border-white/10 text-gray-400 text-sm">
                  <th className="p-4 font-medium">Student</th>
                  <th className="p-4 font-medium">Roll No</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(student => (
                  <tr key={student._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <button
                        onClick={() => setProfileId(student._id)}
                        className="flex items-center gap-3 group text-left"
                      >
                        <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-lg border border-white/5">
                          {DEPT_AVATARS[student.department] || '👤'}
                        </div>
                        <span className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                          {student.firstName} {student.lastName}
                        </span>
                      </button>
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-xs">{student.rollNumber}</td>
                    <td className="p-4 text-gray-400 text-sm">{student.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 border rounded text-xs font-bold ${DEPT_COLORS[student.department] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                        {student.department}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm font-mono">{student.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-500">No alumni yet.</div>
            )}
          </div>
        )}
      </div>

      {profileId && (
        <ProfileModal type="student" id={profileId} viewOnly onClose={() => setProfileId(null)} />
      )}
    </div>
  );
};

export default AlumniDirectory;
