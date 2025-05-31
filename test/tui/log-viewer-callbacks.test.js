import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { resetTraceSelection } from '../../src/tui/stores/trace-selection-store.js';
import { LogViewer } from '../../src/tui/views/log-viewer.js';
import { setActiveProject } from '../../src/tui/stores/project-store.js';
import { $uiState } from '../../src/tui/stores/ui-store.js';

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
    setActiveProject('proj');
  });

  afterEach(async () => {
    process.env.HOME = oldHome;
    if (tmpHome) await fs.remove(tmpHome);
    setActiveProject(null);
  });

  test('updates activeView on key presses', async () => {
    resetTraceSelection();
    const { stdin, unmount } = render(React.createElement(LogViewer));
    await new Promise((r) => setTimeout(r, 50));
    stdin.write('f');
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual($uiState.get().activeView, 'filter');
    stdin.write('\r');
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual($uiState.get().activeView, 'details');
    unmount();
  });
});
