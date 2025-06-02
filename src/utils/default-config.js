export const DEFAULT_GLOBAL_CONFIG = {
  tui: {
    display: {
      max_entries: 100,
    },
  },
  logging: {
    traces: {
      session_timeout: '4h',
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
