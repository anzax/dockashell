import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TraceProvider } from '../../src/tui/contexts/trace-context.js';
import { LogViewer } from '../../src/tui/views/log-viewer.js';

describe('LogViewer default selection', () => {
  let tmpHome;
  let oldHome;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-home-'));
    oldHome = process.env.HOME;
    process.env.HOME = tmpHome;
    const traceDir = path.join(
      tmpHome,
      '.dockashell',
      'projects',
      'proj',
      'traces'
    );
    await fs.ensureDir(traceDir);
    await fs.writeFile(
      path.join(traceDir, 'current.jsonl'),
      JSON.stringify({ timestamp: '2025-01-01T00:00:00Z', text: 't1' }) +
        '\n' +
        JSON.stringify({ timestamp: '2025-01-01T00:00:01Z', text: 't2' }) +
        '\n' +
        JSON.stringify({ timestamp: '2025-01-01T00:00:02Z', text: 't3' }) +
        '\n'
    );
  });

  afterEach(async () => {
    process.env.HOME = oldHome;
    if (tmpHome) await fs.remove(tmpHome);
  });

  test('selects last trace on load', async () => {
    let idx = null;
    const { stdin, unmount } = render(
      React.createElement(
        TraceProvider,
        null,
        React.createElement(LogViewer, {
          project: 'proj',
          config: {},
          onBack: () => {},
          onExit: () => {},
          onOpenDetails: ({ currentIndex }) => {
            idx = currentIndex;
          },
        })
      )
    );
    await new Promise((r) => setTimeout(r, 50));
    stdin.write('\r');
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(idx, 2);
    unmount();
  });
});
