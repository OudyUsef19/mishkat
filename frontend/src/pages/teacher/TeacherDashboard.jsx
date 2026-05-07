import { useFetch } from '../../hooks/useFetch';
import { teacherAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, UserGroupIcon, BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';

const TODAY = new Date().toISOString().split('T')[0];

export default function TeacherDashboard() {
  const { data: schedule, loading: sLoading } = useFetch(() => teacherAPI.getDailySchedule(TODAY));
  const { data: circles,  loading: cLoading } = useFetch(teacherAPI.getMyCircles);

  const totalStudents = circles?.reduce((s, c) => s + Number(c.student_count), 0) || 0;
  const todayCount    = schedule?.length || 0;
  const markedCount   = schedule?.filter(s => s.attendance_status).length || 0;

  return (
    <DashboardLayout>
      <PageHeader title="لوحة المعلم" subtitle={`اليوم: ${new Date().toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'حلقاتي',       value: circles?.length || 0,  icon: BookOpenIcon,     color: 'bg-blue-50 text-blue-600' },
          { label: 'إجمالي الطلاب',value: totalStudents,          icon: UserGroupIcon,    color: 'bg-emerald-50 text-emerald-600' },
          { label: 'جلسات اليوم',  value: todayCount,             icon: CalendarDaysIcon, color: 'bg-purple-50 text-purple-600' },
          { label: 'تم التسجيل',   value: `${markedCount}/${todayCount}`, icon: ClockIcon, color: 'bg-orange-50 text-orange-600' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedule preview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-navy-600" />
              <h3 className="font-bold text-navy-800">جدول اليوم</h3>
            </div>
            <Link to="/teacher/schedule" className="text-navy-600 text-sm hover:underline">عرض الكل</Link>
          </div>
          {sLoading ? <LoadingSpinner size="sm" /> : !schedule?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">لا توجد جلسات اليوم</p>
          ) : (
            <div className="space-y-2">
              {schedule.slice(0, 6).map(s => (
                <div key={s.appointment_id} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                  <div>
                    <p className="font-medium">{s.student_name}</p>
                    <p className="text-gray-400 text-xs">{s.start_time} – <StatusBadge status={s.track} /></p>
                  </div>
                  {s.attendance_status
                    ? <StatusBadge status={s.attendance_status} />
                    : <span className="text-gray-300 text-xs">لم يُسجَّل</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Circles */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-navy-600" />
              <h3 className="font-bold text-navy-800">حلقاتي</h3>
            </div>
            <Link to="/teacher/circles" className="text-navy-600 text-sm hover:underline">إدارة</Link>
          </div>
          {cLoading ? <LoadingSpinner size="sm" /> : !circles?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">لا توجد حلقات مسندة إليك</p>
          ) : (
            <div className="space-y-3">
              {circles.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-navy-800 text-sm">{c.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5"><StatusBadge status={c.track} /></p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-navy-700">{c.student_count}</p>
                    <p className="text-gray-400 text-xs">طالب</p>
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
