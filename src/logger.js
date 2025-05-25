import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { systemLogger } from './system-logger.js';
import { TraceRecorder } from './trace-recorder.js';

export class Logger {
  constructor() {
    this.traceRecorders = new Map();
  }

  getTraceRecorder(projectName) {
    if (!this.traceRecorders.has(projectName)) {
      this.traceRecorders.set(projectName, new TraceRecorder(projectName));
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
        command: (command || '').substring(0, 50)
      });
      const recorder = this.getTraceRecorder(projectName);
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

      const recorder = this.getTraceRecorder(projectName);
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
        noteType
      });
      const recorder = this.getTraceRecorder(projectName);
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
      let entries = lines.map(l => {
        try {
          const trace = JSON.parse(l);
          if (trace.tool === 'run_command') {
            return {
              timestamp: trace.timestamp,
              kind: 'command',
              command: trace.command,
              result: trace.result
            };
          } else if (trace.tool === 'git_apply') {
            return {
              timestamp: trace.timestamp,
              kind: 'git_apply',
              diff: trace.diff,
              result: trace.result
            };
          } else if (trace.tool === 'write_trace') {
            return {
              timestamp: trace.timestamp,
              kind: 'note',
              noteType: trace.type,
              text: trace.text
            };
          }
          return { timestamp: trace.timestamp, ...trace };
        } catch {
          return null;
        }
      }).filter(Boolean);

      if (type) {
        if (type === 'note') {
          entries = entries.filter(e => e.kind === 'note');
        } else if (['user', 'agent', 'summary'].includes(type)) {
          entries = entries.filter(e => e.kind === 'note' && e.noteType === type);
        } else if (type === 'command') {
          entries = entries.filter(e => e.kind === 'command');
        } else if (type === 'git_apply') {
          entries = entries.filter(e => e.kind === 'git_apply');
        } else {
          entries = entries.filter(e => e.kind === type || e.noteType === type);
        }
      }
      if (search) {
        const lower = search.toLowerCase();
        entries = entries.filter(e => {
          const target = (e.command || '') + (e.text || '') + (e.result?.output || '');
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
    for (const recorder of this.traceRecorders.values()) {
      try {
        await recorder.close();
      } catch (error) {
        systemLogger.warn('Failed to close trace recorder', { error: error.message });
      }
    }
    this.traceRecorders.clear();
  }
}
