import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class SystemLogger {
  constructor() {
    this.logsDir = path.join(os.homedir(), '.dockashell', 'logs');
    this.logFile = path.join(this.logsDir, 'system.log');
  }

  async log(level, message, context = {}) {
    try {
      if (!message || typeof message !== 'string') {
        throw new Error('message must be a non-empty string');
      }

      await fs.ensureDir(this.logsDir);
      const timestamp = new Date().toISOString();
      const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
      const entry = `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}${contextStr}\n`;
      await fs.appendFile(this.logFile, entry);
    } catch (error) {
      console.error('SystemLogger failed:', error.message);
    }
  }

  async debug(message, context) { await this.log('debug', message, context); }
  async info(message, context) { await this.log('info', message, context); }
  async warn(message, context) { await this.log('warn', message, context); }
  async error(message, error, context) {
    const errorInfo = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };
    await this.log('error', message, { ...context, error: errorInfo });
  }
}

export const systemLogger = new SystemLogger();
