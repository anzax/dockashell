import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { defaultConfig } from './default-config.js';

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
    if (!cfg.logging) cfg.logging = { ...defaultConfig.logging };
    if (!cfg.logging.traces)
      cfg.logging.traces = { ...defaultConfig.logging.traces };
    if (!cfg.logging.traces.session_timeout) {
      cfg.logging.traces.session_timeout =
        defaultConfig.logging.traces.session_timeout;
    }
    if (!cfg.logging.traces.max_output_length) {
      cfg.logging.traces.max_output_length =
        defaultConfig.logging.traces.max_output_length;
    }
    return cfg;
  } catch {
    return { ...defaultConfig };
  }
}
