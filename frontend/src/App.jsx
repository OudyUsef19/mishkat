import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage   from './pages/admin/StudentsPage';
import TeachersPage   from './pages/admin/TeachersPage';
import CirclesPage    from './pages/admin/CirclesPage';
import ReportsPage    from './pages/admin/ReportsPage';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import SchedulePage     from './pages/teacher/SchedulePage';

// Student
import StudentDashboard   from './pages/student/StudentDashboard';
import AttendancePage     from './pages/student/AttendancePage';
import RecitationsPage    from './pages/student/RecitationsPage';
import ExcusesPage        from './pages/student/ExcusesPage';
import NotificationsPage  from './pages/student/NotificationsPage';

// ── Route guards ──────────────────────────────────────────────────────────────

const RequireAuth = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" text="جارٍ التحقق من الهوية..." />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const RedirectIfLoggedIn = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<RedirectIfLoggedIn><LoginPage /></RedirectIfLoggedIn>} />
        <Route path="/register" element={<RedirectIfLoggedIn><RegisterPage /></RedirectIfLoggedIn>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/students" element={<RequireAuth roles={['admin']}><StudentsPage /></RequireAuth>} />
        <Route path="/admin/teachers" element={<RequireAuth roles={['admin']}><TeachersPage /></RequireAuth>} />
        <Route path="/admin/circles"  element={<RequireAuth roles={['admin']}><CirclesPage /></RequireAuth>} />
        <Route path="/admin/reports"  element={<RequireAuth roles={['admin']}><ReportsPage /></RequireAuth>} />

        {/* Teacher */}
        <Route path="/teacher"          element={<RequireAuth roles={['teacher','admin']}><TeacherDashboard /></RequireAuth>} />
        <Route path="/teacher/schedule" element={<RequireAuth roles={['teacher','admin']}><SchedulePage /></RequireAuth>} />
        <Route path="/teacher/circles"  element={<RequireAuth roles={['teacher','admin']}><TeacherDashboard /></RequireAuth>} />
        <Route path="/teacher/attendance" element={<RequireAuth roles={['teacher','admin']}><SchedulePage /></RequireAuth>} />

        {/* Student */}
        <Route path="/student"               element={<RequireAuth roles={['student']}><StudentDashboard /></RequireAuth>} />
        <Route path="/student/attendance"    element={<RequireAuth roles={['student']}><AttendancePage /></RequireAuth>} />
        <Route path="/student/recitations"   element={<RequireAuth roles={['student']}><RecitationsPage /></RequireAuth>} />
        <Route path="/student/excuses"       element={<RequireAuth roles={['student']}><ExcusesPage /></RequireAuth>} />
        <Route path="/student/notifications" element={<RequireAuth roles={['student']}><NotificationsPage /></RequireAuth>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
