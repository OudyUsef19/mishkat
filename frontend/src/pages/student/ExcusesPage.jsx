import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { studentAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ExcusesPage() {
  const { data, loading, refetch } = useFetch(studentAPI.getExcuses);
  const [modalOpen, setModalOpen]  = useState(false);
  const [form, setForm]  = useState({ session_date: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await studentAPI.submitExcuse(form);
      toast.success('تم تقديم العذر بنجاح');
      setModalOpen(false);
      setForm({ session_date: '', reason: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تقديم العذر');
    } finally {
      setSaving(false);
    }
  };

  const monthCount = data?.thisMonthCount || 0;
  const atLimit    = monthCount >= 3;

  return (
    <DashboardLayout>
      <PageHeader
        title="الأعذار"
        subtitle={`استخدمت ${monthCount} من 3 أعذار هذا الشهر`}
        action={
          <button
            onClick={() => setModalOpen(true)}
            disabled={atLimit}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4" />
            تقديم عذر
          </button>
        }
      />

      {atLimit && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex gap-3 items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">
            لقد استنفدت الحد الأقصى للأعذار هذا الشهر (3 أعذار). يتجدد العداد في بداية الشهر القادم.
          </p>
        </div>
      )}

      {/* Excuse limit indicator */}
      <div className="card mb-6">
        <p className="text-sm text-gray-500 mb-2">الأعذار المستخدمة هذا الشهر</p>
        <div className="flex gap-3">
          {[1,2,3].map(n => (
            <div
              key={n}
              className={`flex-1 h-3 rounded-full ${n <= monthCount ? 'bg-red-400' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">{monthCount} / 3 أعذار</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : !data?.excuses?.length ? (
        <EmptyState title="لا توجد أعذار" subtitle="لم تقدم أي عذر بعد" />
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['التاريخ','السبب','الحالة','وقت الإرسال'].map(h => (
                    <th key={h} className="text-right py-3 px-3 text-gray-500 font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.excuses.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-medium">{ex.session_date}</td>
                    <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{ex.reason}</td>
                    <td className="py-3 px-3">
                      <span className={ex.approved === true ? 'badge-active' : ex.approved === false ? 'badge-rejected' : 'badge-pending'}>
                        {ex.approved === true ? 'مقبول' : ex.approved === false ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-400">{new Date(ex.created_at).toLocaleDateString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="تقديم عذر غياب">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">تاريخ الجلسة <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="form-input"
              value={form.session_date}
              onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="form-label">سبب الغياب <span className="text-red-500">*</span></label>
            <textarea
              className="form-input"
              rows={4}
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="اكتب سبب غيابك..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'جارٍ الإرسال...' : 'إرسال العذر'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
