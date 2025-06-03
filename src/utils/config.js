import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';
import { DEFAULT_GLOBAL_CONFIG } from './default-config.js';

export async function loadConfig() {
  const configDir = path.join(os.homedir(), '.dockashell');
  const configPath = path.join(configDir, 'config.json');
  await fs.ensureDir(configDir);
  if (!(await fs.pathExists(configPath))) {
    await fs.writeJSON(configPath, DEFAULT_GLOBAL_CONFIG, { spaces: 2 });
    return { ...DEFAULT_GLOBAL_CONFIG };
  }
  try {
    const cfg = await fs.readJSON(configPath);
    if (!cfg.tui) cfg.tui = { ...DEFAULT_GLOBAL_CONFIG.tui };
    if (!cfg.tui.display)
      cfg.tui.display = { ...DEFAULT_GLOBAL_CONFIG.tui.display };
    if (!cfg.logging) cfg.logging = { ...DEFAULT_GLOBAL_CONFIG.logging };
    if (!cfg.logging.traces)
      cfg.logging.traces = { ...DEFAULT_GLOBAL_CONFIG.logging.traces };
    if (!cfg.logging.traces.session_timeout) {
      cfg.logging.traces.session_timeout =
        DEFAULT_GLOBAL_CONFIG.logging.traces.session_timeout;
    }
    if (!cfg.remote_mcp)
      cfg.remote_mcp = { ...DEFAULT_GLOBAL_CONFIG.remote_mcp };
    if (!cfg.remote_mcp.auth)
      cfg.remote_mcp.auth = { ...DEFAULT_GLOBAL_CONFIG.remote_mcp.auth };
    if (!cfg.remote_mcp.cors)
      cfg.remote_mcp.cors = { ...DEFAULT_GLOBAL_CONFIG.remote_mcp.cors };
    if (!cfg.remote_mcp.session)
      cfg.remote_mcp.session = { ...DEFAULT_GLOBAL_CONFIG.remote_mcp.session };
    return cfg;
  } catch {
    return { ...DEFAULT_GLOBAL_CONFIG };
  }
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
