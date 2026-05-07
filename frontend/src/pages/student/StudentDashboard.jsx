import { useFetch } from '../../hooks/useFetch';
import { studentAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import {
  CalendarDaysIcon, BookOpenIcon, ClockIcon, CheckCircleIcon,
  XCircleIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function StudentDashboard() {
  const { data: profile, loading: pLoading } = useFetch(studentAPI.getProfile);
  const { data: attendance, loading: aLoading } = useFetch(studentAPI.getAttendance);
  const { data: excuses }  = useFetch(studentAPI.getExcuses);

  if (pLoading || aLoading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="جارٍ تحميل بياناتك..." />
      </div>
    </DashboardLayout>
  );

  const recentAtt = attendance?.slice(0, 5) || [];
  const present   = attendance?.filter(a => a.status === 'present').length || 0;
  const absent    = attendance?.filter(a => a.status === 'absent').length  || 0;
  const excused   = attendance?.filter(a => a.status === 'excused').length || 0;
  const total     = attendance?.length || 0;
  const pct       = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <DashboardLayout>
      <PageHeader
        title={`أهلاً، ${profile?.full_name}`}
        subtitle={profile?.circle_name ? `حلقة ${profile.circle_name}` : 'في انتظار تعيين الحلقة'}
      />

      {/* Status banner for pending students */}
      {profile?.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex gap-3 items-start">
          <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800">طلبك قيد المراجعة</p>
            <p className="text-yellow-700 text-sm mt-0.5">ستصلك رسالة واتساب عند اتخاذ القرار. شكراً لصبرك.</p>
          </div>
        </div>
      )}

      {/* Appointment card */}
      {profile?.day && (
        <div className="card bg-gradient-to-l from-navy-800 to-navy-700 text-white mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDaysIcon className="h-6 w-6 opacity-70" />
            <span className="font-semibold">موعدك الأسبوعي</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm mt-3">
            <span className="bg-white/20 px-3 py-1.5 rounded-lg">
              يوم: {profile.day}
            </span>
            <span className="bg-white/20 px-3 py-1.5 rounded-lg">
              الوقت: {profile.start_time} – {profile.end_time}
            </span>
            <span className="bg-white/20 px-3 py-1.5 rounded-lg">
              الحلقة: {profile.circle_name}
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'نسبة الحضور', value: `${pct}%`, icon: CheckCircleIcon, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'حاضر',        value: present,    icon: CheckCircleIcon, color: 'bg-blue-50 text-blue-600' },
          { label: 'غائب',        value: absent,     icon: XCircleIcon,    color: 'bg-red-50 text-red-600' },
          { label: 'أعذار الشهر', value: `${excuses?.thisMonthCount || 0}/3`, icon: ExclamationCircleIcon, color: 'bg-orange-50 text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-800">{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Profile info + recent attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpenIcon className="h-5 w-5 text-navy-600" />
            <h3 className="font-bold text-navy-800">بيانات الدراسة</h3>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ['المسار',    <StatusBadge status={profile?.track} />],
              ['المستوى',   { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' }[profile?.study_level]],
              ['من',        profile?.memorization_from],
              ['إلى',       profile?.memorization_to],
              ['الحالة',    <StatusBadge status={profile?.status} />],
            ].map(([k, v]) => v ? (
              <div key={k} className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ) : null)}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="h-5 w-5 text-navy-600" />
            <h3 className="font-bold text-navy-800">آخر الجلسات</h3>
          </div>
          {recentAtt.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">لا توجد جلسات مسجلة بعد</p>
          ) : (
            <div className="space-y-2">
              {recentAtt.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">{a.session_date}</p>
                    {a.surah_from && (
                      <p className="text-gray-400 text-xs">{a.surah_from} → {a.surah_to} ({a.pages_count} ص)</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    {a.rating && <StatusBadge status={a.rating} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
