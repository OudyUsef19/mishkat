const { query, getClient } = require('../config/db');
const { success, error }   = require('../utils/response');

// GET /api/teacher/schedule?date=YYYY-MM-DD
const getDailySchedule = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const dayName = new Date(date)
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const dayMap = { saturday:'saturday', sunday:'sunday', monday:'monday', tuesday:'tuesday', wednesday:'wednesday' };
  const dbDay = dayMap[dayName];
  if (!dbDay) return success(res, [], 'لا توجد جلسات في هذا اليوم');

  const { rows } = await query(
    `SELECT
        a.id           AS appointment_id,
        u.id           AS student_id,
        u.full_name    AS student_name,
        u.phone        AS student_phone,
        ts.start_time, ts.end_time, ts.day,
        c.name         AS circle_name,
        c.id           AS circle_id,
        sp.track,
        sp.memorization_from, sp.memorization_to,
        att.id         AS attendance_id,
        att.status     AS attendance_status,
        r.id           AS recitation_id,
        r.rating,
        r.pages_count
     FROM appointments a
     JOIN users u        ON u.id  = a.student_id
     JOIN time_slots ts  ON ts.id = a.time_slot_id
     JOIN circles c      ON c.id  = a.circle_id
     JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN attendance att ON att.appointment_id = a.id AND att.session_date = $1
     LEFT JOIN recitations r  ON r.attendance_id = att.id
     WHERE c.teacher_id = $2
       AND ts.day = $3
       AND a.is_active = true
     ORDER BY ts.start_time`,
    [date, req.user.id, dbDay]
  );

  return success(res, rows);
};

// GET /api/teacher/circles
const getMyCircles = async (req, res) => {
  const { rows } = await query(
    `SELECT c.*, COUNT(DISTINCT a.id) AS student_count
     FROM circles c
     LEFT JOIN appointments a ON a.circle_id = c.id AND a.is_active = true
     WHERE c.teacher_id = $1 AND c.is_active = true
     GROUP BY c.id`,
    [req.user.id]
  );
  return success(res, rows);
};

// POST /api/teacher/attendance
const markAttendance = async (req, res) => {
  const { appointment_id, session_date, status, notes } = req.body;

  const { rows: [appt] } = await query(
    'SELECT student_id, circle_id FROM appointments WHERE id=$1',
    [appointment_id]
  );
  if (!appt) return error(res, 'الموعد غير موجود', 404);

  // Check monthly excuse limit (max 3)
  if (status === 'excused') {
    const monthYear = session_date.slice(0, 7);
    const { rows: [excuseCount] } = await query(
      `SELECT COUNT(*) FROM attendance
       WHERE student_id=$1 AND status='excused'
         AND TO_CHAR(session_date,'YYYY-MM')=$2`,
      [appt.student_id, monthYear]
    );
    if (Number(excuseCount.count) >= 3) {
      return error(res, 'تجاوز الطالب الحد الأقصى للأعذار (3 أعذار شهرياً)', 400);
    }
  }

  const { rows: [att] } = await query(
    `INSERT INTO attendance (appointment_id, student_id, teacher_id, circle_id, session_date, status, notes, marked_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
     ON CONFLICT (appointment_id, session_date)
     DO UPDATE SET status=EXCLUDED.status, notes=EXCLUDED.notes, marked_at=NOW()
     RETURNING *`,
    [appointment_id, appt.student_id, req.user.id, appt.circle_id, session_date, status, notes]
  );

  return success(res, att, 'تم تسجيل الحضور');
};

// POST /api/teacher/recitation
const logRecitation = async (req, res) => {
  const {
    attendance_id, surah_from, ayah_from, surah_to, ayah_to,
    pages_count, rating, teacher_notes,
  } = req.body;

  const { rows: [att] } = await query(
    'SELECT student_id, circle_id, session_date FROM attendance WHERE id=$1',
    [attendance_id]
  );
  if (!att) return error(res, 'سجل الحضور غير موجود', 404);

  const { rows: [rec] } = await query(
    `INSERT INTO recitations
       (attendance_id, student_id, teacher_id, circle_id, session_date,
        surah_from, ayah_from, surah_to, ayah_to, pages_count, rating, teacher_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [attendance_id, att.student_id, req.user.id, att.circle_id, att.session_date,
     surah_from, ayah_from, surah_to, ayah_to, pages_count, rating, teacher_notes]
  );

  return success(res, rec, 'تم تسجيل التسميع');
};

// GET /api/teacher/students/:circleId
const getCircleStudents = async (req, res) => {
  const { circleId } = req.params;
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.phone,
            sp.track, sp.study_level, sp.memorization_from, sp.memorization_to,
            ts.start_time, ts.end_time, ts.day
     FROM appointments a
     JOIN users u        ON u.id = a.student_id
     JOIN student_profiles sp ON sp.user_id = u.id
     JOIN time_slots ts  ON ts.id = a.time_slot_id
     WHERE a.circle_id = $1 AND a.is_active = true
     ORDER BY ts.day, ts.start_time, u.full_name`,
    [circleId]
  );
  return success(res, rows);
};

// GET /api/teacher/student/:studentId/history
const getStudentHistory = async (req, res) => {
  const { studentId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const { rows } = await query(
    `SELECT r.*, a.session_date, a.status AS attendance_status
     FROM recitations r
     JOIN attendance a ON a.id = r.attendance_id
     WHERE r.student_id = $1 AND r.teacher_id = $2
     ORDER BY a.session_date DESC
     LIMIT $3 OFFSET $4`,
    [studentId, req.user.id, limit, offset]
  );
  return success(res, rows);
};

module.exports = {
  getDailySchedule,
  getMyCircles,
  markAttendance,
  logRecitation,
  getCircleStudents,
  getStudentHistory,
};
