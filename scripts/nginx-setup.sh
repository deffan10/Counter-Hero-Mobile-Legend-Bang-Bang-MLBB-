#!/bin/bash
# =============================================================
# MLBB Counter Hero - Nginx Configuration Setup
# Run: sudo bash scripts/nginx-setup.sh
# =============================================================

set -e

DOMAIN="${1:-mlbb-counter.com}"
API_DOMAIN="api.${DOMAIN}"

echo "Setting up Nginx for ${DOMAIN} and ${API_DOMAIN}..."

# Create Nginx config for API
cat > /etc/nginx/sites-available/mlbb-api.conf << 'NGINX_API'
upstream mlbb_api {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name API_DOMAIN_PLACEHOLDER;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;

    location / {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://mlbb_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Proxy cache
        proxy_cache_valid 200 5m;
        add_header X-Cache-Status $upstream_cache_status;
    }

    location /v1/admin/ {
        # Optional: IP whitelist
        # allow YOUR_IP;
        # deny all;

        proxy_pass http://mlbb_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX_API

# Create Nginx config for Web
cat > /etc/nginx/sites-available/mlbb-web.conf << 'NGINX_WEB'
upstream mlbb_web {
    server 127.0.0.1:3001;
    keepalive 16;
}

server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

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

    # Next.js static files (long cache)
    location /_next/static/ {
        proxy_pass http://mlbb_web;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_WEB

# Replace placeholders
sed -i "s/API_DOMAIN_PLACEHOLDER/${API_DOMAIN}/g" /etc/nginx/sites-available/mlbb-api.conf
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" /etc/nginx/sites-available/mlbb-web.conf

# Enable sites
ln -sf /etc/nginx/sites-available/mlbb-api.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/mlbb-web.conf /etc/nginx/sites-enabled/

# Test & reload
nginx -t && systemctl reload nginx

echo ""
echo "Nginx configured!"
echo "  Web: http://${DOMAIN}"
echo "  API: http://${API_DOMAIN}"
echo ""
echo "For SSL with Cloudflare:"
echo "  1. Point DNS A records to your VPS IP"
echo "  2. Enable Cloudflare proxy (orange cloud)"
echo "  3. Set SSL mode to 'Full' in Cloudflare"
echo "  4. Or install certbot: certbot --nginx -d ${DOMAIN} -d ${API_DOMAIN}"
