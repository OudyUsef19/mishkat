import { useFetch } from '../../hooks/useFetch';
import { studentAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';

export default function AttendancePage() {
  const { data, loading } = useFetch(studentAPI.getAttendance);

  const present = data?.filter(a => a.status==='present').length || 0;
  const total   = data?.length || 0;

  return (
    <DashboardLayout>
      <PageHeader title="سجل الحضور" subtitle={`${present} حضور من ${total} جلسة`} />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : !data?.length ? (
        <EmptyState title="لا توجد جلسات" subtitle="لم يتم تسجيل أي جلسات بعد" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['التاريخ','الحالة','الحلقة','من','إلى','الصفحات','التقييم','ملاحظات المعلم'].map(h => (
                    <th key={h} className="text-right py-3 px-4 text-gray-500 font-semibold text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{a.session_date}</td>
                    <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                    <td className="py-3 px-4 text-gray-600">{a.circle_name}</td>
                    <td className="py-3 px-4 text-gray-600">{a.surah_from || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{a.surah_to   || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{a.pages_count != null ? `${a.pages_count} ص` : '—'}</td>
                    <td className="py-3 px-4">{a.rating ? <StatusBadge status={a.rating} /> : '—'}</td>
                    <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{a.teacher_notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
