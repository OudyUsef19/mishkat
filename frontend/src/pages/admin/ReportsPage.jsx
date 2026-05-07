import { useState } from 'react';
import { adminAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const [filters, setFilters] = useState({ from:'', to:'', circle_id:'' });
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k,v) => setFilters(f => ({ ...f, [k]: v }));

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminAPI.attendanceReport(filters);
      setData(res.data.data);
    } catch {
      toast.error('فشل تحميل التقرير');
    } finally { setLoading(false); }
  };

  const downloadCSV = () => {
    if (!data?.length) return;
    const header = 'الاسم,التاريخ,الحالة,الحلقة,الصفحات,التقييم\n';
    const rows = data.map(r =>
      `"${r.full_name}","${r.session_date}","${r.status}","${r.circle_name}","${r.pages_count||''}","${r.rating||''}"`
    ).join('\n');
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='attendance_report.csv'; a.click();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="تقارير الحضور"
        action={data?.length ? (
          <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-4 w-4" />
            تنزيل CSV
          </button>
        ) : null}
      />

      {/* Filter form */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="form-label">من تاريخ</label>
            <input type="date" className="form-input w-40" value={filters.from} onChange={e=>set('from',e.target.value)} />
          </div>
          <div>
            <label className="form-label">إلى تاريخ</label>
            <input type="date" className="form-input w-40" value={filters.to} onChange={e=>set('to',e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <MagnifyingGlassIcon className="h-4 w-4" />
            {loading ? 'جارٍ البحث...' : 'بحث'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : data === null ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">اختر نطاقاً زمنياً وانقر بحث لعرض التقرير</p>
        </div>
      ) : !data.length ? (
        <EmptyState title="لا توجد نتائج" subtitle="جرب تغيير الفلاتر" />
      ) : (
        <div className="card overflow-hidden">
          <p className="text-gray-500 text-sm mb-4">{data.length} سجل</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['الاسم','التاريخ','الحالة','الحلقة','الصفحات','التقييم'].map(h => (
                    <th key={h} className="text-right py-3 px-4 text-gray-500 font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-navy-800">{r.full_name}</td>
                    <td className="py-3 px-4 text-gray-500">{r.session_date}</td>
                    <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 px-4 text-gray-600">{r.circle_name}</td>
                    <td className="py-3 px-4 text-gray-600">{r.pages_count || '—'}</td>
                    <td className="py-3 px-4">{r.rating ? <StatusBadge status={r.rating} /> : '—'}</td>
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
