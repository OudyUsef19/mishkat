-- ============================================================
-- Maqra'at Mishkat - PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'inactive');
CREATE TYPE study_track AS ENUM ('hifz', 'muraja3a');
CREATE TYPE study_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE day_of_week AS ENUM ('saturday', 'sunday', 'monday', 'tuesday', 'wednesday');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused');
CREATE TYPE recitation_rating AS ENUM ('excellent', 'good', 'average', 'poor');
CREATE TYPE notification_type AS ENUM ('approval', 'rejection', 'session_reminder', 'daily_schedule', 'general');
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'email', 'in_app');

-- ============================================================
-- SEMESTERS
-- ============================================================

CREATE TABLE semesters (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS  (admin, teacher, student all live here)
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(30) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'student',
    status          user_status NOT NULL DEFAULT 'pending',
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STUDENT PROFILES
-- ============================================================

CREATE TABLE student_profiles (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_level          study_level NOT NULL DEFAULT 'beginner',
    track                study_track NOT NULL DEFAULT 'hifz',
    memorization_from    VARCHAR(100),   -- e.g. "Al-Fatiha" or surah/ayah ref
    memorization_to      VARCHAR(100),
    preferred_time_slot  VARCHAR(50),    -- e.g. "08:00"
    notes                TEXT,
    approved_at          TIMESTAMPTZ,
    approved_by          UUID REFERENCES users(id),
    rejection_reason     TEXT,
    semester_id          UUID REFERENCES semesters(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================
-- CIRCLES  (حلقات)
-- ============================================================

CREATE TABLE circles (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(150) NOT NULL,
    teacher_id   UUID NOT NULL REFERENCES users(id),
    track        study_track NOT NULL,
    capacity     INT NOT NULL DEFAULT 10,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    semester_id  UUID REFERENCES semesters(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TIME SLOTS  (fixed 30-min slots, Sat–Wed)
-- ============================================================

CREATE TABLE time_slots (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id    UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    day          day_of_week NOT NULL,
    start_time   TIME NOT NULL,   -- e.g. 08:00
    end_time     TIME NOT NULL,   -- e.g. 08:30
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(circle_id, day, start_time)
);

-- ============================================================
-- APPOINTMENTS  (student ↔ time slot assignment)
-- ============================================================

CREATE TABLE appointments (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id     UUID NOT NULL REFERENCES users(id),
    time_slot_id   UUID NOT NULL REFERENCES time_slots(id),
    circle_id      UUID NOT NULL REFERENCES circles(id),
    semester_id    UUID REFERENCES semesters(id),
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, time_slot_id, semester_id),
    UNIQUE(time_slot_id, student_id)   -- no double booking per slot
);

-- ============================================================
-- ATTENDANCE
-- ============================================================

CREATE TABLE attendance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id  UUID NOT NULL REFERENCES appointments(id),
    student_id      UUID NOT NULL REFERENCES users(id),
    teacher_id      UUID NOT NULL REFERENCES users(id),
    circle_id       UUID NOT NULL REFERENCES circles(id),
    session_date    DATE NOT NULL,
    status          attendance_status NOT NULL DEFAULT 'absent',
    marked_at       TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(appointment_id, session_date)
);

-- ============================================================
-- RECITATIONS  (تسميع)
-- ============================================================

CREATE TABLE recitations (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id    UUID NOT NULL REFERENCES attendance(id),
    student_id       UUID NOT NULL REFERENCES users(id),
    teacher_id       UUID NOT NULL REFERENCES users(id),
    circle_id        UUID NOT NULL REFERENCES circles(id),
    session_date     DATE NOT NULL,
    surah_from       VARCHAR(100) NOT NULL,
    ayah_from        INT,
    surah_to         VARCHAR(100) NOT NULL,
    ayah_to          INT,
    pages_count      NUMERIC(5,1) NOT NULL DEFAULT 0,
    rating           recitation_rating NOT NULL DEFAULT 'good',
    teacher_notes    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXCUSES
-- ============================================================

CREATE TABLE excuses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES users(id),
    attendance_id   UUID REFERENCES attendance(id),
    session_date    DATE NOT NULL,
    reason          TEXT NOT NULL,
    month_year      CHAR(7) NOT NULL,  -- 'YYYY-MM' for monthly reset tracking
    approved        BOOLEAN,
    approved_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id),
    type         notification_type NOT NULL,
    channel      notification_channel NOT NULL DEFAULT 'in_app',
    title        VARCHAR(255) NOT NULL,
    body         TEXT NOT NULL,
    is_read      BOOLEAN NOT NULL DEFAULT false,
    sent_at      TIMESTAMPTZ,
    error_msg    TEXT,
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_role           ON users(role);
CREATE INDEX idx_users_status         ON users(status);
CREATE INDEX idx_users_phone          ON users(phone);

CREATE INDEX idx_student_profiles_user  ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_sem   ON student_profiles(semester_id);

CREATE INDEX idx_circles_teacher        ON circles(teacher_id);
CREATE INDEX idx_circles_semester       ON circles(semester_id);

CREATE INDEX idx_time_slots_circle      ON time_slots(circle_id);
CREATE INDEX idx_time_slots_day         ON time_slots(day);

CREATE INDEX idx_appointments_student   ON appointments(student_id);
CREATE INDEX idx_appointments_slot      ON appointments(time_slot_id);
CREATE INDEX idx_appointments_circle    ON appointments(circle_id);

CREATE INDEX idx_attendance_student     ON attendance(student_id);
CREATE INDEX idx_attendance_teacher     ON attendance(teacher_id);
CREATE INDEX idx_attendance_date        ON attendance(session_date);
CREATE INDEX idx_attendance_circle      ON attendance(circle_id);

CREATE INDEX idx_recitations_student    ON recitations(student_id);
CREATE INDEX idx_recitations_teacher    ON recitations(teacher_id);
CREATE INDEX idx_recitations_date       ON recitations(session_date);

CREATE INDEX idx_excuses_student        ON excuses(student_id);
CREATE INDEX idx_excuses_month          ON excuses(student_id, month_year);

CREATE INDEX idx_notifications_user     ON notifications(user_id);
CREATE INDEX idx_notifications_read     ON notifications(user_id, is_read);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_circles_updated_at
  BEFORE UPDATE ON circles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_recitations_updated_at
  BEFORE UPDATE ON recitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_excuses_updated_at
  BEFORE UPDATE ON excuses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_semesters_updated_at
  BEFORE UPDATE ON semesters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SEED: default admin user  (password: Admin@1234)
-- ============================================================

INSERT INTO semesters (name, start_date, end_date, is_active)
VALUES ('الفصل الأول 1446', '2024-09-01', '2025-01-31', true);

INSERT INTO users (full_name, email, phone, password_hash, role, status)
VALUES (
  'مدير النظام',
  'admin@mishkat.com',
  '+966500000000',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMkSsrDQqTPr4K9EAzXGEsHu',  -- Admin@1234
  'admin',
  'active'
);
