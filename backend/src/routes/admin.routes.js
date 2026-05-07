const router  = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate, authorize('admin'));

router.get('/stats', ctrl.getStats);

// Students
router.get('/students', ctrl.listStudents);
router.patch('/students/:id/approve',
  [
    body('circle_id').optional().isUUID(),
    body('time_slot_id').optional().isUUID(),
  ],
  validate,
  ctrl.approveStudent
);
router.patch('/students/:id/reject',
  [body('reason').optional().trim()],
  validate,
  ctrl.rejectStudent
);

// Teachers
router.get('/teachers', ctrl.listTeachers);
router.post('/teachers',
  [
    body('full_name').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  ctrl.createTeacher
);

// Circles
router.get('/circles', ctrl.listCircles);
router.post('/circles',
  [
    body('name').trim().notEmpty(),
    body('teacher_id').isUUID(),
    body('track').isIn(['hifz','muraja3a']),
    body('capacity').isInt({ min: 1 }),
  ],
  validate,
  ctrl.createCircle
);
router.patch('/circles/:id', ctrl.updateCircle);

// Time slots
router.get('/circles/:circle_id/slots', ctrl.listTimeSlots);
router.post('/circles/:circle_id/slots',
  [
    body('day').isIn(['saturday','sunday','monday','tuesday','wednesday']),
    body('start_time').matches(/^\d{2}:\d{2}$/),
    body('end_time').matches(/^\d{2}:\d{2}$/),
  ],
  validate,
  ctrl.createTimeSlot
);

// Reports
router.get('/reports/attendance', ctrl.attendanceReport);

module.exports = router;
