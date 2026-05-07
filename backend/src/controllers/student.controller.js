const { query } = require('../config/db');
const { success, error } = require('../utils/response');

// GET /api/student/profile
const getProfile = async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.avatar_url,
            sp.study_level, sp.track, sp.memorization_from, sp.memorization_to,
            sp.preferred_time_slot, sp.notes, sp.approved_at, sp.rejection_reason,
            ap_u.full_name AS approved_by_name,
            ts.day, ts.start_time, ts.end_time,
            c.name AS circle_name
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN users ap_u ON ap_u.id = sp.approved_by
     LEFT JOIN appointments a ON a.student_id = u.id AND a.is_active = true
     LEFT JOIN time_slots ts ON ts.id = a.time_slot_id
     LEFT JOIN circles c ON c.id = a.circle_id
     WHERE u.id = $1`,
    [req.user.id]
  );
  return success(res, rows[0]);
};

// GET /api/student/attendance
const getAttendance = async (req, res) => {
  const { from, to } = req.query;
  let where = 'WHERE att.student_id = $1';
  const params = [req.user.id];

  if (from) { params.push(from); where += ` AND att.session_date >= $${params.length}`; }
  if (to)   { params.push(to);   where += ` AND att.session_date <= $${params.length}`; }

  const { rows } = await query(
    `SELECT att.session_date, att.status, att.notes,
            c.name AS circle_name,
            r.surah_from, r.surah_to, r.pages_count, r.rating, r.teacher_notes
     FROM attendance att
     JOIN circles c ON c.id = att.circle_id
     LEFT JOIN recitations r ON r.attendance_id = att.id
     ${where}
     ORDER BY att.session_date DESC`,
    params
  );
  return success(res, rows);
};

// GET /api/student/excuses
const getExcuses = async (req, res) => {
  const monthYear = new Date().toISOString().slice(0, 7);
  const { rows } = await query(
    `SELECT id, session_date, reason, month_year, approved, created_at
     FROM excuses
     WHERE student_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [req.user.id]
  );

  const { rows: [countRow] } = await query(
    `SELECT COUNT(*) FROM excuses WHERE student_id=$1 AND month_year=$2`,
    [req.user.id, monthYear]
  );

  return success(res, {
    excuses: rows,
    thisMonthCount: Number(countRow.count),
    monthlyLimit: 3,
  });
};

// POST /api/student/excuses
const submitExcuse = async (req, res) => {
  const { session_date, reason } = req.body;
  const monthYear = session_date.slice(0, 7);

  const { rows: [countRow] } = await query(
    `SELECT COUNT(*) FROM excuses WHERE student_id=$1 AND month_year=$2`,
    [req.user.id, monthYear]
  );
  if (Number(countRow.count) >= 3) {
    return error(res, 'لقد استنفدت الحد الأقصى لعدد الأعذار هذا الشهر (3 أعذار)', 400);
  }

  const { rows: [excuse] } = await query(
    `INSERT INTO excuses (student_id, session_date, reason, month_year)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, session_date, reason, monthYear]
  );
  return success(res, excuse, 'تم تقديم العذر بنجاح', 201);
};

// GET /api/student/recitations
const getRecitations = async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, a.session_date, a.status AS attendance_status,
            c.name AS circle_name
     FROM recitations r
     JOIN attendance a ON a.id = r.attendance_id
     JOIN circles c ON c.id = r.circle_id
     WHERE r.student_id = $1
     ORDER BY a.session_date DESC
     LIMIT 50`,
    [req.user.id]
  );
  return success(res, rows);
};

// GET /api/student/notifications
const getNotifications = async (req, res) => {
  const { rows } = await query(
    `SELECT id, type, title, body, is_read, sent_at, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 30`,
    [req.user.id]
  );
  await query(`UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false`, [req.user.id]);
  return success(res, rows);
};

module.exports = {
  getProfile, getAttendance, getExcuses, submitExcuse, getRecitations, getNotifications,
};
