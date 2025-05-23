import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export async function readLogEntries(projectName, maxEntries = 100) {
  const logsDir = path.join(os.homedir(), '.dockashell', 'logs');
  const file = path.join(logsDir, `${projectName}.jsonl`);
  if (!await fs.pathExists(file)) {
    throw new Error(`Log file not found for project '${projectName}'`);
  }
  const lines = (await fs.readFile(file, 'utf8')).split('\n').filter(Boolean);
  
  // Take last maxEntries but keep chronological order (oldest first, newest last)
  const slice = lines.slice(-maxEntries);
  const entries = [];
  for (const line of slice) {
    try {
      const obj = JSON.parse(line);
      entries.push(obj);
    } catch {
      // ignore malformed lines
    }
  }
  return entries;
}
