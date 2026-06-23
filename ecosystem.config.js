// ecosystem.config.js — PM2 config for Hostinger Node.js hosting
module.exports = {
  apps: [
    {
      name: 'formium-projects',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/your-hostinger-user/formium-projects',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // Log files
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
