import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class TraceRecorder {
  constructor(projectName) {
    this.projectName = projectName;
    this.baseDir = path.join(
      os.homedir(),
      '.dockashell',
      'projects',
      projectName,
      'traces'
    );
    this.currentFile = path.join(this.baseDir, 'current.jsonl');
    this.sessionsDir = path.join(this.baseDir, 'sessions');
    this.sessionId = null;
    this.sessionStart = null;
    // Detect existing session or start a new one
    this.sessionId = this.findOrCreateSession();
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

  findOrCreateSession() {
    // Attempt to resume an existing session from current.jsonl
    try {
      if (fs.existsSync(this.currentFile)) {
        const lines = fs.readFileSync(this.currentFile, 'utf8')
          .split('\n')
          .filter(Boolean);
        if (lines.length > 0) {
          const last = JSON.parse(lines[lines.length - 1]);
          const startMs = new Date(last.timestamp).getTime() - (last.elapsed_ms || 0);
          // If session is still within 4 hours, resume it
          if (Date.now() - startMs <= 4 * 60 * 60 * 1000) {
            this.sessionStart = startMs;
            return last.session_id || this.generateSessionId();
          }
        }
        // Existing session expired -> rotate file
        fs.ensureDirSync(this.sessionsDir);
        const archive = path.join(this.sessionsDir, `${Date.now()}_expired.jsonl`);
        fs.moveSync(this.currentFile, archive, { overwrite: true });
      }
    } catch {
      // ignore resume errors and start new session
    }
    this.sessionStart = Date.now();
    return this.generateSessionId();
  }

  isSessionExpired() {
    return Date.now() - this.sessionStart > 4 * 60 * 60 * 1000;
  }

  async rotateSession() {
    await this.close();
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  async trace(tool, traceType, data) {
    await fs.ensureDir(this.baseDir);
    if (this.isSessionExpired()) {
      await this.rotateSession();
    }
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
