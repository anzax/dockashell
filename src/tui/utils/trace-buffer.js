import EventEmitter from 'events';
import chokidar from 'chokidar';
import { listSessions, readTraceEntries } from './read-traces.js';
import { getCurrentTraceFile } from './trace-paths.js';
import { RingBuffer } from './ring-buffer.js';

export class TraceBuffer extends EventEmitter {
  constructor(projectName, maxEntries = 100) {
    super();
    this.projectName = projectName;
    this.maxEntries = maxEntries;
    this.buffer = new RingBuffer(maxEntries);
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

    const slice = allTraces.slice(-this.maxEntries);
    this.buffer.clear();
    slice.forEach((t) => this.buffer.push(t));
  }

  async refresh() {
    await this.loadFromFiles();
    this.emit('update');
  }

  getTraces(options) {
    if (typeof options === 'number') {
      return this.buffer.toArray().slice(-options);
    }
    const { limit, filters, search } = options || {};
    let traces = this.buffer.toArray();

    if (filters) {
      traces = traces.filter((entry) => {
        const type =
          entry.kind || entry.noteType || entry.type || 'unknown';
        if (filters[type] === undefined) return true;
        return filters[type];
      });
    }

    if (search) {
      const q = search.toLowerCase();
      traces = traces.filter((e) =>
        JSON.stringify(e).toLowerCase().includes(q)
      );
    }

    return limit ? traces.slice(-limit) : traces;
  }

  search(query) {
    return this.getTraces({ search: query });
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

  /**
   * Manual refresh for historical session data
   * Use when you need to reload archived sessions (rare operation)
   */
  async refreshSessions() {
    await this.loadFromFiles();
    this.emit('update');
  }
}
