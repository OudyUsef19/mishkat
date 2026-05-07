import { useFetch } from '../../hooks/useFetch';
import { studentAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { BellIcon } from '@heroicons/react/24/outline';

const TYPE_ICON = { approval:'✅', rejection:'❌', session_reminder:'⏰', daily_schedule:'📋', general:'ℹ️' };

export default function NotificationsPage() {
  const { data, loading } = useFetch(studentAPI.getNotifications);

  return (
    <DashboardLayout>
      <PageHeader title="الإشعارات" />
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : !data?.length ? (
        <EmptyState title="لا توجد إشعارات" subtitle="ستظهر هنا إشعاراتك" />
      ) : (
        <div className="space-y-2">
          {data.map(n => (
            <div key={n.id} className={`card transition-colors ${!n.is_read ? 'border-navy-200 bg-navy-50/50' : ''}`}>
              <div className="flex gap-4 items-start">
                <span className="text-2xl flex-shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-navy-800">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-navy-600 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-gray-600 text-sm mt-1 whitespace-pre-line">{n.body}</p>
                  <p className="text-gray-400 text-xs mt-2">{new Date(n.created_at).toLocaleString('ar-SA')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
