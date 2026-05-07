const router  = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate, authorize('teacher', 'admin'));

router.get('/schedule', ctrl.getDailySchedule);
router.get('/circles', ctrl.getMyCircles);
router.get('/circles/:circleId/students', ctrl.getCircleStudents);
router.get('/students/:studentId/history', ctrl.getStudentHistory);

router.post('/attendance',
  [
    body('appointment_id').isUUID(),
    body('session_date').isDate(),
    body('status').isIn(['present','absent','excused']),
  ],
  validate,
  ctrl.markAttendance
);

router.post('/recitation',
  [
    body('attendance_id').isUUID(),
    body('surah_from').trim().notEmpty(),
    body('surah_to').trim().notEmpty(),
    body('pages_count').isFloat({ min: 0 }),
    body('rating').isIn(['excellent','good','average','poor']),
  ],
  validate,
  ctrl.logRecitation
);

module.exports = router;
