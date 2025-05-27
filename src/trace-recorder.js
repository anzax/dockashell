import fs from 'fs-extra';
import path from 'path';
import {
  getProjectTraceDir,
  getCurrentTraceFile,
  getSessionsDir,
} from './tui/trace-paths.js';

export class TraceRecorder {
  constructor(projectName, sessionTimeoutMs = 4 * 60 * 60 * 1000) {
    this.projectName = projectName;
    this.baseDir = getProjectTraceDir(projectName);
    this.currentFile = getCurrentTraceFile(projectName);
    this.sessionsDir = getSessionsDir(projectName);
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.sessionTimeoutMs = sessionTimeoutMs;
    this.lastTraceTime = this.sessionStart;

    // Restore previous session if the current trace file exists and is recent
    if (fs.pathExistsSync(this.currentFile)) {
      try {
        const data = fs.readFileSync(this.currentFile, 'utf8');
        const lines = data.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
          const first = JSON.parse(lines[0]);
          const last = JSON.parse(lines[lines.length - 1]);
          if (first.session_id) this.sessionId = first.session_id;
          this.sessionStart =
            new Date(first.timestamp).getTime() || this.sessionStart;
          this.lastTraceTime =
            new Date(last.timestamp).getTime() || this.sessionStart;

          if (Date.now() - this.lastTraceTime > this.sessionTimeoutMs) {
            // Archive old session and start fresh
            this.closeSync();
            this.sessionId = this.generateSessionId();
            this.sessionStart = Date.now();
            this.lastTraceTime = this.sessionStart;
          }
        }
      } catch {
        // ignore parse errors and start new session
      }
    }
  }

  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ses_${timestamp}${random}`;
  }

  generateTraceId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `tr_${timestamp}${random}`;
  }

  async trace(tool, traceType, data) {
    await fs.ensureDir(this.baseDir);
    const now = Date.now();
    if (now - this.lastTraceTime > this.sessionTimeoutMs) {
      await this.close();
      this.sessionId = this.generateSessionId();
      this.sessionStart = now;
    }
    this.lastTraceTime = now;
    const entry = {
      id: this.generateTraceId(),
      session_id: this.sessionId,
      project_name: this.projectName,
      timestamp: new Date().toISOString(),
      tool,
      trace_type: traceType,
      ...data,
    };

    await fs.appendFile(this.currentFile, JSON.stringify(entry) + '\n');
    return entry;
  }

  async execution(tool, params, result) {
    return this.trace(tool, 'execution', { ...params, result });
  }

  async observation(type, text, metadata = {}) {
    return this.trace('write_trace', 'observation', { type, text, metadata });
  }

  async decision(operation, decision) {
    return this.trace('container_manager', 'decision', { operation, decision });
  }

  async close() {
    await fs.ensureDir(this.sessionsDir);
    const timestamp =
      new Date(this.sessionStart).toISOString().slice(0, 16).replace(':', '-') +
      'Z';
    const sessionFile = path.join(this.sessionsDir, `${timestamp}.jsonl`);
    if (await fs.pathExists(this.currentFile)) {
      await fs.move(this.currentFile, sessionFile, { overwrite: true });
    }
  }

  closeSync() {
    fs.ensureDirSync(this.sessionsDir);
    const timestamp =
      new Date(this.sessionStart).toISOString().slice(0, 16).replace(':', '-') +
      'Z';
    const sessionFile = path.join(this.sessionsDir, `${timestamp}.jsonl`);
    if (fs.pathExistsSync(this.currentFile)) {
      fs.moveSync(this.currentFile, sessionFile, { overwrite: true });
    }
  }
}
