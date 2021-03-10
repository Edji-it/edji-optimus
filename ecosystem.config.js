module.exports = {
  apps: [
    {
      name: 'edji-optimus',
      script: 'build/bundle.js',
      node_args: '--optimize_for_size --max_old_space_size=100',
      instances: 4,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        instances: 0, // uses max cpu's
      },
    },
  ],
}
