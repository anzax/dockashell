import EventEmitter from 'events';
import chokidar from 'chokidar';
import path from 'path';
import os from 'os';
import { listSessions, readTraceEntries } from './read-traces.js';

export class TraceBuffer extends EventEmitter {
  constructor(projectName, maxEntries = 100) {
    super();
    this.projectName = projectName;
    this.maxEntries = maxEntries;
    this.entries = [];
    this.watcher = null;
  }

  async loadFromFiles() {
    const sessions = await listSessions(this.projectName);
    const allTraces = [];

    // Load traces from all sessions in chronological order
    for (let i = 0; i < sessions.length; i++) {
      const id = sessions[i];
      try {
        const traces = await readTraceEntries(this.projectName, Infinity, id);
        allTraces.push(...traces);
      } catch {
        // ignore malformed or missing files
      }
    }

    // Sort by timestamp to ensure proper chronological order across sessions
    allTraces.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Keep only the most recent entries
    this.entries = allTraces.slice(-this.maxEntries);
  }

  async refresh() {
    await this.loadFromFiles();
    this.emit('update');
  }

  getTraces(limit) {
    return limit ? this.entries.slice(-limit) : this.entries.slice();
  }

  search(query) {
    const q = query.toLowerCase();
    return this.entries.filter((e) =>
      JSON.stringify(e).toLowerCase().includes(q)
    );
  }

  onUpdate(callback) {
    this.on('update', callback);
    return () => this.off('update', callback);
  }

  async start() {
    await this.refresh();
    await this.watch();
  }

  async watch() {
    const traceDir = path.join(
      os.homedir(),
      '.dockashell',
      'projects',
      this.projectName,
      'traces'
    );

    this.watcher = chokidar.watch(traceDir, { ignoreInitial: true });
    this.watcher.on('add', () => this.refresh());
    this.watcher.on('change', () => this.refresh());
    this.watcher.on('unlink', () => this.refresh());
  }

  async close() {
    if (this.watcher) await this.watcher.close().catch(() => {});
  }
}
