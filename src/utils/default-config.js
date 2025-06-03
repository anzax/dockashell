export const DEFAULT_GLOBAL_CONFIG = {
  tui: {
    display: {
      max_entries: 300,
    },
  },
  logging: {
    traces: {
      session_timeout: '4h',
    },
  },
  remote_mcp: {
    enabled: false,
    port: 3333,
    auth: {
      username: 'admin',
      password: 'changeme123', // Will be bcrypt hashed
    },
    cors: {
      origin: '*',
      credentials: true,
    },
    session: {
      timeout: '24h',
    },
  },
};

export const DEFAULT_PROJECT_CONFIG = {
  mounts: [
    {
      host: '~/dockashell-projects/{name}',
      container: '/workspace',
      readonly: false,
    },
  ],
  ports: [],
  environment: {},
  working_dir: '/workspace',
  shell: '/bin/bash',
  security: { max_execution_time: 300 },
};
