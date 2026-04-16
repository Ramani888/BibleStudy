module.exports = {
  apps: [
    {
      name: 'biblestudypro-api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      max_memory_restart: '1G',
      error_file: '/home/deploy/logs/pm2-error.log',
      out_file: '/home/deploy/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 10000,
      listen_timeout: 10000,
      watch: false,
    },
  ],
};
