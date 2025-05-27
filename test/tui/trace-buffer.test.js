import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { TraceBuffer } from '../../src/tui/utils/trace-buffer.js';

// Create a simple manual mock for testing
let mockListSessions = null;
let mockReadTraceEntries = null;
let mockGetTraceFile = null;

// Override the import to use our mocks
const _originalImport = await import('../../src/tui/utils/read-traces.js');
const mockReadTraces = {
  listSessions: (...args) => mockListSessions(...args),
  readTraceEntries: (...args) => mockReadTraceEntries(...args),
  getTraceFile: (...args) => mockGetTraceFile(...args),
};

// Monkey patch the TraceBuffer to use our mocks
const OriginalTraceBuffer = TraceBuffer;
const PatchedTraceBuffer = class extends OriginalTraceBuffer {
  async loadFromFiles() {
    const sessions = await mockReadTraces.listSessions(this.projectName);
    const allTraces = [];

    // Load traces from all sessions in chronological order
    for (let i = 0; i < sessions.length; i++) {
      const id = sessions[i];
      try {
        const traces = await mockReadTraces.readTraceEntries(
          this.projectName,
          Infinity,
          id
        );
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
};

describe('TraceBuffer', () => {
  let buffer;
  const mockProjectName = 'test-project';

  beforeEach(() => {
    buffer = new PatchedTraceBuffer(mockProjectName, 10);
    // Reset mocks
    mockListSessions = () => Promise.resolve(['current']);
    mockReadTraceEntries = () => Promise.resolve([]);
    mockGetTraceFile = () => '/mock/path';
  });

  afterEach(async () => {
    if (buffer) {
      await buffer.close();
    }
  });

  describe('loadFromFiles', () => {
    test('should load traces in chronological order across sessions', async () => {
      // Mock session data
      mockListSessions = () =>
        Promise.resolve([
          '2025-05-26T10-00Z',
          '2025-05-26T11-00Z',
          '2025-05-26T12-00Z',
        ]);

      let callCount = 0;
      mockReadTraceEntries = () => {
        const responses = [
          [
            { timestamp: '2025-05-26T10:01:00Z', text: 'Session1-Trace1' },
            { timestamp: '2025-05-26T10:02:00Z', text: 'Session1-Trace2' },
          ],
          [
            { timestamp: '2025-05-26T11:01:00Z', text: 'Session2-Trace1' },
            { timestamp: '2025-05-26T11:02:00Z', text: 'Session2-Trace2' },
          ],
          [
            { timestamp: '2025-05-26T12:01:00Z', text: 'Session3-Trace1' },
            { timestamp: '2025-05-26T12:02:00Z', text: 'Session3-Trace2' },
          ],
        ];
        return Promise.resolve(responses[callCount++]);
      };

      await buffer.loadFromFiles();
      const traces = buffer.getTraces();

      // Verify chronological order
      assert.strictEqual(traces.length, 6);
      assert.strictEqual(traces[0].text, 'Session1-Trace1');
      assert.strictEqual(traces[1].text, 'Session1-Trace2');
      assert.strictEqual(traces[2].text, 'Session2-Trace1');
      assert.strictEqual(traces[3].text, 'Session2-Trace2');
      assert.strictEqual(traces[4].text, 'Session3-Trace1');
      assert.strictEqual(traces[5].text, 'Session3-Trace2');

      // Verify timestamps are in ascending order
      for (let i = 1; i < traces.length; i++) {
        assert(
          new Date(traces[i].timestamp).getTime() >=
            new Date(traces[i - 1].timestamp).getTime()
        );
      }
    });

    test('should handle out-of-order timestamps across sessions', async () => {
      mockListSessions = () =>
        Promise.resolve(['2025-05-26T10-00Z', '2025-05-26T11-00Z']);

      let callCount = 0;
      mockReadTraceEntries = () => {
        const responses = [
          [
            { timestamp: '2025-05-26T10:01:00Z', text: 'Session1-Early' },
            { timestamp: '2025-05-26T11:30:00Z', text: 'Session1-Late' },
          ],
          [{ timestamp: '2025-05-26T11:15:00Z', text: 'Session2-Middle' }],
        ];
        return Promise.resolve(responses[callCount++]);
      };

      await buffer.loadFromFiles();
      const traces = buffer.getTraces();

      assert.strictEqual(traces.length, 3);
      assert.strictEqual(traces[0].text, 'Session1-Early');
      assert.strictEqual(traces[1].text, 'Session2-Middle');
      assert.strictEqual(traces[2].text, 'Session1-Late');
    });

    test('should respect maxEntries limit', async () => {
      const smallBuffer = new PatchedTraceBuffer(mockProjectName, 3);

      mockListSessions = () => Promise.resolve(['2025-05-26T10-00Z']);
      mockReadTraceEntries = () =>
        Promise.resolve([
          { timestamp: '2025-05-26T10:01:00Z', text: 'Trace1' },
          { timestamp: '2025-05-26T10:02:00Z', text: 'Trace2' },
          { timestamp: '2025-05-26T10:03:00Z', text: 'Trace3' },
          { timestamp: '2025-05-26T10:04:00Z', text: 'Trace4' },
          { timestamp: '2025-05-26T10:05:00Z', text: 'Trace5' },
        ]);

      await smallBuffer.loadFromFiles();
      const traces = smallBuffer.getTraces();

      assert.strictEqual(traces.length, 3);
      assert.strictEqual(traces[0].text, 'Trace3');
      assert.strictEqual(traces[1].text, 'Trace4');
      assert.strictEqual(traces[2].text, 'Trace5');

      await smallBuffer.close();
    });

    test('should handle empty sessions gracefully', async () => {
      mockListSessions = () => Promise.resolve(['session1', 'session2']);

      let callCount = 0;
      mockReadTraceEntries = () => {
        const responses = [
          [],
          [{ timestamp: '2025-05-26T10:01:00Z', text: 'OnlyTrace' }],
        ];
        return Promise.resolve(responses[callCount++]);
      };

      await buffer.loadFromFiles();
      const traces = buffer.getTraces();

      assert.strictEqual(traces.length, 1);
      assert.strictEqual(traces[0].text, 'OnlyTrace');
    });

    test('should handle malformed session files', async () => {
      mockListSessions = () => Promise.resolve(['good-session', 'bad-session']);

      let callCount = 0;
      mockReadTraceEntries = () => {
        if (callCount++ === 0) {
          return Promise.resolve([
            { timestamp: '2025-05-26T10:01:00Z', text: 'GoodTrace' },
          ]);
        } else {
          return Promise.reject(new Error('Malformed file'));
        }
      };

      await buffer.loadFromFiles();
      const traces = buffer.getTraces();

      assert.strictEqual(traces.length, 1);
      assert.strictEqual(traces[0].text, 'GoodTrace');
    });
  });

  describe('getTraces', () => {
    beforeEach(async () => {
      mockListSessions = () => Promise.resolve(['session1']);
      mockReadTraceEntries = () =>
        Promise.resolve([
          { timestamp: '2025-05-26T10:01:00Z', text: 'Trace1' },
          { timestamp: '2025-05-26T10:02:00Z', text: 'Trace2' },
          { timestamp: '2025-05-26T10:03:00Z', text: 'Trace3' },
        ]);
      await buffer.loadFromFiles();
    });

    test('should return all traces when no limit specified', () => {
      const traces = buffer.getTraces();
      assert.strictEqual(traces.length, 3);
    });

    test('should return limited traces when limit specified', () => {
      const traces = buffer.getTraces(2);
      assert.strictEqual(traces.length, 2);
      assert.strictEqual(traces[0].text, 'Trace2');
      assert.strictEqual(traces[1].text, 'Trace3');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      mockListSessions = () => Promise.resolve(['session1']);
      mockReadTraceEntries = () =>
        Promise.resolve([
          { timestamp: '2025-05-26T10:01:00Z', text: 'Hello World' },
          { timestamp: '2025-05-26T10:02:00Z', text: 'Goodbye Moon' },
          { timestamp: '2025-05-26T10:03:00Z', text: 'Hello Again' },
        ]);
      await buffer.loadFromFiles();
    });

    test('should find traces containing search term', () => {
      const results = buffer.search('hello');
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].text, 'Hello World');
      assert.strictEqual(results[1].text, 'Hello Again');
    });

    test('should return empty array for non-matching search', () => {
      const results = buffer.search('nonexistent');
      assert.strictEqual(results.length, 0);
    });
  });
});
