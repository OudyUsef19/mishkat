const router = require('express').Router();
const { body } = require('express-validator');
const ctrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل');

router.post('/register',
  [
    body('full_name').trim().notEmpty().withMessage('الاسم الكامل مطلوب'),
    body('phone').trim().notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    passwordRules,
    body('track').isIn(['hifz','muraja3a']).withMessage('المسار غير صحيح'),
    body('study_level').isIn(['beginner','intermediate','advanced']).withMessage('المستوى غير صحيح'),
  ],
  validate,
  ctrl.register
);

router.post('/login',
  [
    body('phone').trim().notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
  ],
  validate,
  ctrl.login
);

router.get('/me', authenticate, ctrl.me);

router.patch('/change-password',
  authenticate,
  [
    body('old_password').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
    body('new_password').isLength({ min: 8 }).withMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
