import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class Logger {
  constructor() {
    this.logsDir = path.join(os.homedir(), '.dockashell', 'logs');
  }

  get logDir() {
    return this.logsDir;
  }

  set logDir(dir) {
    this.logsDir = dir;
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

      const jsonEntry = {
        timestamp,
        kind: 'command',
        command,
        result
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
        entries = entries.filter(e => e.kind === type || e.noteType === type);
      }
      if (search) {
        entries = entries.filter(e => {
          const target = e.command || e.text || '';
          return target.includes(search);
        });
      }

      return entries.slice(skip, skip + limit);
    } catch (error) {
      console.error('Failed to read JSON logs:', error.message);
      return [];
    }
  }
}
