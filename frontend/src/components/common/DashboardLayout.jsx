import { useState } from 'react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" dir="rtl">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
          <div className="lg:hidden">
            <span className="font-bold text-navy-800">مقرأة مشكاة</span>
          </div>
          <div className="flex items-center gap-3 mr-auto lg:mr-0">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <BellIcon className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {user?.full_name?.charAt(0)}
              </div>
              <span className="font-medium text-gray-700">{user?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
