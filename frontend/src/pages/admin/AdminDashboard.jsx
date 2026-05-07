import { useFetch } from '../../hooks/useFetch';
import { adminAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Link } from 'react-router-dom';
import {
  UsersIcon, AcademicCapIcon, BookOpenIcon, ClockIcon,
  ExclamationCircleIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#065f46','#1e40af','#92400e','#7f1d1d'];
const RATING_AR = { excellent:'ممتاز', good:'جيد', average:'متوسط', poor:'ضعيف' };
const ATT_AR    = { present:'حاضر',   absent:'غائب', excused:'معذور' };
const ATT_COLOR = { present:'#059669', absent:'#dc2626', excused:'#d97706' };

export default function AdminDashboard() {
  const { data: stats, loading } = useFetch(adminAPI.getStats);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="جارٍ تحميل الإحصائيات..." />
      </div>
    </DashboardLayout>
  );

  const ratingData  = (stats?.ratings  || []).map(r => ({ name: RATING_AR[r.rating]  || r.rating,  value: Number(r.cnt) }));
  const attData     = (stats?.attendanceStats || []).map(a => ({ name: ATT_AR[a.status] || a.status, value: Number(a.cnt), fill: ATT_COLOR[a.status] }));

  const topStats = [
    { label:'الطلاب النشطون',      value: stats?.students,        icon: UsersIcon,             color: 'bg-blue-50 text-blue-600',    to: '/admin/students' },
    { label:'المعلمون',            value: stats?.teachers,        icon: AcademicCapIcon,       color: 'bg-emerald-50 text-emerald-600', to: '/admin/teachers' },
    { label:'الحلقات النشطة',     value: stats?.circles,         icon: BookOpenIcon,          color: 'bg-purple-50 text-purple-600',  to: '/admin/circles' },
    { label:'طلبات بانتظار مراجعة',value: stats?.pendingStudents, icon: ExclamationCircleIcon, color: 'bg-orange-50 text-orange-600',  to: '/admin/students?status=pending' },
    { label:'جلسات اليوم',         value: stats?.attendanceToday, icon: ClockIcon,             color: 'bg-red-50 text-red-600',        to: '/admin/reports' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="لوحة تحكم المدير"
        subtitle={new Date().toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        action={
          <Link to="/admin/reports" className="btn-primary flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4" />
            التقارير
          </Link>
        }
      />

      {/* Pending alert */}
      {stats?.pendingStudents > 0 && (
        <Link to="/admin/students?status=pending">
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-center gap-3 hover:bg-orange-100 transition-colors">
            <ExclamationCircleIcon className="h-6 w-6 text-orange-500" />
            <p className="text-orange-800 font-medium">
              يوجد <strong>{stats.pendingStudents}</strong> طلب تسجيل ينتظر مراجعتك
            </p>
          </div>
        </Link>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {topStats.map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="stat-card hover:shadow-md transition-shadow group">
            <div className={`stat-icon ${color} group-hover:scale-110 transition-transform`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-navy-800">{value ?? '—'}</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-tight">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance bar chart */}
        <div className="card">
          <h3 className="font-bold text-navy-800 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-navy-600" />
            الحضور (آخر 30 يوم)
          </h3>
          {attData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">لا توجد بيانات</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attData}>
                <XAxis dataKey="name" tick={{ fontFamily:'Cairo', fontSize:12 }} />
                <YAxis tick={{ fontFamily:'Cairo', fontSize:11 }} />
                <Tooltip formatter={(v) => [v, 'عدد']} />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {attData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ratings pie chart */}
        <div className="card">
          <h3 className="font-bold text-navy-800 mb-4 flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-navy-600" />
            تقييمات التسميع (آخر 30 يوم)
          </h3>
          {ratingData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">لا توجد بيانات</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ratingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {ratingData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => v} wrapperStyle={{ fontFamily:'Cairo', fontSize:12 }} />
                <Tooltip formatter={(v) => [v, 'عدد']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
