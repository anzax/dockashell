import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export function getTraceFile(projectName, session = 'current') {
  const base = path.join(
    os.homedir(),
    '.dockashell',
    'projects',
    projectName,
    'traces'
  );
  return session === 'current'
    ? path.join(base, 'current.jsonl')
    : path.join(base, 'sessions', `${session}.jsonl`);
}

export async function listSessions(projectName) {
  const dir = path.join(
    os.homedir(),
    '.dockashell',
    'projects',
    projectName,
    'traces',
    'sessions'
  );

  if (!await fs.pathExists(dir)) {
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

export async function readTraceEntries(projectName, maxEntries = 100, session = 'current') {
  const tracesFile = getTraceFile(projectName, session);

  if (!await fs.pathExists(tracesFile)) {
    throw new Error(`Trace file not found for project '${projectName}'`);
  }

  const lines = (await fs.readFile(tracesFile, 'utf8'))
    .split('\n')
    .filter(Boolean);

  const slice = lines.slice(-maxEntries);
  const entries = [];
  for (const line of slice) {
    try {
      const trace = JSON.parse(line);
      let entry;
      if (trace.tool === 'run_command') {
        entry = {
          timestamp: trace.timestamp,
          kind: 'command',
          command: trace.command,
          result: trace.result
        };
      } else if (trace.tool === 'git_apply') {
        entry = {
          timestamp: trace.timestamp,
          kind: 'git_apply',
          diff: trace.diff,
          result: trace.result
        };
      } else if (trace.tool === 'write_trace') {
        entry = {
          timestamp: trace.timestamp,
          kind: 'note',
          noteType: trace.type,
          text: trace.text
        };
      } else {
        entry = { timestamp: trace.timestamp, ...trace };
      }
      entries.push(entry);
    } catch {
      // ignore malformed lines
    }
  }

  return entries;
}
