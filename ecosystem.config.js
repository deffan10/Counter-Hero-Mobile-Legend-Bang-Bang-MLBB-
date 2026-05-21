module.exports = {
  apps: [
    {
      name: 'mlbb-api',
      cwd: './packages/backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        APP_PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        APP_PORT: 3000,
      },
      // Logging
      error_file: '/var/log/mlbb/api-error.log',
      out_file: '/var/log/mlbb/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Health
      min_uptime: '10s',
      max_restarts: 10,
    },
    {
      name: 'mlbb-web',
      cwd: './packages/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/mlbb/web-error.log',
      out_file: '/var/log/mlbb/web-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'mlbb-worker',
      cwd: './packages/backend',
      script: 'dist/worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        WORKER_MODE: 'true',
      },
      error_file: '/var/log/mlbb/worker-error.log',
      out_file: '/var/log/mlbb/worker-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Worker restart is less aggressive
      max_restarts: 5,
      min_uptime: '30s',
    },
  ],
};
