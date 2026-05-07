# مقرأة مشكاة – Maqra'at Mishkat

نظام إدارة حلقات القرآن الكريم | Full-stack Quran recitation management system.

## Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend  | Node.js + Express |
| Database | PostgreSQL 16 |
| Auth     | JWT (JSON Web Tokens) |
| Notifications | Twilio WhatsApp API |
| Deployment | Docker Compose |

---

## Roles

| Role    | Capabilities |
|---------|-------------|
| **Admin** | Full stats, approve/reject students, manage circles, teachers, reports |
| **Teacher** | Daily schedule, mark attendance, log recitations |
| **Student** | View profile & schedule, track attendance, submit excuses, view recitations |

---

## Quick Start (Docker)

```bash
# 1. Copy env file and fill in secrets
cp backend/.env.example backend/.env

# 2. Start everything
docker compose up -d

# 3. Access the app
open http://localhost
```

Default admin login:
- **Phone**: set in seed (admin@mishkat.com)
- **Password**: `Admin@1234`

---

## Local Development

### Backend

```bash
cd backend
cp .env.example .env       # fill in DB credentials + Twilio
npm install
npm run migrate            # run DB schema
npm run dev                # start on :5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # start on :5173
```

---

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Student self-registration |
| POST | `/api/auth/login` | — | Login (all roles) |
| GET  | `/api/auth/me` | JWT | Current user profile |
| GET  | `/api/admin/stats` | Admin | Dashboard statistics |
| GET  | `/api/admin/students` | Admin | List students (paginated) |
| PATCH| `/api/admin/students/:id/approve` | Admin | Approve + assign circle |
| PATCH| `/api/admin/students/:id/reject` | Admin | Reject with reason |
| GET/POST | `/api/admin/circles` | Admin | Manage circles |
| GET/POST | `/api/admin/circles/:id/slots` | Admin | Manage time slots |
| GET  | `/api/admin/reports/attendance` | Admin | Attendance report (CSV) |
| GET  | `/api/teacher/schedule?date=` | Teacher | Daily schedule |
| POST | `/api/teacher/attendance` | Teacher | Mark attendance |
| POST | `/api/teacher/recitation` | Teacher | Log recitation |
| GET  | `/api/student/profile` | Student | Student profile + appointment |
| GET/POST | `/api/student/excuses` | Student | View/submit excuses |
| GET  | `/api/student/notifications` | Student | Notifications |

---

## Database Schema

```
users ──┬── student_profiles
        ├── circles (teacher_id)
        └── notifications

circles ─── time_slots ─── appointments ──┬── attendance ─── recitations
                                           └── excuses
semesters ──► student_profiles, circles, appointments
```

---

## Key Business Rules

- **Attendance statuses**: `present` / `absent` / `excused`
- **Monthly excuse limit**: max **3 excuses** per student, resets by `month_year` column
- **Time slots**: Saturday–Wednesday, 30 min each, unique constraint prevents double booking
- **Student lifecycle**: `pending → active` (approved) or `pending → rejected`
- **WhatsApp via Twilio**: approval/rejection notices, session reminders (T-60min cron), daily schedule for teachers at 06:00

---

## Project Structure

```
mishkat/
├── backend/
│   ├── migrations/          # SQL schema
│   ├── src/
│   │   ├── config/          # DB connection, migration runner
│   │   ├── controllers/     # auth, admin, teacher, student
│   │   ├── middleware/       # auth JWT, validate, errorHandler
│   │   ├── routes/          # Express routers
│   │   ├── services/        # notification (Twilio), cron jobs
│   │   └── utils/           # logger, response helpers
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # common UI (Sidebar, Modal, etc.)
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useFetch
│   │   ├── pages/           # auth / admin / teacher / student
│   │   └── services/        # axios API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```
