import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { adminAPI } from '../../services/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function TeachersPage() {
  const { data: teachers, loading, refetch } = useFetch(adminAPI.listTeachers);
  const [modal, setModal]   = useState(false);
  const [form,  setForm]    = useState({ full_name:'', phone:'', email:'', password:'' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.createTeacher(form);
      toast.success('تم إنشاء حساب المعلم');
      setModal(false);
      setForm({ full_name:'', phone:'', email:'', password:'' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إنشاء الحساب');
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="المعلمون"
        subtitle={`${teachers?.length || 0} معلم`}
        action={
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            معلم جديد
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : !teachers?.length ? (
        <EmptyState title="لا يوجد معلمون" subtitle="أضف معلمك الأول" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center text-navy-700 font-bold text-lg">
                  {t.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-navy-800">{t.full_name}</h3>
                  <p className="text-gray-500 text-sm">{t.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpenIcon className="h-4 w-4" />
                <span>{t.circle_count} حلقة</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="إنشاء حساب معلم">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label">الاسم الكامل <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} required />
          </div>
          <div>
            <label className="form-label">رقم الهاتف <span className="text-red-500">*</span></label>
            <input className="form-input" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} required dir="ltr" />
          </div>
          <div>
            <label className="form-label">البريد الإلكتروني</label>
            <input className="form-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} dir="ltr" />
          </div>
          <div>
            <label className="form-label">كلمة المرور <span className="text-red-500">*</span></label>
            <input className="form-input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required minLength={8} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'جارٍ...' : 'إنشاء الحساب'}</button>
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
