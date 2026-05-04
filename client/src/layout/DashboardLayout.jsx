import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import StudentLeftSidebar from '../components/StudentLeftSidebar';
import StudentRightSidebar from '../components/StudentRightSidebar';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DashboardLayout = () => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });

  // Refresh profile from server on mount so club membership is always current
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        localStorage.setItem('user', JSON.stringify(r.data.user));
        setUser(r.data.user);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-[#e4e6eb] font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(102,126,234,0.05),transparent)]" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 blur-[100px]" />
      </div>
      <div className="flex min-h-screen relative z-10 w-full">
        <StudentLeftSidebar user={user} />
        <Outlet />
        <StudentRightSidebar />
      </div>
    </div>
  );
};

export default DashboardLayout;
