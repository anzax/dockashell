import EventEmitter from 'events';
import chokidar from 'chokidar';
import { listSessions, readTraceEntries } from './read-traces.js';
import { getCurrentTraceFile } from '../../utils/trace-paths.js';

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

  onUpdate(callback) {
    this.on('update', callback);
    return () => this.off('update', callback);
  }

  async start() {
    await this.refresh();
    await this.watch();
  }

  async watch() {
    // Only watch current.jsonl for optimal performance
    // 99% of trace updates are to this file during active sessions
    const currentFile = getCurrentTraceFile(this.projectName);

    this.watcher = chokidar.watch(currentFile, {
      ignoreInitial: true,
      // Optimize for file watching
      usePolling: false,
      alwaysStat: false,
    });

    // Handle real-time trace updates
    this.watcher.on('change', () => this.refresh());
    this.watcher.on('add', () => this.refresh());

    // Handle session rotation: when current.jsonl is moved to sessions/
    // this creates a new empty current.jsonl and archives the old one
    this.watcher.on('unlink', () => {
      // File was moved during session rotation - refresh to load new session data
      setTimeout(() => this.refresh(), 100); // Small delay for filesystem consistency
    });
  }

  async close() {
    if (this.watcher) {
      await this.watcher.close().catch(() => {});
      this.watcher = null;
    }
  }
}
