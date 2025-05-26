import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { systemLogger } from './system-logger.js';
import { TraceRecorder } from './trace-recorder.js';
import { loadConfig } from './config.js';

const parseDuration = (value) => {
  if (typeof value === 'number') return value;
  const match = /^\s*(\d+)\s*(ms|s|m|h|d)?\s*$/.exec(value || '');
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  const unit = match[2] || 'ms';
  switch (unit) {
    case 'd':
      return num * 86400000;
    case 'h':
      return num * 3600000;
    case 'm':
      return num * 60000;
    case 's':
      return num * 1000;
    default:
      return num;
  }
};

export class Logger {
  constructor() {
    this.traceRecorders = new Map();
    this._config = null;
    loadConfig()
      .then((c) => {
        this._config = c;
      })
      .catch(() => {
        this._config = null;
      });
  }

  async getTraceRecorder(projectName) {
    if (!this.traceRecorders.has(projectName)) {
      const timeoutStr = this._config?.logging?.traces?.session_timeout || '4h';
      const timeoutMs = parseDuration(timeoutStr) || 4 * 60 * 60 * 1000;
      this.traceRecorders.set(
        projectName,
        new TraceRecorder(projectName, timeoutMs)
      );
    }
    return this.traceRecorders.get(projectName);
  }

  async logCommand(projectName, command, result) {
    try {
      // Validate inputs
      if (!projectName || typeof projectName !== 'string') {
        console.error('Invalid project name for logging:', projectName);
        return;
      }

      if (!result || typeof result !== 'object') {
        console.error('Invalid result object for logging:', result);
        return;
      }

      // Record trace
      systemLogger.debug('Command executed', {
        projectName,
        command: (command || '').substring(0, 50),
      });
      const recorder = await this.getTraceRecorder(projectName);
      await recorder.execution('run_command', { command }, result);
    } catch (error) {
      console.error('Failed to log command:', error.message);
      // Don't throw - logging failures shouldn't break the main operation
    }
  }

  async logToolExecution(projectName, toolName, params, result) {
    try {
      if (!projectName || typeof projectName !== 'string') {
        console.error('Invalid project name for logging:', projectName);
        return;
      }

      const recorder = await this.getTraceRecorder(projectName);
      await recorder.execution(toolName, params, result || {});
    } catch (error) {
      console.error('Failed to log tool execution:', error.message);
    }
  }

  async logNote(projectName, noteType, text) {
    try {
      if (!projectName || typeof projectName !== 'string') {
        console.error('Invalid project name for logging:', projectName);
        return;
      }
      if (!text || typeof text !== 'string') {
        console.error('Invalid note text for logging:', text);
        return;
      }

      systemLogger.info('Note recorded', {
        projectName,
        noteType,
      });
      const recorder = await this.getTraceRecorder(projectName);
      await recorder.observation(noteType, text);
    } catch (error) {
      console.error('Failed to log note:', error.message);
    }
  }

  async readTraces(projectName, { type, search, skip = 0, limit = 20 } = {}) {
    try {
      const tracesFile = path.join(
        os.homedir(),
        '.dockashell',
        'projects',
        projectName,
        'traces',
        'current.jsonl'
      );
      if (!(await fs.pathExists(tracesFile))) {
        return [];
      }

      const lines = (await fs.readFile(tracesFile, 'utf8'))
        .split('\n')
        .filter(Boolean);
      let entries = lines
        .map((l) => {
          try {
            const trace = JSON.parse(l);
            if (trace.tool === 'run_command') {
              return {
                timestamp: trace.timestamp,
                kind: 'command',
                command: trace.command,
                result: trace.result,
              };
            } else if (trace.tool === 'apply_patch') {
              return {
                timestamp: trace.timestamp,
                kind: 'apply_patch',
                diff: trace.patch,
                result: trace.result,
              };
            } else if (trace.tool === 'write_file') {
              return {
                timestamp: trace.timestamp,
                kind: 'write_file',
                path: trace.path,
                result: trace.result,
              };
            } else if (trace.tool === 'write_trace') {
              return {
                timestamp: trace.timestamp,
                kind: 'note',
                noteType: trace.type,
                text: trace.text,
              };
            }
            return { timestamp: trace.timestamp, ...trace };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (type) {
        if (type === 'note') {
          entries = entries.filter((e) => e.kind === 'note');
        } else if (['user', 'agent', 'summary'].includes(type)) {
          entries = entries.filter(
            (e) => e.kind === 'note' && e.noteType === type
          );
        } else if (type === 'command') {
          entries = entries.filter((e) => e.kind === 'command');
        } else if (type === 'apply_patch') {
          entries = entries.filter((e) => e.kind === 'apply_patch');
        } else if (type === 'write_file') {
          entries = entries.filter((e) => e.kind === 'write_file');
        } else {
          entries = entries.filter(
            (e) => e.kind === type || e.noteType === type
          );
        }
      }
      if (search) {
        const lower = search.toLowerCase();
        entries = entries.filter((e) => {
          const target =
            (e.command || '') + (e.text || '') + (e.result?.output || '');
          return target.toLowerCase().includes(lower);
        });
      }

      return entries.reverse().slice(skip, skip + limit);
    } catch (error) {
      console.error('Failed to read traces:', error.message);
      return [];
    }
  }

  async cleanup() {
    const now = Date.now();
    for (const recorder of this.traceRecorders.values()) {
      try {
        if (now - recorder.lastTraceTime > recorder.sessionTimeoutMs) {
          await recorder.close();
        }
      } catch (error) {
        systemLogger.warn('Failed to close trace recorder', {
          error: error.message,
        });
      }
    }
    this.traceRecorders.clear();
  }
}
