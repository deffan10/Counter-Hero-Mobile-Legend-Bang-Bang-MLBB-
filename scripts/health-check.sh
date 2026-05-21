#!/bin/bash
# Quick health check script
# Usage: ./scripts/health-check.sh

echo "=== MLBB Counter Hero - Health Check ==="
echo ""

# PM2 status
echo "--- PM2 Processes ---"
pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    procs = json.load(sys.stdin)
    for p in procs:
        status = p.get('pm2_env', {}).get('status', 'unknown')
        name = p.get('name', '?')
        memory = p.get('monit', {}).get('memory', 0) // 1024 // 1024
        cpu = p.get('monit', {}).get('cpu', 0)
        restarts = p.get('pm2_env', {}).get('restart_time', 0)
        print(f'  {name:15} {status:10} {memory}MB  CPU:{cpu}%  restarts:{restarts}')
except:
    print('  Unable to parse PM2 status')
" 2>/dev/null || pm2 status

echo ""

# API health
echo "--- API Health ---"
API_RESPONSE=$(curl -sf http://localhost:3000/v1/health 2>/dev/null)
if [ $? -eq 0 ]; then
  echo "  API: OK - $API_RESPONSE"
else
  echo "  API: FAILED (not responding on port 3000)"
fi

# Redis
echo ""
echo "--- Redis ---"
REDIS_PING=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_PING" = "PONG" ]; then
  REDIS_MEM=$(redis-cli info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
  REDIS_KEYS=$(redis-cli dbsize 2>/dev/null | awk '{print $2}')
  echo "  Status: Connected"
  echo "  Memory: $REDIS_MEM"
  echo "  Keys: $REDIS_KEYS"
else
  echo "  Status: NOT RESPONDING"
fi

# MariaDB
echo ""
echo "--- MariaDB ---"
if mysql -e "SELECT 1" &>/dev/null; then
  DB_SIZE=$(mysql -N -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) FROM information_schema.tables WHERE table_schema = 'mlbb_counter';" 2>/dev/null)
  HERO_COUNT=$(mysql -N -e "SELECT COUNT(*) FROM mlbb_counter.heroes;" 2>/dev/null || echo "0")
  echo "  Status: Connected"
  echo "  DB Size: ${DB_SIZE:-0} MB"
  echo "  Heroes: ${HERO_COUNT}"
else
  echo "  Status: NOT RESPONDING"
fi

# Disk
echo ""
echo "--- Disk Usage ---"
df -h / | tail -1 | awk '{print "  Used: " $3 " / " $2 " (" $5 " used)"}'

echo ""
echo "=== Done ==="
