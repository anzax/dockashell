import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const defaultConfig = {
  tui: {
    display: {
      max_lines_per_entry: 5,
      max_entries: 100,
      show_icons: true,
      theme: 'dark'
    },
    projects: {
      default: null,
      recent: []
    }
  }
};

export async function loadConfig() {
  const configDir = path.join(os.homedir(), '.dockashell');
  const configPath = path.join(configDir, 'config.json');
  await fs.ensureDir(configDir);
  if (!await fs.pathExists(configPath)) {
    await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
    return { ...defaultConfig };
  }
  try {
    const cfg = await fs.readJSON(configPath);
    if (!cfg.tui) cfg.tui = { ...defaultConfig.tui };
    return cfg;
  } catch {
    return { ...defaultConfig };
  }
}
