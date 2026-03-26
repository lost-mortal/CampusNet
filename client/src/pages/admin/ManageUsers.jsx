import React, { useState } from 'react';
import { STUDENTS_LIST } from '../../data/mockData';
import { UploadCloud, Search, RefreshCw, Edit2 } from 'lucide-react';

const ManageUsers = () => {
    const [students, setStudents] = useState(STUDENTS_LIST);
    const [isDragging, setIsDragging] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            console.log("Dropped file:", files[0].name);
            // Simulate processing
            alert(`Ready to process bulk import from: ${files[0].name}`);
        }
    };

    const handleResetPassword = (studentId) => {
        console.log(`Reset password for student ID: ${studentId}`);
        alert("Password reset link sent to student email.");
    };

    const handleEditUser = (studentId) => {
        console.log(`Edit user ID: ${studentId}`);
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    User Management
                </h1>
                <p className="text-gray-500">Manage student accounts and bulk imports</p>
            </div>

            {/* Section A: Bulk Import */}
            <div
                className={`mb-10 border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all duration-300 ${isDragging
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                        : 'border-white/20 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                    <UploadCloud size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Bulk Student Import</h3>
                <p className="text-gray-400 mb-4 text-center max-w-md">
                    Drag and drop your CSV file here to automatically create accounts for new students.
                </p>
                <button className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-all">
                    Or browse files
                </button>
            </div>

            {/* Section B: Student Directory */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                {/* Table Header / Toolbar */}
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        Student Directory
                        <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">{filteredStudents.length}</span>
                    </h3>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or roll no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-white placeholder-gray-600"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-sm">
                                <th className="p-4 font-medium">Student</th>
                                <th className="p-4 font-medium">Roll No</th>
                                <th className="p-4 font-medium">Department</th>
                                <th className="p-4 font-medium">Year</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-xl">
                                                {student.avatar}
                                            </div>
                                            <span className="font-medium text-white">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-400 font-mono text-xs">{student.rollNo}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-xs font-bold">
                                            {student.department}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400">{student.year}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleResetPassword(student.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-xs font-semibold transition-all"
                                                title="Reset Password"
                                            >
                                                <RefreshCw size={12} />
                                                Reset
                                            </button>
                                            <button
                                                onClick={() => handleEditUser(student.id)}
                                                className="p-1.5 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 text-gray-300 rounded-lg transition-all"
                                                title="Edit User"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No students found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;
