const router  = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate, authorize('student'));

router.get('/profile', ctrl.getProfile);
router.get('/attendance', ctrl.getAttendance);
router.get('/recitations', ctrl.getRecitations);
router.get('/notifications', ctrl.getNotifications);

router.get('/excuses', ctrl.getExcuses);
router.post('/excuses',
  [
    body('session_date').isDate().withMessage('تاريخ غير صحيح'),
    body('reason').trim().notEmpty().withMessage('سبب العذر مطلوب'),
  ],
  validate,
  ctrl.submitExcuse
);

module.exports = router;
