import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { LogViewer } from '../../src/tui/views/log-viewer/LogViewer.js';

describe('LogViewer callback triggers', () => {
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
      JSON.stringify({ timestamp: '2025-01-01T00:00:00Z', text: 't' }) + '\n'
    );
  });

  afterEach(async () => {
    process.env.HOME = oldHome;
    if (tmpHome) await fs.remove(tmpHome);
  });

  test('opens filter and details views via callbacks', async () => {
    let filterCalled = false;
    let detailCalled = false;
    let detailIndex = null;
    const { stdin, unmount } = render(
      React.createElement(LogViewer, {
        project: 'proj',
        config: {},
        onBack: () => {},
        onExit: () => {},
        onOpenFilter: () => {
          filterCalled = true;
        },
        onOpenDetails: ({ currentIndex }) => {
          detailCalled = true;
          detailIndex = currentIndex;
        },
      })
    );
    await new Promise((r) => setTimeout(r, 50));
    stdin.write('f');
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(filterCalled);
    stdin.write('\r');
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(detailCalled);
    assert.strictEqual(detailIndex, 0);
    unmount();
  });
});
