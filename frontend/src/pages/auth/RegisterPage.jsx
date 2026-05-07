import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LEVELS = [
  { value: 'beginner',     label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced',     label: 'متقدم' },
];

const TRACKS = [
  { value: 'hifz',     label: 'حفظ جديد' },
  { value: 'muraja3a', label: 'مراجعة' },
];

const SLOTS = ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
               '11:00','11:30','16:00','16:30','17:00','17:30','18:00','18:30',
               '19:00','19:30','20:00','20:30'];

const INITIAL = {
  full_name: '', phone: '', email: '', password: '', confirm_password: '',
  study_level: 'beginner', track: 'hifz',
  memorization_from: '', memorization_to: '',
  preferred_time_slot: '', notes: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]     = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      return toast.error('كلمتا المرور غير متطابقتين');
    }
    setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      await authAPI.register(payload);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-navy-800 mb-3">تم التسجيل بنجاح!</h2>
        <p className="text-gray-600 mb-6">طلبك قيد المراجعة من قِبَل الإدارة. ستصلك رسالة على واتساب عند الموافقة.</p>
        <button onClick={() => navigate('/login')} className="btn-primary w-full">العودة للدخول</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 py-10 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookOpenIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">مقرأة مشكاة</h1>
          <p className="text-navy-200 mt-1 text-sm">تسجيل طالب جديد</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Section 1 – Personal */}
            <div>
              <h3 className="text-navy-800 font-bold text-base border-b border-gray-100 pb-3 mb-4">البيانات الشخصية</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label">الاسم الكامل <span className="text-red-500">*</span></label>
                  <input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} required placeholder="الاسم الرباعي" />
                </div>
                <div>
                  <label className="form-label">رقم الهاتف (واتساب) <span className="text-red-500">*</span></label>
                  <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+966XXXXXXXXX" dir="ltr" />
                </div>
                <div>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="اختياري" dir="ltr" />
                </div>
                <div>
                  <label className="form-label">كلمة المرور <span className="text-red-500">*</span></label>
                  <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} placeholder="8 أحرف على الأقل" />
                </div>
                <div>
                  <label className="form-label">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                  <input className="form-input" type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} required placeholder="أعِد كتابة كلمة المرور" />
                </div>
              </div>
            </div>

            {/* Section 2 – Study */}
            <div>
              <h3 className="text-navy-800 font-bold text-base border-b border-gray-100 pb-3 mb-4">بيانات الدراسة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">المستوى الدراسي <span className="text-red-500">*</span></label>
                  <select className="form-input" value={form.study_level} onChange={e => set('study_level', e.target.value)}>
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">المسار <span className="text-red-500">*</span></label>
                  <select className="form-input" value={form.track} onChange={e => set('track', e.target.value)}>
                    {TRACKS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">النطاق – من</label>
                  <input className="form-input" value={form.memorization_from} onChange={e => set('memorization_from', e.target.value)} placeholder="مثال: سورة الفاتحة" />
                </div>
                <div>
                  <label className="form-label">النطاق – إلى</label>
                  <input className="form-input" value={form.memorization_to} onChange={e => set('memorization_to', e.target.value)} placeholder="مثال: سورة البقرة" />
                </div>
                <div>
                  <label className="form-label">الوقت المفضل للجلسة</label>
                  <select className="form-input" value={form.preferred_time_slot} onChange={e => set('preferred_time_slot', e.target.value)}>
                    <option value="">اختر وقتاً</option>
                    {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">ملاحظات إضافية</label>
                  <textarea className="form-input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="أي معلومات تودّ إضافتها..." />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
              {loading ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التسجيل'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-navy-700 font-semibold hover:underline">سجّل دخولك</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
