export const defaultConfig = {
  tui: {
    display: {
      max_entries: 100,
    },
  },
  logging: {
    traces: {
      session_timeout: '4h',
      max_output_length: 128 * 1024,
    },
  },
};
