import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon, UsersIcon, AcademicCapIcon, CalendarDaysIcon,
  ClipboardDocumentListIcon, ChartBarIcon, BookOpenIcon,
  BellIcon, ArrowRightStartOnRectangleIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const NAV = {
  admin: [
    { to: '/admin',                icon: HomeIcon,                    label: 'لوحة التحكم' },
    { to: '/admin/students',       icon: UsersIcon,                   label: 'الطلاب' },
    { to: '/admin/teachers',       icon: AcademicCapIcon,             label: 'المعلمون' },
    { to: '/admin/circles',        icon: BookOpenIcon,                label: 'الحلقات' },
    { to: '/admin/reports',        icon: ChartBarIcon,                label: 'التقارير' },
  ],
  teacher: [
    { to: '/teacher',              icon: HomeIcon,                    label: 'لوحتي' },
    { to: '/teacher/schedule',     icon: CalendarDaysIcon,            label: 'الجدول اليومي' },
    { to: '/teacher/circles',      icon: BookOpenIcon,                label: 'حلقاتي' },
    { to: '/teacher/attendance',   icon: ClipboardDocumentListIcon,   label: 'الحضور والتسميع' },
  ],
  student: [
    { to: '/student',              icon: HomeIcon,                    label: 'صفحتي' },
    { to: '/student/attendance',   icon: ClipboardDocumentListIcon,   label: 'سجل الحضور' },
    { to: '/student/recitations',  icon: BookOpenIcon,                label: 'التسميعات' },
    { to: '/student/excuses',      icon: CalendarDaysIcon,            label: 'الأعذار' },
    { to: '/student/notifications',icon: BellIcon,                    label: 'الإشعارات' },
  ],
};

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = { admin: 'المدير', teacher: 'معلم', student: 'طالب' };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 right-0 h-full w-64 bg-navy-800 z-50 flex flex-col
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">مقرأة</p>
              <p className="text-navy-200 text-sm font-semibold">مشكاة</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-navy-300 text-xs">{roleLabel[user?.role]}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length <= 2}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/10 space-y-1">
          <NavLink to={`/${user?.role}/settings`} className="sidebar-link" onClick={onClose}>
            <Cog6ToothIcon className="h-5 w-5" />
            <span>الإعدادات</span>
          </NavLink>
          <button onClick={handleLogout} className="sidebar-link w-full text-right text-red-300 hover:text-red-200 hover:bg-red-900/30">
            <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
