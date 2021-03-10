module.exports = {
  apps: [
    {
      name: 'edji-optimus',
      script: 'build/bundle.js',
      node_args: '--optimize_for_size --max_old_space_size=100',
      instances: 13,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      exec_mode: 'cluster',
    },
  ],
}
