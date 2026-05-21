#!/bin/bash
# =============================================================
# MLBB Counter Hero - VPS Setup Script
# Target: Debian 13 with Nginx, MariaDB, PM2
# =============================================================

set -e

echo "=========================================="
echo "  MLBB Counter Hero - VPS Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/opt/mlbb-counter"
LOG_DIR="/var/log/mlbb"
DB_NAME="mlbb_counter"
DB_USER="mlbb"
DB_PASS="$(openssl rand -base64 24)"

# ---- 1. System packages ----
echo -e "${GREEN}[1/8] Installing system packages...${NC}"
apt-get update -qq
apt-get install -y -qq curl git build-essential redis-server

# ---- 2. Node.js 22 via NVM (if not present) ----
echo -e "${GREEN}[2/8] Checking Node.js...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 22 ]]; then
  echo "Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js: $(node -v)"
echo "NPM: $(npm -v)"

# ---- 3. PM2 global ----
echo -e "${GREEN}[3/8] Installing PM2...${NC}"
npm install -g pm2 2>/dev/null || true
pm2 --version

# ---- 4. Redis ----
echo -e "${GREEN}[4/8] Configuring Redis...${NC}"
systemctl enable redis-server
systemctl start redis-server

# Set Redis max memory
if ! grep -q "maxmemory 256mb" /etc/redis/redis.conf; then
  echo "maxmemory 256mb" >> /etc/redis/redis.conf
  echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
  systemctl restart redis-server
fi
echo "Redis: $(redis-cli ping)"

# ---- 5. MariaDB database ----
echo -e "${GREEN}[5/8] Setting up MariaDB database...${NC}"
if ! mysql -e "USE ${DB_NAME}" 2>/dev/null; then
  mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
  mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
  mysql -e "FLUSH PRIVILEGES;"
  echo -e "${YELLOW}Database created. Credentials:${NC}"
  echo "  DB_NAME: ${DB_NAME}"
  echo "  DB_USER: ${DB_USER}"
  echo "  DB_PASS: ${DB_PASS}"
else
  echo "Database ${DB_NAME} already exists."
fi

# ---- 6. Log directory ----
echo -e "${GREEN}[6/8] Creating directories...${NC}"
mkdir -p ${LOG_DIR}
mkdir -p ${APP_DIR}
chown -R www-data:www-data ${LOG_DIR} || true

# ---- 7. Clone/pull project ----
echo -e "${GREEN}[7/8] Setting up project...${NC}"
if [ -d "${APP_DIR}/.git" ]; then
  cd ${APP_DIR}
  git pull origin main
else
  git clone https://github.com/deffan10/Counter-Hero-Mobile-Legend-Bang-Bang-MLBB-.git ${APP_DIR}
  cd ${APP_DIR}
fi

# ---- 8. Print next steps ----
echo ""
echo -e "${GREEN}=========================================="
echo "  Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Create .env file:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "2. Set DATABASE_URL in .env:"
echo "   DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
echo ""
echo "3. Install dependencies:"
echo "   npm install"
echo ""
echo "4. Generate Prisma client & run migrations:"
echo "   cd packages/backend"
echo "   npx prisma generate"
echo "   npx prisma migrate deploy"
echo "   cd ../.."
echo ""
echo "5. Build everything:"
echo "   npm run build"
echo ""
echo "6. Start with PM2:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "7. Setup Nginx (see scripts/nginx-setup.sh)"
echo ""
