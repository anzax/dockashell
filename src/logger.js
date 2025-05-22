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
}
