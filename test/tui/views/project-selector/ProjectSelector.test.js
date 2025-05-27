import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ProjectSelector } from '../../../../src/tui/views/project-selector/ProjectSelector.js';

describe('ProjectSelector ink-select-input integration', () => {
  let tmpHome;
  let oldHome;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-home-'));
    oldHome = process.env.HOME;
    process.env.HOME = tmpHome;
    const traceDir = path.join(tmpHome, '.dockashell', 'projects', 'proj', 'traces');
    await fs.ensureDir(traceDir);
    await fs.writeFile(path.join(traceDir, 'current.jsonl'), '{}\n');
  });

  afterEach(async () => {
    process.env.HOME = oldHome;
    if (tmpHome) await fs.remove(tmpHome);
  });

  test('renders project list', async () => {
    const { lastFrame } = render(
      React.createElement(ProjectSelector, { onSelect: () => {}, onExit: () => {} })
    );
    await new Promise((r) => setTimeout(r, 50));
    assert.ok(lastFrame().includes('proj'));
  });
});
