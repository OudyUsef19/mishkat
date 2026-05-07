const bcrypt  = require('bcrypt');
const { query, getClient } = require('../config/db');
const { success, error, paginate } = require('../utils/response');
const notificationService = require('../services/notification.service');

// ── DASHBOARD STATS ──────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  const [students, teachers, circles, pendingStudents, attendanceToday] = await Promise.all([
    query("SELECT COUNT(*) FROM users WHERE role='student' AND status='active'"),
    query("SELECT COUNT(*) FROM users WHERE role='teacher' AND status='active'"),
    query("SELECT COUNT(*) FROM circles WHERE is_active=true"),
    query("SELECT COUNT(*) FROM users WHERE role='student' AND status='pending'"),
    query("SELECT COUNT(*) FROM attendance WHERE session_date = CURRENT_DATE"),
  ]);

  const { rows: ratingRows } = await query(
    `SELECT rating, COUNT(*) as cnt
     FROM recitations
     WHERE session_date >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY rating`
  );

  const { rows: attendanceStats } = await query(
    `SELECT status, COUNT(*) as cnt
     FROM attendance
     WHERE session_date >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY status`
  );

  return success(res, {
    students:       Number(students.rows[0].count),
    teachers:       Number(teachers.rows[0].count),
    circles:        Number(circles.rows[0].count),
    pendingStudents:Number(pendingStudents.rows[0].count),
    attendanceToday:Number(attendanceToday.rows[0].count),
    ratings:        ratingRows,
    attendanceStats:attendanceStats,
  });
};

// ── STUDENTS ─────────────────────────────────────────────────────────────────

const listStudents = async (req, res) => {
  const { page = 1, limit = 20, status, track, search } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE u.role = 'student'";
  const params = [];

  if (status) { params.push(status); where += ` AND u.status = $${params.length}`; }
  if (track)  { params.push(track);  where += ` AND sp.track = $${params.length}`; }
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (u.full_name ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
  }

  const countSql = `SELECT COUNT(*) FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id ${where}`;
  const dataSql  = `
    SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
           sp.study_level, sp.track, sp.memorization_from, sp.memorization_to,
           sp.preferred_time_slot, sp.approved_at,
           ap_u.full_name AS approved_by_name
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN users ap_u ON ap_u.id = sp.approved_by
    ${where}
    ORDER BY u.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const [countRes, dataRes] = await Promise.all([
    query(countSql, params),
    query(dataSql, [...params, limit, offset]),
  ]);

  return paginate(res, dataRes.rows, Number(countRes.rows[0].count), page, limit);
};

const approveStudent = async (req, res) => {
  const { id } = req.params;
  const { circle_id, time_slot_id } = req.body;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET status = 'active' WHERE id = $1 AND role = 'student'`,
      [id]
    );
    await client.query(
      `UPDATE student_profiles SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE user_id = $2`,
      [req.user.id, id]
    );

    if (circle_id && time_slot_id) {
      const { rows: [sem] } = await client.query('SELECT id FROM semesters WHERE is_active=true LIMIT 1');
      await client.query(
        `INSERT INTO appointments (student_id, time_slot_id, circle_id, semester_id)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [id, time_slot_id, circle_id, sem?.id]
      );
    }

    await client.query('COMMIT');

    const { rows: [user] } = await query('SELECT phone, full_name FROM users WHERE id=$1', [id]);
    notificationService.sendApprovalNotification(user).catch(() => {});

    return success(res, {}, 'تمت الموافقة على الطالب وتفعيل حسابه');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const rejectStudent = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  await query(`UPDATE users SET status='rejected' WHERE id=$1`, [id]);
  await query(`UPDATE student_profiles SET rejection_reason=$1 WHERE user_id=$2`, [reason, id]);

  const { rows: [user] } = await query('SELECT phone, full_name FROM users WHERE id=$1', [id]);
  notificationService.sendRejectionNotification(user, reason).catch(() => {});

  return success(res, {}, 'تم رفض طلب الطالب');
};

// ── TEACHERS ─────────────────────────────────────────────────────────────────

const listTeachers = async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
            COUNT(DISTINCT c.id) AS circle_count
     FROM users u
     LEFT JOIN circles c ON c.teacher_id = u.id AND c.is_active = true
     WHERE u.role = 'teacher'
     GROUP BY u.id
     ORDER BY u.full_name`
  );
  return success(res, rows);
};

