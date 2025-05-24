import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class TraceRecorder {
  constructor(projectName) {
    this.projectName = projectName;
    this.baseDir = path.join(os.homedir(), '.dockashell', 'projects', projectName, 'traces');
    this.currentFile = path.join(this.baseDir, 'current.jsonl');
    this.sessionsDir = path.join(this.baseDir, 'sessions');
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
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
    const entry = {
      id: this.generateTraceId(),
      session_id: this.sessionId,
      project_name: this.projectName,
      timestamp: new Date().toISOString(),
      elapsed_ms: Date.now() - this.sessionStart,
      tool,
      trace_type: traceType,
      ...data
    };

    await fs.appendFile(this.currentFile, JSON.stringify(entry) + '\n');
    return entry;
  }

  async execution(tool, params, result) {
    return this.trace(tool, 'execution', { ...params, result });
  }

  async observation(type, text, metadata = {}) {
    return this.trace('write_log', 'observation', { type, text, metadata });
  }

  async decision(operation, decision) {
    return this.trace('container_manager', 'decision', { operation, decision });
  }

  async close() {
    await fs.ensureDir(this.sessionsDir);
    const sessionFile = path.join(this.sessionsDir, `${this.sessionId}.jsonl`);
    if (await fs.pathExists(this.currentFile)) {
      await fs.move(this.currentFile, sessionFile, { overwrite: true });
    }
  }
}
