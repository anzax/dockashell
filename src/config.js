import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const defaultConfig = {
  tui: {
    display: {
      max_lines_per_entry: 5,
      max_entries: 100,
      max_visible_entries: 10,
      show_icons: true,
      theme: 'dark',
    },
    projects: {
      default: null,
      recent: [],
    },
  },
  logging: {
    traces: {
      session_timeout: '4h',
    },
  },
};

export async function loadConfig() {
  const configDir = path.join(os.homedir(), '.dockashell');
  const configPath = path.join(configDir, 'config.json');
  await fs.ensureDir(configDir);
  if (!(await fs.pathExists(configPath))) {
    await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
    return { ...defaultConfig };
  }
  try {
    const cfg = await fs.readJSON(configPath);
    if (!cfg.tui) cfg.tui = { ...defaultConfig.tui };
    if (!cfg.tui.display) cfg.tui.display = { ...defaultConfig.tui.display };
    // Ensure max_visible_entries exists
    if (!cfg.tui.display.max_visible_entries) {
      cfg.tui.display.max_visible_entries =
        defaultConfig.tui.display.max_visible_entries;
    }
    if (!cfg.logging) cfg.logging = { ...defaultConfig.logging };
    if (!cfg.logging.traces)
      cfg.logging.traces = { ...defaultConfig.logging.traces };
    if (!cfg.logging.traces.session_timeout) {
      cfg.logging.traces.session_timeout =
        defaultConfig.logging.traces.session_timeout;
    }
    return cfg;
  } catch {
    return { ...defaultConfig };
  }
}
