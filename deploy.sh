#!/bin/bash
# ============================================================
# مقرأة مشكاة - Deploy Script for Vultr Ubuntu 24.04
# Run as root: bash deploy.sh
# ============================================================
set -e

CF_TUNNEL_TOKEN="eyJhIjoiYWY4ZjY2ZGRiZjI3YzdlZTNiZjAwMmJlNDk2Y2RlYzIiLCJ0IjoiNmNlZGI2ZTMtMGMxMS00OTI0LTg3NDYtNDQ0YmIyYzEzNTFhIiwicyI6IktZS2hxeElXMThxZjNubllldVkyTzh3N0lEVDc0b1U5am9lWXJJTTBIZkU9In0="
DB_NAME="mishkat_db"
DB_USER="mishkat_user"
DB_PASS="mishkat_pass_2026"
JWT_SECRET="mishkat_jwt_super_secret_$(openssl rand -hex 16)"
REPO="https://github.com/OudyUsef19/mishkat.git"
BRANCH="claude/quran-recitation-system-YTX3b"
APP_DIR="/opt/mishkat"

echo "=================================================="
echo "  🕌  مقرأة مشكاة - بدء النشر"
echo "=================================================="

# ── 1. System update ──────────────────────────────────────
echo "📦 [1/9] تحديث النظام..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install dependencies ───────────────────────────────
echo "📦 [2/9] تثبيت المتطلبات..."
apt-get install -y -qq \
  curl git nginx postgresql postgresql-contrib \
  ufw build-essential

# ── 3. Install Node.js 20 ─────────────────────────────────
echo "📦 [3/9] تثبيت Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y -qq nodejs
node --version && npm --version

# ── 4. Install cloudflared ────────────────────────────────
echo "📦 [4/9] تثبيت cloudflared..."
curl -L --silent \
  "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64" \
  -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
cloudflared --version

# ── 5. PostgreSQL setup ───────────────────────────────────
echo "🗄️  [5/9] إعداد قاعدة البيانات..."
service postgresql start

su -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\" | grep -q 1 || \
  psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS'\"" postgres

su -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\" | grep -q 1 || \
  psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER\"" postgres

su -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER\"" postgres
su -c "psql -d $DB_NAME -c \"GRANT ALL ON SCHEMA public TO $DB_USER\"" postgres

# ── 6. Clone & build app ──────────────────────────────────
echo "📂 [6/9] تنزيل التطبيق..."
rm -rf "$APP_DIR"
git clone --branch "$BRANCH" --single-branch "$REPO" "$APP_DIR" --quiet

# Backend deps
cd "$APP_DIR/backend"
npm install --omit=dev --silent

# Run DB migration
su -c "psql -d $DB_NAME -U postgres -f $APP_DIR/backend/migrations/001_initial_schema.sql" postgres 2>/dev/null || true
su -c "psql -d $DB_NAME -c \"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;\"" postgres

# Fix admin password
ADMIN_HASH=$(node -e "const b=require('bcrypt'); b.hash('Admin@1234',12).then(h=>process.stdout.write(h))")
su -c "psql -d $DB_NAME" postgres << SQL
UPDATE users SET password_hash='$ADMIN_HASH' WHERE email='admin@mishkat.com';
SQL

# Backend .env
cat > "$APP_DIR/backend/.env" << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://mishkat-maqra.org
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
EOF

# Frontend build
cd "$APP_DIR/frontend"
npm install --silent
npm run build

# ── 7. Nginx setup ────────────────────────────────────────
echo "🌐 [7/9] إعداد Nginx..."
cat > /etc/nginx/sites-available/mishkat << 'NGINX'
server {
    listen 80;
    server_name mishkat-maqra.org www.mishkat-maqra.org _;
    root /opt/mishkat/frontend/dist;
    index index.html;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_http_version 1.1;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
NGINX

ln -sf /etc/nginx/sites-available/mishkat /etc/nginx/sites-enabled/mishkat
rm -f /etc/nginx/sites-enabled/default
nginx -t && service nginx restart

# ── 8. PM2 + backend start ────────────────────────────────
echo "🚀 [8/9] تشغيل الخدمات..."
npm install -g pm2 --silent

cd "$APP_DIR/backend"
pm2 delete mishkat-api 2>/dev/null || true
pm2 start src/index.js --name "mishkat-api"
pm2 save

# ── 9. cloudflared as systemd service ─────────────────────
echo "☁️  [9/9] إعداد Cloudflare Tunnel..."
cat > /etc/systemd/system/cloudflared.service << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run --token $CF_TUNNEL_TOKEN
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cloudflared
systemctl start cloudflared

# ── Firewall ──────────────────────────────────────────────
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── pm2 startup ──────────────────────────────────────────
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
pm2 save

# ── Verify ────────────────────────────────────────────────
sleep 5
echo ""
echo "=================================================="
echo "  ✅  اكتمل النشر بنجاح!"
echo "=================================================="
echo ""
echo "📊 حالة الخدمات:"
echo "  Backend API:  $(curl -s http://localhost:5000/health | grep -o 'ok' || echo 'ERROR')"
echo "  Nginx:        $(service nginx status | grep -o 'running' || echo 'CHECK')"
echo "  Cloudflared:  $(systemctl is-active cloudflared)"
echo ""
echo "🔐 بيانات الدخول:"
echo "  Admin Phone:  +966500000000"
echo "  Password:     Admin@1234"
echo ""
echo "🌐 الموقع: https://mishkat-maqra.org"
echo "=================================================="
