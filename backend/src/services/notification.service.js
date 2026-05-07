const twilio = require('twilio');
const { query } = require('../config/db');
const logger   = require('../utils/logger');

let twilioClient = null;
const getTwilio = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

const sendWhatsApp = async (to, body) => {
  const client = getTwilio();
  if (!client) {
    logger.warn('Twilio not configured – WhatsApp skipped', { to });
    return;
  }
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  try {
    const msg = await client.messages.create({ from: FROM, to: formattedTo, body });
    logger.info('WhatsApp sent', { sid: msg.sid, to });
    return msg;
  } catch (err) {
    logger.error('WhatsApp send failed', { to, error: err.message });
    throw err;
  }
};

const saveNotification = async (userId, type, channel, title, body, metadata = null) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, channel, title, body, sent_at, metadata)
       VALUES ($1,$2,$3,$4,$5,NOW(),$6)`,
      [userId, type, channel, title, body, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (e) {
    logger.error('Failed to save notification', { userId, error: e.message });
  }
};

// ── PUBLIC METHODS ───────────────────────────────────────────────────────────

const sendApprovalNotification = async (user) => {
  const msg = `🎉 أهلاً ${user.full_name}!\nتمت الموافقة على تسجيلك في مقرأة مشكاة. يمكنك الآن تسجيل الدخول ومتابعة جدولك.`;
  await saveNotification(user.id, 'approval', 'whatsapp', 'تمت الموافقة على تسجيلك', msg);
  await sendWhatsApp(user.phone, msg);
};

const sendRejectionNotification = async (user, reason) => {
  const msg = `عزيزي ${user.full_name}،\nنأسف لإبلاغك أنه لم تتم الموافقة على طلب تسجيلك حالياً.\nالسبب: ${reason || 'يرجى التواصل مع الإدارة'}.`;
  await saveNotification(user.id, 'rejection', 'whatsapp', 'بشأن طلب التسجيل', msg);
  await sendWhatsApp(user.phone, msg);
};

const sendSessionReminder = async (studentId, studentName, phone, sessionTime) => {
  const msg = `⏰ تذكير: لديك جلسة تسميع في مقرأة مشكاة خلال 30 دقيقة (${sessionTime}). نتمنى لك توفيقاً!`;
  await saveNotification(studentId, 'session_reminder', 'whatsapp', 'تذكير بالجلسة القادمة', msg);
  await sendWhatsApp(phone, msg);
};

const sendDailyScheduleToTeacher = async (teacherId, teacherName, phone, scheduleText) => {
  const msg = `📋 جدول اليوم – مقرأة مشكاة\n\nأستاذ ${teacherName}،\nجدول طلابك لليوم:\n\n${scheduleText}`;
  await saveNotification(teacherId, 'daily_schedule', 'whatsapp', 'جدول اليوم', msg);
  await sendWhatsApp(phone, msg);
};

module.exports = {
  sendWhatsApp,
  sendApprovalNotification,
  sendRejectionNotification,
  sendSessionReminder,
  sendDailyScheduleToTeacher,
};
