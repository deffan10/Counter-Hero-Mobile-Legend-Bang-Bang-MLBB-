#!/bin/bash
# =============================================================
# MLBB Counter Hero - Deploy Script (PM2)
# Usage: ./scripts/deploy.sh
# =============================================================

set -e

APP_DIR="/opt/mlbb-counter"
BRANCH="${1:-main}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Deploying MLBB Counter Hero (branch: ${BRANCH})...${NC}"

cd ${APP_DIR}

# 1. Pull latest code
echo -e "${YELLOW}[1/6] Pulling latest code...${NC}"
git fetch origin
git checkout ${BRANCH}
git pull origin ${BRANCH}

# 2. Install dependencies
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
npm install --production=false

# 3. Generate Prisma client
echo -e "${YELLOW}[3/6] Generating Prisma client...${NC}"
cd packages/backend
npx prisma generate

# 4. Run database migrations
echo -e "${YELLOW}[4/6] Running migrations...${NC}"
npx prisma migrate deploy
cd ../..

# 5. Build projects
echo -e "${YELLOW}[5/6] Building...${NC}"
npm run build

# 6. Reload PM2
echo -e "${YELLOW}[6/6] Reloading PM2...${NC}"
pm2 reload ecosystem.config.js --update-env

# Health check
sleep 5
if curl -sf http://localhost:3000/v1/health > /dev/null; then
  echo -e "${GREEN}✓ API is healthy!${NC}"
else
  echo -e "${RED}✗ API health check failed! Rolling back...${NC}"
  pm2 reload ecosystem.config.js
  exit 1
fi

echo -e "${GREEN}Deploy complete!${NC}"
echo "API: http://localhost:3000/v1/health"
echo "Web: http://localhost:3001"
pm2 status
