import { useFetch } from '../../hooks/useFetch';
import { studentAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';

export default function RecitationsPage() {
  const { data, loading } = useFetch(studentAPI.getRecitations);
  const totalPages = data?.reduce((s,r) => s + Number(r.pages_count||0), 0).toFixed(1) || '0';

  return (
    <DashboardLayout>
      <PageHeader title="التسميعات" subtitle={`إجمالي ${totalPages} صفحة`} />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : !data?.length ? (
        <EmptyState title="لا توجد تسميعات" subtitle="لم يتم تسجيل أي تسميع بعد" />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <div key={r.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-navy-800">{r.surah_from} → {r.surah_to}</p>
                    <StatusBadge status={r.rating} />
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {r.session_date} · {r.circle_name} · {r.pages_count} صفحة
                  </p>
                  {r.teacher_notes && (
                    <p className="text-gray-400 text-xs mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      💬 {r.teacher_notes}
                    </p>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-navy-700">{r.pages_count}</p>
                  <p className="text-gray-400 text-xs">صفحة</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
