import path from 'path';
import os from 'os';

export function getProjectTraceDir(projectName) {
  return path.join(
    os.homedir(),
    '.dockashell',
    'projects',
    projectName,
    'traces'
  );
}

export function getCurrentTraceFile(projectName) {
  return path.join(getProjectTraceDir(projectName), 'current.jsonl');
}

export function getSessionsDir(projectName) {
  return path.join(getProjectTraceDir(projectName), 'sessions');
}
