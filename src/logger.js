import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { systemLogger } from './system-logger.js';
import { TraceRecorder } from './trace-recorder.js';

export class Logger {
  constructor() {
    this.logsDir = path.join(os.homedir(), '.dockashell', 'logs');
    this.traceRecorders = new Map();
  }

  get logDir() {
    return this.logsDir;
  }

  set logDir(dir) {
    this.logsDir = dir;
  }

  getTraceRecorder(projectName) {
    if (!this.traceRecorders.has(projectName)) {
      this.traceRecorders.set(projectName, new TraceRecorder(projectName));
    }
    return this.traceRecorders.get(projectName);
  }

  async ensureLogsDirectory() {
    await fs.ensureDir(this.logsDir);
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

      await this.ensureLogsDirectory();

      // New tracing behaviour
      systemLogger.debug('Command executed', {
        projectName,
        command: (command || '').substring(0, 50)
      });
      const recorder = this.getTraceRecorder(projectName);
      await recorder.execution('run_command', { command }, result);

      // Sanitize project name for filename
      const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const logFile = path.join(this.logsDir, `${safeProjectName}.log`);
      const jsonLogFile = path.join(this.logsDir, `${safeProjectName}.jsonl`);
      const timestamp = new Date().toISOString();

      let logEntry;
      if (result.type === 'start') {
        logEntry = `${timestamp} [START] project=${projectName} container=${result.containerId || 'unknown'} ports=${result.ports || 'none'}\n`;
      } else if (result.type === 'stop') {
        logEntry = `${timestamp} [STOP] project=${projectName} container=${result.containerId || 'unknown'}\n`;
      } else if (result.type === 'exec') {
        const duration = result.duration || '0s';
        const safeCommand = (command || '').replace(/[\r\n]/g, ' ').substring(0, 200);
        logEntry = `${timestamp} [EXEC] project=${projectName} command="${safeCommand}" exit_code=${result.exitCode !== undefined ? result.exitCode : 'unknown'} duration=${duration}\n`;
      } else {
        logEntry = `${timestamp} [INFO] project=${projectName} action="${result.action || 'unknown'}"\n`;
      }

      await fs.appendFile(logFile, logEntry);

      // Fix: Don't duplicate output - the result object already contains it
      const jsonEntry = {
        timestamp,
        kind: 'command',
        command,
        result
        // Removed: output: result.output || '' - this was causing duplication
      };

      await fs.appendFile(jsonLogFile, JSON.stringify(jsonEntry) + '\n');
    } catch (error) {
      console.error('Failed to log command:', error.message);
      // Don't throw - logging failures shouldn't break the main operation
    }
  }

  async getProjectLogs(projectName) {
    try {
      const logFile = path.join(this.logsDir, `${projectName}.log`);
      if (await fs.pathExists(logFile)) {
        return await fs.readFile(logFile, 'utf-8');
      }
      return '';
    } catch (error) {
      console.error('Failed to read logs:', error);
      return '';
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

      await this.ensureLogsDirectory();

      systemLogger.info('Note recorded', {
        projectName,
        noteType
      });
      const recorder = this.getTraceRecorder(projectName);
      await recorder.observation(noteType, text);

      const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const logFile = path.join(this.logsDir, `${safeProjectName}.log`);
      const jsonLogFile = path.join(this.logsDir, `${safeProjectName}.jsonl`);
      const timestamp = new Date().toISOString();

      const noteEntry = `${timestamp} [NOTE] project=${projectName} type=${noteType} ${text}\n`;
      await fs.appendFile(logFile, noteEntry);

      const jsonEntry = {
        timestamp,
        kind: 'note',
        noteType,
        text
      };
      await fs.appendFile(jsonLogFile, JSON.stringify(jsonEntry) + '\n');
    } catch (error) {
      console.error('Failed to log note:', error.message);
    }
  }

  async readJsonLogs(projectName, { type, search, skip = 0, limit = 20 } = {}) {
    try {
      const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const jsonLogFile = path.join(this.logsDir, `${safeProjectName}.jsonl`);
      if (!(await fs.pathExists(jsonLogFile))) {
        return [];
      }

      const lines = (await fs.readFile(jsonLogFile, 'utf8'))
        .split('\n')
        .filter(Boolean);
      let entries = lines.map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);

      if (type) {
        if (type === 'note') {
          entries = entries.filter(e => e.kind === 'note');
        } else if (['user', 'agent', 'summary'].includes(type)) {
          entries = entries.filter(e => e.kind === 'note' && e.noteType === type);
        } else if (type === 'command') {
          entries = entries.filter(e => e.kind === 'command');
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

      return entries.slice(skip, skip + limit);
    } catch (error) {
      console.error('Failed to read JSON logs:', error.message);
      return [];
    }
  }

  async cleanup() {
    // Sessions should persist across server restarts. Only clear
    // in-memory references so new recorders will resume existing
    // sessions if available.
    this.traceRecorders.clear();
  }
}
