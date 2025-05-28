import fs from 'fs-extra';
import path from 'path';
import { parseTraceLines } from '../../utils/trace-utils.js';
import {
  getCurrentTraceFile,
  getSessionsDir,
} from '../../utils/trace-paths.js';

export function getTraceFile(projectName, session = 'current') {
  return session === 'current'
    ? getCurrentTraceFile(projectName)
    : path.join(getSessionsDir(projectName), `${session}.jsonl`);
}

export async function listSessions(projectName) {
  const dir = getSessionsDir(projectName);

  if (!(await fs.pathExists(dir))) {
    return ['current'];
  }

  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.jsonl'));
  const details = await Promise.all(
    files.map(async (f) => {
      const full = path.join(dir, f);
      const stat = await fs.stat(full);
      return { id: f.replace(/\.jsonl$/, ''), mtime: stat.mtimeMs };
    })
  );

  details.sort((a, b) => a.mtime - b.mtime);
  return [...details.map((d) => d.id), 'current'];
}

export async function readTraceEntries(
  projectName,
  maxEntries = 100,
  session = 'current'
) {
  const tracesFile = getTraceFile(projectName, session);

  if (!(await fs.pathExists(tracesFile))) {
    throw new Error(`Trace file not found for project '${projectName}'`);
  }

  const lines = (await fs.readFile(tracesFile, 'utf8'))
    .split('\n')
    .filter(Boolean);

  const slice = lines.slice(-maxEntries);
  return parseTraceLines(slice);
}
