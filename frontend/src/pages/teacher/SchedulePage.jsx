import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { teacherAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  ChevronRightIcon, ChevronLeftIcon, ClipboardDocumentCheckIcon,
  BookOpenIcon, UserIcon,
} from '@heroicons/react/24/outline';

const DAYS_AR = { saturday:'السبت',sunday:'الأحد',monday:'الاثنين',tuesday:'الثلاثاء',wednesday:'الأربعاء' };
const RATING_OPTS = [
  { value:'excellent', label:'ممتاز' },
  { value:'good',      label:'جيد' },
  { value:'average',   label:'متوسط' },
  { value:'poor',      label:'ضعيف' },
];

export default function SchedulePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: schedule, loading, refetch } = useFetch(() => teacherAPI.getDailySchedule(date), [date]);

  const [attModal,  setAttModal]  = useState(null);   // student session object
  const [recModal,  setRecModal]  = useState(null);
  const [attForm,   setAttForm]   = useState({ status:'present', notes:'' });
  const [recForm,   setRecForm]   = useState({ surah_from:'',ayah_from:'',surah_to:'',ayah_to:'',pages_count:'',rating:'good',teacher_notes:'' });
  const [saving, setSaving] = useState(false);

  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: res } = await teacherAPI.markAttendance({
        appointment_id: attModal.appointment_id,
        session_date:   date,
        ...attForm,
      });
      toast.success('تم تسجيل الحضور');
      setAttModal(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل الحضور');
    } finally {
      setSaving(false);
    }
  };

  const handleLogRecitation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teacherAPI.logRecitation({ attendance_id: recModal.attendance_id, ...recForm });
      toast.success('تم تسجيل التسميع');
      setRecModal(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل التسميع');
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = schedule?.[0]?.day ? DAYS_AR[schedule[0].day] : '';

  return (
    <DashboardLayout>
      {/* Date navigator */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="الجدول اليومي" subtitle={dayLabel} />
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <input
            type="date"
            className="form-input py-2 px-3 text-sm w-40"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button onClick={() => shiftDate(1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner text="جارٍ تحميل الجدول..." /></div>
      ) : !schedule?.length ? (
        <EmptyState title="لا توجد جلسات" subtitle="لا توجد مواعيد مسجلة لهذا اليوم" />
      ) : (
        <div className="space-y-3">
          {schedule.map((s) => (
            <div key={s.appointment_id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Student info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-navy-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-navy-800">{s.student_name}</p>
                      <StatusBadge status={s.track} />
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {s.start_time} – {s.end_time} &nbsp;·&nbsp; {s.circle_name}
                    </p>
                    {s.memorization_from && (
                      <p className="text-gray-400 text-xs mt-1">النطاق: {s.memorization_from} ← {s.memorization_to}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  {s.attendance_status ? (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.attendance_status} />
                      {s.attendance_status === 'present' && !s.recitation_id && (
                        <button
                          onClick={() => { setRecModal(s); setRecForm({ surah_from:'',ayah_from:'',surah_to:'',ayah_to:'',pages_count:'',rating:'good',teacher_notes:'' }); }}
                          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                        >
                          <BookOpenIcon className="h-4 w-4" />
                          تسجيل تسميع
                        </button>
                      )}
                      {s.recitation_id && (
                        <span className="text-emerald-600 text-xs font-medium">✓ تسميع مسجل ({s.pages_count} ص)</span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAttModal(s); setAttForm({ status:'present', notes:'' }); }}
                      className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                    >
                      <ClipboardDocumentCheckIcon className="h-4 w-4" />
                      تسجيل الحضور
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Modal */}
      <Modal open={!!attModal} onClose={() => setAttModal(null)} title={`تسجيل حضور – ${attModal?.student_name}`}>
        <form onSubmit={handleMarkAttendance} className="space-y-4">
          <div>
            <label className="form-label">الحالة</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[['present','حاضر','emerald'],['absent','غائب','red'],['excused','معذور','orange']].map(([val,lbl,col]) => (
                <label key={val} className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${attForm.status===val ? `border-${col}-500 bg-${col}-50` : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="att_status" value={val} checked={attForm.status===val} onChange={() => setAttForm(f=>({...f,status:val}))} className="hidden" />
                  <span className={`text-sm font-medium ${attForm.status===val ? `text-${col}-700` : 'text-gray-600'}`}>{lbl}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">ملاحظات (اختياري)</label>
            <textarea className="form-input" rows={3} value={attForm.notes} onChange={e=>setAttForm(f=>({...f,notes:e.target.value}))} placeholder="أي ملاحظات إضافية..." />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
            <button type="button" onClick={() => setAttModal(null)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Recitation Modal */}
      <Modal open={!!recModal} onClose={() => setRecModal(null)} title={`تسجيل تسميع – ${recModal?.student_name}`} size="lg">
        <form onSubmit={handleLogRecitation} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">من سورة <span className="text-red-500">*</span></label>
              <input className="form-input" value={recForm.surah_from} onChange={e=>setRecForm(f=>({...f,surah_from:e.target.value}))} required placeholder="مثال: البقرة" />
            </div>
            <div>
              <label className="form-label">الآية من</label>
              <input type="number" className="form-input" value={recForm.ayah_from} onChange={e=>setRecForm(f=>({...f,ayah_from:e.target.value}))} placeholder="1" />
            </div>
            <div>
              <label className="form-label">إلى سورة <span className="text-red-500">*</span></label>
              <input className="form-input" value={recForm.surah_to} onChange={e=>setRecForm(f=>({...f,surah_to:e.target.value}))} required placeholder="مثال: البقرة" />
            </div>
            <div>
              <label className="form-label">الآية إلى</label>
              <input type="number" className="form-input" value={recForm.ayah_to} onChange={e=>setRecForm(f=>({...f,ayah_to:e.target.value}))} placeholder="10" />
            </div>
            <div>
              <label className="form-label">عدد الصفحات <span className="text-red-500">*</span></label>
              <input type="number" step="0.5" min="0" className="form-input" value={recForm.pages_count} onChange={e=>setRecForm(f=>({...f,pages_count:e.target.value}))} required placeholder="0.5" />
            </div>
            <div>
              <label className="form-label">التقييم <span className="text-red-500">*</span></label>
              <select className="form-input" value={recForm.rating} onChange={e=>setRecForm(f=>({...f,rating:e.target.value}))}>
                {RATING_OPTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">ملاحظات المعلم</label>
              <textarea className="form-input" rows={3} value={recForm.teacher_notes} onChange={e=>setRecForm(f=>({...f,teacher_notes:e.target.value}))} placeholder="ملاحظات أو توجيهات للطالب..." />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'جارٍ الحفظ...' : 'حفظ التسميع'}</button>
            <button type="button" onClick={() => setRecModal(null)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
