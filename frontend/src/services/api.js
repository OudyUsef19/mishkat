import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mishkat_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mishkat_token');
      localStorage.removeItem('mishkat_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:        ()        => api.get('/admin/stats'),
  listStudents:    (params)  => api.get('/admin/students', { params }),
  approveStudent:  (id, data)=> api.patch(`/admin/students/${id}/approve`, data),
  rejectStudent:   (id, data)=> api.patch(`/admin/students/${id}/reject`, data),
  listTeachers:    ()        => api.get('/admin/teachers'),
  createTeacher:   (data)    => api.post('/admin/teachers', data),
  listCircles:     ()        => api.get('/admin/circles'),
  createCircle:    (data)    => api.post('/admin/circles', data),
  updateCircle:    (id, data)=> api.patch(`/admin/circles/${id}`, data),
  listTimeSlots:   (cid)     => api.get(`/admin/circles/${cid}/slots`),
  createTimeSlot:  (cid, d)  => api.post(`/admin/circles/${cid}/slots`, d),
  attendanceReport:(params)  => api.get('/admin/reports/attendance', { params }),
};

// ── Teacher ───────────────────────────────────────────────────────────────────
export const teacherAPI = {
  getDailySchedule:  (date)  => api.get('/teacher/schedule', { params: { date } }),
  getMyCircles:      ()      => api.get('/teacher/circles'),
  getCircleStudents: (cid)   => api.get(`/teacher/circles/${cid}/students`),
  getStudentHistory: (sid)   => api.get(`/teacher/students/${sid}/history`),
  markAttendance:    (data)  => api.post('/teacher/attendance', data),
  logRecitation:     (data)  => api.post('/teacher/recitation', data),
};

// ── Student ───────────────────────────────────────────────────────────────────
export const studentAPI = {
  getProfile:       ()      => api.get('/student/profile'),
  getAttendance:    (p)     => api.get('/student/attendance', { params: p }),
  getRecitations:   ()      => api.get('/student/recitations'),
  getNotifications: ()      => api.get('/student/notifications'),
  getExcuses:       ()      => api.get('/student/excuses'),
  submitExcuse:     (data)  => api.post('/student/excuses', data),
};

export default api;
