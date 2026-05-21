import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Search, RefreshCw, Loader, FileText, X, CheckCircle, AlertCircle, Ban, Trash2, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';

const DEPT_COLORS = {
  COMP: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  ENTC: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  IT:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
  MECH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const DEPT_AVATARS = { COMP: '👨‍💻', ENTC: '⚡', IT: '🖥️', MECH: '⚙️' };

const ACCEPTED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ManageUsers = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // { type: 'success'|'error', ... }
  const fileInputRef = useRef(null);

  // Row-level action modals
  const [resetTarget, setResetTarget] = useState(null);       // confirm reset password
  const [restrictTarget, setRestrictTarget] = useState(null); // restrict modal (asks for reason)
  const [deleteTarget, setDeleteTarget] = useState(null);     // delete confirm modal
  const [actionBusyId, setActionBusyId] = useState(null);     // disable all action buttons for a row
  const [toast, setToast] = useState(null);                   // { type, message }

  const flash = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const resetPassword = async (student) => {
    setActionBusyId(student._id);
    try {
      await api.post(`/api/admin/students/${student._id}/reset-password`);
      flash('success', `${student.firstName} ${student.lastName} will be asked to set a new password on next login.`);
      setResetTarget(null);
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to reset password');
    } finally {
      setActionBusyId(null);
    }
  };

  const restrictStudent = async (student, reason) => {
    if (!reason.trim()) return;
    setActionBusyId(student._id);
    try {
      await api.patch(`/api/admin/students/${student._id}/restrict`, { reason });
      setStudents(prev => prev.map(s => s._id === student._id
        ? { ...s, isRestricted: true, restrictionReason: reason }
        : s));
      flash('success', `${student.firstName} ${student.lastName} has been restricted.`);
      setRestrictTarget(null);
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to restrict');
    } finally {
      setActionBusyId(null);
    }
  };

  const unrestrictStudent = async (student) => {
    setActionBusyId(student._id);
    try {
      await api.patch(`/api/admin/students/${student._id}/unrestrict`);
      setStudents(prev => prev.map(s => s._id === student._id
        ? { ...s, isRestricted: false, restrictionReason: '' }
        : s));
      flash('success', `${student.firstName} ${student.lastName} can log in again.`);
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to unrestrict');
    } finally {
      setActionBusyId(null);
    }
  };

  const openDelete = async (student) => {
    setActionBusyId(student._id);
    try {
      const { data } = await api.get(`/api/admin/students/${student._id}/check-deletable`);
      if (!data.deletable) {
        setDeleteTarget({ student, deletable: false, reason: data.reason });
      } else {
        setDeleteTarget({ student, deletable: true });
      }
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to check');
    } finally {
      setActionBusyId(null);
    }
  };

  const confirmDelete = async (student) => {
    setActionBusyId(student._id);
    try {
      await api.delete(`/api/admin/students/${student._id}`);
      setStudents(prev => prev.filter(s => s._id !== student._id));
      flash('success', `${student.firstName} ${student.lastName}'s account has been deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to delete');
    } finally {
      setActionBusyId(null);
    }
  };

  const fetchStudents = () => {
    api.get('/api/admin/users')
      .then(r => setStudents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students.filter(s => {
    const q = searchTerm.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    return (
      fullName.includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setImportResult({ type: 'error', errors: ['Only CSV and Excel (.xlsx/.xls) files are accepted.'] });
      return;
    }
    setSelectedFile(file);
    setImportResult(null);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleBrowse = (e) => { handleFileSelect(e.target.files[0]); };

  const handleClearFile = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          // Strip the data:...;base64, prefix
          const b64 = e.target.result.split(',')[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const res = await api.post('/api/admin/import-students', { fileData });
      setImportResult({ type: 'success', count: res.data.imported });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh student table
      fetchStudents();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setImportResult({ type: 'error', errors: data.errors });
      } else {
        setImportResult({ type: 'error', errors: [data?.error || 'Import failed. Please try again.'] });
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          User Management
        </h1>
        <p className="text-gray-500">Manage student accounts and bulk imports</p>
      </div>

      {/* ── Bulk Import ── */}
      <div className="mb-10">
        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : selectedFile
              ? 'border-green-500/40 bg-green-500/5'
              : 'border-white/20 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleBrowse}
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                <FileText size={28} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">{selectedFile.name}</p>
                <p className="text-gray-500 text-sm">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs text-gray-400 transition-all"
              >
                <X size={12} /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <UploadCloud size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Bulk Student Import</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Drag & drop a <span className="text-indigo-400 font-medium">CSV or Excel</span> file, or click to browse.
                </p>
              </div>
              <div className="mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-500 text-left leading-relaxed">
                <span className="text-gray-400 font-semibold block mb-1">Required columns (in any order):</span>
                <span className="font-mono text-indigo-300">firstName · lastName · rollNumber · department · year · motherName · birthDate</span>
                <br />
                <span className="text-gray-600">department: COMP / ENTC / IT / MECH &nbsp;|&nbsp; year: FE / SE / TE / BE &nbsp;|&nbsp; birthDate: DDMMYY (e.g. 150807)</span>
              </div>
            </div>
          )}
        </div>

        {/* Import button — only shown when a file is selected */}
        {selectedFile && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100"
            >
              {importing ? <Loader size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              {importing ? 'Processing…' : 'Import Students'}
            </button>
          </div>
        )}

        {/* Result feedback */}
        {importResult && (
          <div className={`mt-5 rounded-2xl border p-5 ${
            importResult.type === 'success'
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {importResult.type === 'success' ? (
              <div className="flex items-center gap-3">
                <CheckCircle size={22} className="text-green-400 shrink-0" />
                <p className="text-green-400 font-semibold text-lg">
                  {importResult.count} student{importResult.count !== 1 ? 's' : ''} imported successfully
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle size={22} className="text-red-400 shrink-0" />
                  <p className="text-red-400 font-bold text-base">Fix these errors and re-upload</p>
                </div>
                <ul className="space-y-1 pl-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                      <span className="text-red-500 mt-0.5 shrink-0">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Student Directory (unchanged) ── */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Student Directory
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">
              {loading ? '…' : filtered.length}
            </span>
          </h3>
          <div className="relative w-full md:w-72">
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

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
            <Loader size={18} className="animate-spin" />
            <span>Loading students…</span>
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
                  <th className="p-4 font-medium">Year</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(student => (
                  <tr key={student._id} className={`hover:bg-white/5 transition-colors group ${student.isRestricted ? 'bg-amber-500/5' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-lg border border-white/5">
                          {DEPT_AVATARS[student.department] || '👤'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{student.firstName} {student.lastName}</span>
                          {student.isRestricted && (
                            <span
                              className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              title={student.restrictionReason || ''}
                            >
                              Restricted
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-xs">{student.rollNumber}</td>
                    <td className="p-4 text-gray-400 text-sm">{student.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 border rounded text-xs font-bold ${DEPT_COLORS[student.department] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                        {student.department}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{student.year}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setResetTarget(student)}
                          disabled={actionBusyId === student._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          title="Reset password — student will be forced to set a new one on next login"
                        >
                          <RefreshCw size={12} />
                          Reset Password
                        </button>
                        {student.isRestricted ? (
                          <button
                            onClick={() => unrestrictStudent(student)}
                            disabled={actionBusyId === student._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                            title={`Currently restricted: ${student.restrictionReason || 'no reason recorded'}`}
                          >
                            <ShieldCheck size={12} />
                            Unrestrict
                          </button>
                        ) : (
                          <button
                            onClick={() => setRestrictTarget(student)}
                            disabled={actionBusyId === student._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                            title="Restrict this student from logging in"
                          >
                            <Ban size={12} />
                            Restrict Access
                          </button>
                        )}
                        <button
                          onClick={() => openDelete(student)}
                          disabled={actionBusyId === student._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          title="Permanently delete this account"
                        >
                          {actionBusyId === student._id
                            ? <Loader size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                          Delete Account
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-500">No students found matching your search.</div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl flex items-center gap-2 ${
          toast.type === 'success'
            ? 'bg-green-500/15 border-green-500/30 text-green-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Reset password confirm */}
      {resetTarget && (
        <ActionModal
          icon={<RefreshCw size={18} className="text-orange-300" />}
          accent="orange"
          title="Reset Password"
          body={
            <p className="text-sm text-gray-300 leading-relaxed">
              Reset password for <span className="text-white font-semibold">{resetTarget.firstName} {resetTarget.lastName}</span>?
              They will be forced to set a new password on their next login.
            </p>
          }
          confirmLabel="Reset Password"
          onCancel={() => setResetTarget(null)}
          onConfirm={() => resetPassword(resetTarget)}
          busy={actionBusyId === resetTarget._id}
        />
      )}

      {/* Restrict modal — requires reason */}
      {restrictTarget && (
        <RestrictModal
          student={restrictTarget}
          onCancel={() => setRestrictTarget(null)}
          onConfirm={(reason) => restrictStudent(restrictTarget, reason)}
          busy={actionBusyId === restrictTarget._id}
        />
      )}

      {/* Delete modal — blocked vs. confirm */}
      {deleteTarget && !deleteTarget.deletable && (
        <ActionModal
          icon={<AlertCircle size={18} className="text-amber-300" />}
          accent="amber"
          title="Can't delete this account"
          body={
            <>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                <span className="text-white font-semibold">{deleteTarget.student.firstName} {deleteTarget.student.lastName}</span> still holds a leadership role:
              </p>
              <p className="text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-200">
                {deleteTarget.reason}
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Reassign the role first, then try again.
              </p>
            </>
          }
          confirmLabel={null}
          cancelLabel="Close"
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {deleteTarget && deleteTarget.deletable && (
        <ActionModal
          icon={<Trash2 size={18} className="text-red-300" />}
          accent="red"
          title="Delete Account"
          body={
            <p className="text-sm text-gray-300 leading-relaxed">
              Permanently delete <span className="text-white font-semibold">{deleteTarget.student.firstName} {deleteTarget.student.lastName}</span>'s account?
              This cannot be undone — their connections, applications, and registrations will all be removed.
            </p>
          }
          confirmLabel="Delete Account"
          confirmTone="red"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => confirmDelete(deleteTarget.student)}
          busy={actionBusyId === deleteTarget.student._id}
        />
      )}
    </div>
  );
};

// ── Shared confirm modal ────────────────────────────────────────────────────
const ACCENT_RING = { orange: 'border-orange-500/30', amber: 'border-amber-500/30', red: 'border-red-500/30' };
const ACCENT_BTN = {
  orange: 'from-orange-500 to-amber-500',
  amber: 'from-amber-500 to-yellow-500',
  red: 'from-red-500 to-rose-500',
};

const ActionModal = ({ icon, accent = 'orange', title, body, confirmLabel, cancelLabel = 'Cancel', confirmTone, onCancel, onConfirm, busy }) => {
  const tone = confirmTone || accent;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div className={`bg-[#0a0a0a] border ${ACCENT_RING[accent]} rounded-2xl w-full max-w-sm p-6 shadow-2xl`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full bg-white/5 border ${ACCENT_RING[accent]} flex items-center justify-center`}>
            {icon}
          </div>
          <h3 className="text-white font-bold text-lg">{title}</h3>
        </div>
        <div className="mb-6">{body}</div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          {confirmLabel && (
            <button
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 py-2 rounded-lg bg-gradient-to-r ${ACCENT_BTN[tone]} text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2`}
            >
              {busy && <Loader size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const RestrictModal = ({ student, onCancel, onConfirm, busy }) => {
  const [reason, setReason] = useState('');
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div className="bg-[#0a0a0a] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Ban size={18} className="text-amber-300" />
          </div>
          <h3 className="text-white font-bold text-lg">Restrict Access</h3>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          Block <span className="text-white font-semibold">{student.firstName} {student.lastName}</span> from logging in.
          They'll see this reason on the login screen.
        </p>
        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">
          Reason <span className="text-red-400">*</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          autoFocus
          placeholder="e.g. Pending disciplinary review by department"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none mb-5"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy || !reason.trim()}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader size={14} className="animate-spin" />}
            Restrict
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
