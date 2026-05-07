import { useState, useCallback } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { adminAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon, CheckIcon, XMarkIcon, EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const STATUS_TABS = [
  { value: '',         label: 'الكل' },
  { value: 'pending',  label: 'بانتظار المراجعة' },
  { value: 'active',   label: 'نشط' },
  { value: 'rejected', label: 'مرفوض' },
];

export default function StudentsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);

  const { data, loading, refetch } = useFetch(
    useCallback(() => adminAPI.listStudents({ status, search, page, limit: 20 }), [status, search, page])
  );

  const [detailModal, setDetailModal] = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal,  setRejectModal]  = useState(null);
  const [approveForm,  setApproveForm]  = useState({ circle_id:'', time_slot_id:'' });
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: circles } = useFetch(adminAPI.listCircles);

  const handleApprove = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.approveStudent(approveModal.id, approveForm);
      toast.success('تمت الموافقة على الطالب');
      setApproveModal(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشلت الموافقة');
    } finally { setSaving(false); }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.rejectStudent(rejectModal.id, { reason: rejectReason });
      toast.success('تم رفض الطلب');
      setRejectModal(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الرفض');
    } finally { setSaving(false); }
  };

  const students = data?.data || [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <PageHeader title="إدارة الطلاب" subtitle={`${pagination?.total || 0} طالب`} />

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="form-input pr-9"
              placeholder="ابحث بالاسم أو الهاتف..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => { setStatus(t.value); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  status === t.value
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : !students.length ? (
        <EmptyState title="لا يوجد طلاب" subtitle="لم يتم العثور على طلاب بهذا الفلتر" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['الاسم','الهاتف','المسار','المستوى','الحالة','تاريخ التسجيل','الإجراءات'].map(h => (
                    <th key={h} className="text-right py-3 px-4 text-gray-500 font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-navy-800">{s.full_name}</p>
                      {s.email && <p className="text-gray-400 text-xs">{s.email}</p>}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{s.phone}</td>
                    <td className="py-3 px-4"><StatusBadge status={s.track} /></td>
                    <td className="py-3 px-4 text-gray-600">{{ beginner:'مبتدئ', intermediate:'متوسط', advanced:'متقدم' }[s.study_level]}</td>
                    <td className="py-3 px-4"><StatusBadge status={s.status} /></td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDetailModal(s)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="عرض">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {s.status === 'pending' && (
                          <>
                            <button onClick={() => { setApproveModal(s); setApproveForm({ circle_id:'', time_slot_id:'' }); }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="موافقة">
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setRejectModal(s); setRejectReason(''); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="رفض">
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-gray-500 text-sm">صفحة {pagination.page} من {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">السابق</button>
                <button onClick={() => setPage(p=>Math.min(pagination.pages,p+1))} disabled={page===pagination.pages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">التالي</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="تفاصيل الطالب">
        {detailModal && (
          <div className="space-y-3 text-sm">
            {[
              ['الاسم', detailModal.full_name],
              ['الهاتف', detailModal.phone],
              ['البريد', detailModal.email || '—'],
              ['المسار', <StatusBadge status={detailModal.track} />],
              ['المستوى', {beginner:'مبتدئ',intermediate:'متوسط',advanced:'متقدم'}[detailModal.study_level]],
              ['من', detailModal.memorization_from || '—'],
              ['إلى', detailModal.memorization_to  || '—'],
              ['الوقت المفضل', detailModal.preferred_time_slot || '—'],
              ['الحالة', <StatusBadge status={detailModal.status} />],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal open={!!approveModal} onClose={() => setApproveModal(null)} title={`الموافقة على – ${approveModal?.full_name}`}>
        <form onSubmit={handleApprove} className="space-y-4">
          <p className="text-gray-600 text-sm">يمكنك تعيين الطالب لحلقة وموعد الآن، أو الموافقة فقط والتعيين لاحقاً.</p>
          <div>
            <label className="form-label">الحلقة (اختياري)</label>
            <select className="form-input" value={approveForm.circle_id} onChange={e => setApproveForm(f=>({...f,circle_id:e.target.value}))}>
              <option value="">اختر حلقة...</option>
              {circles?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.track})</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-success flex-1">{saving ? 'جارٍ...' : 'تأكيد الموافقة'}</button>
            <button type="button" onClick={() => setApproveModal(null)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title={`رفض طلب – ${rejectModal?.full_name}`}>
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="form-label">سبب الرفض</label>
            <textarea className="form-input" rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="اذكر سبب الرفض لإعلام الطالب..." />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-danger flex-1">{saving ? 'جارٍ...' : 'تأكيد الرفض'}</button>
            <button type="button" onClick={() => setRejectModal(null)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
