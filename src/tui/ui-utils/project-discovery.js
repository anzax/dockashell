import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  getCurrentTraceFile,
  getSessionsDir,
} from '../../utils/trace-paths.js';

export async function discoverProjects() {
  const projectsDir = path.join(os.homedir(), '.dockashell', 'projects');
  await fs.ensureDir(projectsDir);
  const projectNames = await fs.readdir(projectsDir);
  const list = [];

  for (const name of projectNames) {
    const currentFile = getCurrentTraceFile(name);
    const sessionsDir = getSessionsDir(name);
    let last = '';
    let count = 0;

    if (await fs.pathExists(currentFile)) {
      try {
        const content = await fs.readFile(currentFile, 'utf8');
        const lines = content.split('\n').filter(Boolean);
        count += lines.length;
        if (lines.length > 0) {
          try {
            const obj = JSON.parse(lines[lines.length - 1]);
            last = obj.timestamp || last;
          } catch {
            // ignore parse errors
          }
        }
      } catch {
        // ignore read errors
      }
    }

    if (await fs.pathExists(sessionsDir)) {
      const files = (await fs.readdir(sessionsDir)).filter((f) =>
        f.endsWith('.jsonl')
      );
      for (const f of files) {
        try {
          const content = await fs.readFile(path.join(sessionsDir, f), 'utf8');
          const lines = content.split('\n').filter(Boolean);
          count += lines.length;
          if (lines.length > 0) {
            try {
              const obj = JSON.parse(lines[lines.length - 1]);
              const ts = obj.timestamp;
              if (
                ts &&
                (!last || new Date(ts).getTime() > new Date(last).getTime())
              ) {
                last = ts;
              }
            } catch {
              // ignore parse errors
            }
          }
        } catch {
          // ignore read errors
        }
      }
    }

    if (count > 0) {
      list.push({ name, count, last });
    }
  }

  list.sort((a, b) => new Date(b.last).getTime() - new Date(a.last).getTime());
  return list;
}
