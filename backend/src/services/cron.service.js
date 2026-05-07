const cron = require('node-cron');
const { query } = require('../config/db');
const notif  = require('./notification.service');
const logger = require('../utils/logger');

// Days we have sessions
const SESSION_DAYS = [0, 1, 2, 3, 6]; // Sun-Wed + Sat (JS day indices)

const getDayEnum = (jsDay) =>
  ['sunday','monday','tuesday','wednesday',null,null,'saturday'][jsDay];

// ── DAILY SCHEDULE for teachers  (runs at 06:00 on session days) ─────────────
const scheduleDailyTeacherNotifications = () => {
  const cronExpr = process.env.DAILY_SCHEDULE_CRON || '0 6 * * 0-3,6';
  cron.schedule(cronExpr, async () => {
    const today = new Date();
    const jsDay = today.getDay();
    if (!SESSION_DAYS.includes(jsDay)) return;
    const dbDay  = getDayEnum(jsDay);
    const dateStr= today.toISOString().split('T')[0];

    logger.info('Running daily schedule cron', { dbDay, dateStr });

    const { rows: teachers } = await query(
      `SELECT DISTINCT u.id, u.full_name, u.phone
       FROM circles c
       JOIN users u ON u.id = c.teacher_id
       JOIN time_slots ts ON ts.circle_id = c.id AND ts.day = $1
       WHERE c.is_active = true`,
      [dbDay]
    );

    for (const teacher of teachers) {
      const { rows: slots } = await query(
        `SELECT u.full_name AS student_name, ts.start_time, ts.end_time, sp.track
         FROM appointments a
         JOIN users u        ON u.id = a.student_id
         JOIN time_slots ts  ON ts.id = a.time_slot_id
         JOIN circles c      ON c.id = a.circle_id
         JOIN student_profiles sp ON sp.user_id = u.id
         WHERE c.teacher_id = $1 AND ts.day = $2 AND a.is_active = true
         ORDER BY ts.start_time`,
        [teacher.id, dbDay]
      );

      if (!slots.length) continue;
      const lines = slots.map((s, i) =>
        `${i + 1}. ${s.student_name} – ${s.start_time} (${s.track === 'hifz' ? 'حفظ' : 'مراجعة'})`
      ).join('\n');

      notif.sendDailyScheduleToTeacher(teacher.id, teacher.full_name, teacher.phone, lines)
        .catch(e => logger.error('Daily schedule notif failed', { teacher: teacher.id, error: e.message }));
    }
  });
  logger.info('Daily teacher schedule cron registered', { expr: cronExpr });
};

// ── SESSION REMINDERS for students (runs every hour) ─────────────────────────
const scheduleSessionReminders = () => {
  cron.schedule('0 * * * *', async () => {
    const today = new Date();
    if (!SESSION_DAYS.includes(today.getDay())) return;
    const dbDay = getDayEnum(today.getDay());

    // Find sessions starting in 30–60 min from now
    const nowTime  = today.toTimeString().slice(0, 5);
    const soonTime = new Date(today.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);

    const { rows } = await query(
      `SELECT u.id, u.full_name, u.phone, ts.start_time
       FROM appointments a
       JOIN time_slots ts ON ts.id = a.time_slot_id
       JOIN users u ON u.id = a.student_id
       WHERE ts.day = $1 AND ts.start_time > $2 AND ts.start_time <= $3
         AND a.is_active = true`,
      [dbDay, nowTime, soonTime]
    );

    for (const student of rows) {
      notif.sendSessionReminder(student.id, student.full_name, student.phone, student.start_time)
        .catch(e => logger.error('Reminder failed', { student: student.id, error: e.message }));
    }
  });
  logger.info('Session reminder cron registered');
};

const start = () => {
  scheduleDailyTeacherNotifications();
  scheduleSessionReminders();
};

module.exports = { start };
