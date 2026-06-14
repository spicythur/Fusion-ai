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
      name: 'fusion-next',
      cwd: '/Users/fathur/Herd/Fusion-Ai/frontend-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 3000',
      interpreter: 'node',
      env: { NODE_ENV: 'development' },
    },
  ],
};