const createTeacher = async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const { rows: [user] } = await query(
    `INSERT INTO users (full_name, email, phone, password_hash, role, status)
     VALUES ($1,$2,$3,$4,'teacher','active') RETURNING id, full_name, email, phone, role, status`,
    [full_name, email, phone, hash]
  );
  return success(res, user, 'تم إنشاء حساب المعلم بنجاح', 201);
};

// ── CIRCLES ──────────────────────────────────────────────────────────────────

const listCircles = async (req, res) => {
  const { rows } = await query(
    `SELECT c.*, u.full_name AS teacher_name,
            COUNT(DISTINCT a.id) AS student_count
     FROM circles c
     JOIN users u ON u.id = c.teacher_id
     LEFT JOIN appointments a ON a.circle_id = c.id AND a.is_active = true
     WHERE c.is_active = true
     GROUP BY c.id, u.full_name
     ORDER BY c.name`
  );
  return success(res, rows);
};

const createCircle = async (req, res) => {
  const { name, teacher_id, track, capacity } = req.body;
  const { rows: [sem] } = await query('SELECT id FROM semesters WHERE is_active=true LIMIT 1');
  const { rows: [circle] } = await query(
    `INSERT INTO circles (name, teacher_id, track, capacity, semester_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, teacher_id, track, capacity, sem?.id]
  );
  return success(res, circle, 'تم إنشاء الحلقة بنجاح', 201);
};

const updateCircle = async (req, res) => {
  const { id } = req.params;
  const { name, teacher_id, track, capacity, is_active } = req.body;
  const { rows: [circle] } = await query(
    `UPDATE circles SET name=COALESCE($1,name), teacher_id=COALESCE($2,teacher_id),
      track=COALESCE($3,track), capacity=COALESCE($4,capacity),
      is_active=COALESCE($5,is_active)
     WHERE id=$6 RETURNING *`,
    [name, teacher_id, track, capacity, is_active, id]
  );
  return success(res, circle, 'تم تحديث الحلقة');
};

// ── TIME SLOTS ────────────────────────────────────────────────────────────────

const listTimeSlots = async (req, res) => {
  const { circle_id } = req.params;
  const { rows } = await query(
    `SELECT ts.*, COUNT(a.id) AS booked
     FROM time_slots ts
     LEFT JOIN appointments a ON a.time_slot_id = ts.id AND a.is_active = true
     WHERE ts.circle_id = $1
     GROUP BY ts.id
     ORDER BY ts.day, ts.start_time`,
    [circle_id]
  );
  return success(res, rows);
};

const createTimeSlot = async (req, res) => {
  const { circle_id } = req.params;
  const { day, start_time, end_time } = req.body;
  const { rows: [slot] } = await query(
    `INSERT INTO time_slots (circle_id, day, start_time, end_time)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [circle_id, day, start_time, end_time]
  );
  return success(res, slot, 'تم إضافة الموعد بنجاح', 201);
};

// ── REPORTS ───────────────────────────────────────────────────────────────────

const attendanceReport = async (req, res) => {
  const { from, to, circle_id } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (from)      { params.push(from);      where += ` AND a.session_date >= $${params.length}`; }
  if (to)        { params.push(to);        where += ` AND a.session_date <= $${params.length}`; }
  if (circle_id) { params.push(circle_id); where += ` AND a.circle_id = $${params.length}`; }

  const { rows } = await query(
    `SELECT u.full_name, a.session_date, a.status, c.name AS circle_name,
            r.pages_count, r.rating
     FROM attendance a
     JOIN users u ON u.id = a.student_id
     JOIN circles c ON c.id = a.circle_id
     LEFT JOIN recitations r ON r.attendance_id = a.id
     ${where}
     ORDER BY a.session_date DESC, u.full_name`,
    params
  );
  return success(res, rows);
};

module.exports = {
  getStats, listStudents, approveStudent, rejectStudent,
  listTeachers, createTeacher,
  listCircles, createCircle, updateCircle,
  listTimeSlots, createTimeSlot,
  attendanceReport,
};
