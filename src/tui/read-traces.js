import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export async function readLogEntries(projectName, maxEntries = 100) {
  const tracesFile = path.join(
    os.homedir(),
    '.dockashell',
    'projects',
    projectName,
    'traces',
    'current.jsonl'
  );

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
      } else if (trace.tool === 'write_log') {
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
