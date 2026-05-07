const jwt  = require('jsonwebtoken');
const { query } = require('../config/db');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return error(res, 'غير مصرح – يرجى تسجيل الدخول', 401);
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id, full_name, email, phone, role, status FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length) return error(res, 'المستخدم غير موجود', 401);
    if (rows[0].status === 'inactive') return error(res, 'الحساب غير نشط', 403);
    req.user = rows[0];
    next();
  } catch {
    return error(res, 'رمز التحقق غير صالح أو منتهي الصلاحية', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(res, 'ليس لديك صلاحية للوصول إلى هذا المورد', 403);
  }
  next();
};

module.exports = { authenticate, authorize };
