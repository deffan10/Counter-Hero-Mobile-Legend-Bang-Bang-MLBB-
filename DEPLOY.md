# Panduan Deploy - MLBB Counter Hero

## Prasyarat VPS

- **OS:** Debian 12/13
- **Sudah terinstall:** Nginx, MariaDB, PM2
- **RAM minimal:** 2GB (rekomendasi 4GB)
- **Node.js:** v22 LTS

---

## Step 1: Clone Project

```bash
cd /opt
git clone https://github.com/deffan10/Counter-Hero-Mobile-Legend-Bang-Bang-MLBB-.git mlbb-counter
cd mlbb-counter
git checkout feat/web-platform-implementation
```

---

## Step 2: Install Node.js 22 (jika belum)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs
node -v   # harus v22.x
npm -v    # harus v10.x
```

---

## Step 3: Install Redis (jika belum)

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verifikasi
redis-cli ping   # harus jawab PONG

# Set memory limit (opsional tapi rekomendasi)
echo "maxmemory 256mb" | sudo tee -a /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" | sudo tee -a /etc/redis/redis.conf
sudo systemctl restart redis-server
```

---

## Step 4: Setup Database MariaDB

```bash
# Login ke MariaDB
sudo mysql

# Jalankan query berikut:
CREATE DATABASE mlbb_counter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mlbb'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_INI';
GRANT ALL PRIVILEGES ON mlbb_counter.* TO 'mlbb'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 5: Setup Environment

```bash
cd /opt/mlbb-counter
cp .env.example .env
nano .env
```

**Isi yang WAJIB diubah:**

```env
NODE_ENV=production
APP_PORT=3000
APP_URL=https://api.domain-kamu.com
FRONTEND_URL=https://domain-kamu.com

# Sesuaikan password DB dari Step 4
DATABASE_URL=mysql://mlbb:GANTI_PASSWORD_INI@localhost:3306/mlbb_counter

REDIS_URL=redis://localhost:6379

# Generate secret (jalankan di terminal, copy hasilnya)
# openssl rand -base64 48
JWT_SECRET=HASIL_GENERATE_DISINI

# Frontend
NEXT_PUBLIC_API_URL=https://api.domain-kamu.com/v1
```

---

## Step 6: Install Dependencies & Build

```bash
cd /opt/mlbb-counter

# Install semua dependencies
npm install

# Generate Prisma client
cd packages/backend
npx prisma generate

# Jalankan migration (buat tabel di database)
npx prisma migrate deploy

# Seed data awal (80+ heroes, items, spells, dll)
npx prisma db seed

# Kembali ke root & build semua
cd ../..
npm run build
```

---

## Step 7: Buat Log Directory

```bash
sudo mkdir -p /var/log/mlbb
sudo chown $USER:$USER /var/log/mlbb
```

---

## Step 8: Start PM2

```bash
cd /opt/mlbb-counter

# Start semua services
pm2 start ecosystem.config.js

# Cek status
pm2 status

# Harus muncul:
# mlbb-api    │ cluster │ 2 instances │ online
# mlbb-web    │ fork    │ 1 instance  │ online
# mlbb-worker │ fork    │ 1 instance  │ online

# Save supaya auto-start saat reboot
pm2 save
pm2 startup
# (ikuti instruksi yang muncul, biasanya suruh copy-paste satu command sudo)
```

---

## Step 9: Verifikasi

```bash
# Test API
curl http://localhost:3000/v1/health
# Harus jawab: {"status":"ok","timestamp":"..."}

# Test Frontend
curl -I http://localhost:3001
# Harus jawab: HTTP/1.1 200 OK

# Test dengan data
curl http://localhost:3000/v1/heroes | head -c 200
```

---

## Step 10: Setup Nginx

```bash
sudo nano /etc/nginx/sites-available/mlbb-api.conf
```

**Isi:**

```nginx
upstream mlbb_api {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.domain-kamu.com;

    location / {
        proxy_pass http://mlbb_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nano /etc/nginx/sites-available/mlbb-web.conf
```

**Isi:**

```nginx
upstream mlbb_web {
    server 127.0.0.1:3001;
    keepalive 16;
}

server {
    listen 80;
    server_name domain-kamu.com www.domain-kamu.com;

    location / {
        proxy_pass http://mlbb_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static/ {
        proxy_pass http://mlbb_web;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable sites
sudo ln -sf /etc/nginx/sites-available/mlbb-api.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/mlbb-web.conf /etc/nginx/sites-enabled/

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 11: SSL (Cloudflare atau Certbot)

**Opsi A - Cloudflare (rekomendasi):**
1. Tambah domain di Cloudflare
2. Arahkan DNS A record ke IP VPS
3. Nyalakan proxy (orange cloud)
4. Set SSL mode: "Full"

**Opsi B - Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d domain-kamu.com -d api.domain-kamu.com
```

---

## Deploy Update Selanjutnya

```bash
cd /opt/mlbb-counter
bash scripts/deploy.sh
```

Atau kalau sudah setup GitHub Actions, cukup push ke `main`:
```bash
git push origin main
# Auto deploy via GitHub Actions
```

---

## Perintah PM2 Sehari-hari

```bash
pm2 status              # lihat status semua process
pm2 logs                # lihat semua log realtime
pm2 logs mlbb-api       # log API saja
pm2 logs mlbb-worker    # log scraper worker
pm2 monit               # monitoring CPU/RAM realtime
pm2 reload all          # restart tanpa downtime
pm2 restart mlbb-worker # restart worker saja
```

---

## Troubleshooting

### API tidak jalan
```bash
pm2 logs mlbb-api --lines 50
# Cek error, biasanya:
# - DATABASE_URL salah → cek .env
# - Port 3000 sudah dipakai → lsof -i :3000
```

### Database connection refused
```bash
sudo systemctl status mariadb
# Kalau mati: sudo systemctl start mariadb
```

### Redis connection refused
```bash
sudo systemctl status redis-server
# Kalau mati: sudo systemctl start redis-server
```

### Scraper tidak jalan
```bash
pm2 logs mlbb-worker --lines 50
# Cek apakah Redis connected
redis-cli ping
```

### Nginx 502 Bad Gateway
```bash
# Cek PM2 running
pm2 status
# Kalau offline, restart:
pm2 start ecosystem.config.js
```

---

## Struktur Port

| Service | Port | Akses |
|---------|------|-------|
| API (NestJS) | 3000 | via Nginx → api.domain.com |
| Web (Next.js) | 3001 | via Nginx → domain.com |
| MariaDB | 3306 | localhost only |
| Redis | 6379 | localhost only |

---

## Health Check Script

```bash
bash scripts/health-check.sh
```

Output contoh:
```
=== MLBB Counter Hero - Health Check ===
--- PM2 Processes ---
  mlbb-api        online     120MB  CPU:2%  restarts:0
  mlbb-web        online     85MB   CPU:1%  restarts:0
  mlbb-worker     online     95MB   CPU:0%  restarts:0
--- API Health ---
  API: OK
--- Redis ---
  Status: Connected
  Memory: 2.5MB
  Keys: 145
--- MariaDB ---
  Status: Connected
  DB Size: 4.2 MB
  Heroes: 80
```
