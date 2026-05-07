const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { query }   = require('../config/db');
const { success, error } = require('../utils/response');

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res) => {
  const {
    full_name, email, phone, password,
    study_level, track, memorization_from, memorization_to,
    preferred_time_slot, notes,
  } = req.body;

  const existing = await query('SELECT id FROM users WHERE phone = $1 OR email = $2', [phone, email]);
  if (existing.rows.length) {
    return error(res, 'رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل', 409);
  }

  const hash = await bcrypt.hash(password, 12);

  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');

    const { rows: [user] } = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'student', 'pending') RETURNING id, full_name, email, phone, role, status`,
      [full_name, email || null, phone, hash]
    );

    const { rows: [semester] } = await client.query(
      'SELECT id FROM semesters WHERE is_active = true LIMIT 1'
    );

    await client.query(
      `INSERT INTO student_profiles
         (user_id, study_level, track, memorization_from, memorization_to, preferred_time_slot, notes, semester_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [user.id, study_level, track, memorization_from, memorization_to,
       preferred_time_slot, notes, semester?.id || null]
    );

    await client.query('COMMIT');

    return success(res, { user }, 'تم التسجيل بنجاح، في انتظار موافقة المشرف', 201);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { phone, password } = req.body;

  const { rows } = await query(
    'SELECT id, full_name, email, phone, password_hash, role, status FROM users WHERE phone = $1',
    [phone]
  );
  if (!rows.length) return error(res, 'بيانات الدخول غير صحيحة', 401);

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return error(res, 'بيانات الدخول غير صحيحة', 401);

  if (user.status === 'pending')
    return error(res, 'حسابك قيد المراجعة، يرجى الانتظار', 403);
  if (user.status === 'rejected')
    return error(res, 'تم رفض طلبك. تواصل مع الإدارة للمزيد', 403);
  if (user.status === 'inactive')
    return error(res, 'الحساب معطل، تواصل مع الإدارة', 403);

  const token = signToken(user.id, user.role);
  delete user.password_hash;

  return success(res, { token, user }, 'تم تسجيل الدخول بنجاح');
};

// GET /api/auth/me
const me = async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.avatar_url,
            sp.study_level, sp.track, sp.memorization_from, sp.memorization_to,
            sp.preferred_time_slot, sp.approved_at
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );
  return success(res, rows[0]);
};

// PATCH /api/auth/change-password
const changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(old_password, rows[0].password_hash);
  if (!valid) return error(res, 'كلمة المرور الحالية غير صحيحة', 400);

  const hash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
  return success(res, {}, 'تم تغيير كلمة المرور بنجاح');
};

module.exports = { register, login, me, changePassword };
