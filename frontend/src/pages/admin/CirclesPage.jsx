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
import { PlusIcon, CalendarDaysIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const DAYS = ['saturday','sunday','monday','tuesday','wednesday'];
const DAYS_AR = { saturday:'السبت', sunday:'الأحد', monday:'الاثنين', tuesday:'الثلاثاء', wednesday:'الأربعاء' };

export default function CirclesPage() {
  const { data: circles, loading, refetch } = useFetch(adminAPI.listCircles);
  const { data: teachers } = useFetch(adminAPI.listTeachers);

  const [circleModal, setCircleModal] = useState(false);
  const [slotModal,   setSlotModal]   = useState(null);   // circle object
  const [circleForm,  setCircleForm]  = useState({ name:'', teacher_id:'', track:'hifz', capacity:10 });
  const [slotForm,    setSlotForm]    = useState({ day:'saturday', start_time:'08:00', end_time:'08:30' });
  const [saving, setSaving] = useState(false);

  const [selectedCircle, setSelectedCircle] = useState(null);
  const { data: slots, loading: slotsLoading, refetch: refetchSlots } = useFetch(
    useCallback(() => selectedCircle ? adminAPI.listTimeSlots(selectedCircle.id) : Promise.resolve({ data:{ data:[] } }), [selectedCircle])
  );

  const handleCreateCircle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.createCircle(circleForm);
      toast.success('تم إنشاء الحلقة');
      setCircleModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إنشاء الحلقة');
    } finally { setSaving(false); }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.createTimeSlot(slotModal.id, slotForm);
      toast.success('تم إضافة الموعد');
      setSlotModal(null);
      if (selectedCircle?.id === slotModal.id) refetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إضافة الموعد');
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="إدارة الحلقات"
        subtitle={`${circles?.length || 0} حلقة نشطة`}
        action={
          <button onClick={() => setCircleModal(true)} className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            حلقة جديدة
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : !circles?.length ? (
        <EmptyState title="لا توجد حلقات" subtitle="أضف حلقتك الأولى" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedCircle(c)}
              className={`card cursor-pointer transition-all hover:shadow-md ${selectedCircle?.id===c.id ? 'ring-2 ring-navy-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-navy-800">{c.name}</h3>
                  <p className="text-gray-500 text-sm">{c.teacher_name}</p>
                </div>
                <StatusBadge status={c.track} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{c.student_count}/{c.capacity}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setSlotModal(c); setSlotForm({ day:'saturday', start_time:'08:00', end_time:'08:30' }); }}
                  className="flex items-center gap-1 text-navy-600 hover:underline"
                >
                  <CalendarDaysIcon className="h-4 w-4" />
                  مواعيد
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected circle slots */}
      {selectedCircle && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-800">مواعيد حلقة: {selectedCircle.name}</h3>
            <button
              onClick={() => { setSlotModal(selectedCircle); setSlotForm({ day:'saturday', start_time:'08:00', end_time:'08:30' }); }}
              className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              إضافة موعد
            </button>
          </div>
          {slotsLoading ? <LoadingSpinner size="sm" /> : !slots?.length ? (
            <EmptyState title="لا توجد مواعيد" subtitle="أضف مواعيد لهذه الحلقة" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {DAYS.map(day => {
                const daySlots = slots.filter(s => s.day === day);
                if (!daySlots.length) return null;
                return (
                  <div key={day} className="bg-gray-50 rounded-xl p-3">
                    <p className="font-semibold text-navy-700 text-sm mb-2">{DAYS_AR[day]}</p>
                    <div className="space-y-1.5">
                      {daySlots.map(s => (
                        <div key={s.id} className={`text-xs px-2 py-1.5 rounded-lg ${Number(s.booked)>0 ? 'bg-navy-100 text-navy-700' : 'bg-white border border-gray-200 text-gray-600'}`}>
                          {s.start_time} {Number(s.booked)>0 && <span className="text-emerald-600">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Circle Modal */}
      <Modal open={circleModal} onClose={() => setCircleModal(false)} title="إنشاء حلقة جديدة">
        <form onSubmit={handleCreateCircle} className="space-y-4">
          <div>
            <label className="form-label">اسم الحلقة <span className="text-red-500">*</span></label>
            <input className="form-input" value={circleForm.name} onChange={e=>setCircleForm(f=>({...f,name:e.target.value}))} required placeholder="مثال: حلقة الفجر" />
          </div>
          <div>
            <label className="form-label">المعلم <span className="text-red-500">*</span></label>
            <select className="form-input" value={circleForm.teacher_id} onChange={e=>setCircleForm(f=>({...f,teacher_id:e.target.value}))} required>
              <option value="">اختر معلماً...</option>
              {teachers?.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">المسار</label>
              <select className="form-input" value={circleForm.track} onChange={e=>setCircleForm(f=>({...f,track:e.target.value}))}>
                <option value="hifz">حفظ</option>
                <option value="muraja3a">مراجعة</option>
              </select>
            </div>
            <div>
              <label className="form-label">الطاقة الاستيعابية</label>
              <input type="number" min={1} className="form-input" value={circleForm.capacity} onChange={e=>setCircleForm(f=>({...f,capacity:e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'جارٍ...' : 'إنشاء الحلقة'}</button>
            <button type="button" onClick={() => setCircleModal(false)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Add Slot Modal */}
      <Modal open={!!slotModal} onClose={() => setSlotModal(null)} title={`إضافة موعد – ${slotModal?.name}`}>
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div>
            <label className="form-label">اليوم <span className="text-red-500">*</span></label>
            <select className="form-input" value={slotForm.day} onChange={e=>setSlotForm(f=>({...f,day:e.target.value}))}>
              {DAYS.map(d => <option key={d} value={d}>{DAYS_AR[d]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">من <span className="text-red-500">*</span></label>
              <input type="time" className="form-input" value={slotForm.start_time} onChange={e=>setSlotForm(f=>({...f,start_time:e.target.value}))} required />
            </div>
            <div>
              <label className="form-label">إلى <span className="text-red-500">*</span></label>
              <input type="time" className="form-input" value={slotForm.end_time} onChange={e=>setSlotForm(f=>({...f,end_time:e.target.value}))} required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'جارٍ...' : 'إضافة الموعد'}</button>
            <button type="button" onClick={() => setSlotModal(null)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
