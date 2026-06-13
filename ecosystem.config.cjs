module.exports = {
  apps: [
    {
      name: 'fusion-backend',
      cwd: '/Users/fathur/Herd/Fusion-Ai/backend',
      script: 'index.js',
      interpreter: 'node',
      env: { NODE_ENV: 'development' },
    },
    {
      name: 'fusion-frontend',
      cwd: '/Users/fathur/Herd/Fusion-Ai/frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 5173',
      interpreter: 'node',
      env: { NODE_ENV: 'development' },
    },
  ],
};
