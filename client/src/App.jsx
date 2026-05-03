import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import Search from './pages/student/Search';
import DashboardLayout from './layout/DashboardLayout';
import StudentFeed from './pages/student/StudentFeed';
import StudentProfile from './pages/student/StudentProfile';
import Announcements from './pages/student/Announcements';
import Settings from './pages/shared/Settings';
import Notifications from './pages/student/Notifications';
import ClubLayout from './layout/ClubLayout';
import ClubProfile from './pages/club/ClubProfile';
import ChannelChat from './pages/club/ChannelChat';
import EventStats from './pages/club/EventStats';
import AIInsights from './pages/club/AIInsights';
import CommunityLayout from './layout/CommunityLayout';
import AnnouncementsChannel from './pages/community/AnnouncementsChannel';
import GeneralChannel from './pages/community/GeneralChannel';
import DiscussionBoard from './pages/community/DiscussionBoard';
import PostDetail from './pages/community/PostDetail';
import CommunityCollabs from './pages/community/CommunityCollabs';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageClubs from './pages/admin/ManageClubs';
import ManageCommunities from './pages/admin/ManageCommunities';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import ManageUsers from './pages/admin/ManageUsers';
import AdminSettings from './pages/admin/AdminSettings';

function RequireAuth({ adminOnly = false }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  if (adminOnly) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'admin') return <Navigate to="/home" replace />;
    } catch {
      return <Navigate to="/" replace />;
    }
  }
  return <Outlet />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Student Dashboard Routes */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<StudentFeed />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Club Dashboard Routes */}
          <Route path="/club" element={<ErrorBoundary><ClubLayout /></ErrorBoundary>}>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat" element={<ChannelChat />} />
            <Route path="chat/:channelId" element={<ChannelChat />} />
            <Route path="profile" element={<ClubProfile />} />
            <Route path="stats/:eventId" element={<EventStats />} />
            <Route path="insights" element={<AIInsights />} />
          </Route>

          {/* Community Routes */}
          <Route path="/community/:id" element={<ErrorBoundary><CommunityLayout /></ErrorBoundary>}>
            <Route index element={<Navigate to="chat/general" replace />} />
            <Route path="chat/announcements" element={<AnnouncementsChannel />} />
            <Route path="chat/general" element={<GeneralChannel />} />
            <Route path="forum/discussions" element={<DiscussionBoard />} />
            <Route path="forum/discussions/:postId" element={<PostDetail />} />
            <Route path="collabs" element={<CommunityCollabs />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<RequireAuth adminOnly={true} />}>
          <Route path="/admin" element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="clubs" element={<ManageClubs />} />
            <Route path="communities" element={<ManageCommunities />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
