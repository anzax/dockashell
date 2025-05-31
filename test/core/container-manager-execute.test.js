import { describe, test } from 'node:test';
import assert from 'node:assert';
import { PassThrough } from 'stream';
import ContainerManager from '../../src/core/container-manager.js';

function createManager(stream) {
  const manager = new ContainerManager({});
  manager.logger = { logCommand: async () => {} };
  manager.docker = {
    getContainer: () => ({
      inspect: async () => ({ State: { Running: true }, Config: {}, Id: 'id' }),
      exec: async ({ Cmd }) => {
        if (Cmd[0] === 'kill') {
          return { start: async () => {} };
        }
        return {
          start: async () => stream,
          inspect: async () => ({ ExitCode: 0, Pid: 123 }),
        };
      },
      modem: {
        demuxStream: (s, stdout, _stderr) => {
          s.on('data', (d) => stdout.write(d));
        },
      },
    }),
  };
  return manager;
}

describe('ContainerManager.executeCommand', () => {
  test('returns partial output on timeout', async () => {
    const stream = new PassThrough();
    const manager = createManager(stream);

    const promise = manager.executeCommand('proj', 'cmd', { timeout: 10 });
    setImmediate(() => {
      stream.emit('data', Buffer.from('partial'));
    });
    const result = await promise;

    assert.strictEqual(result.timedOut, true);
    assert.strictEqual(result.exitCode, -1);
    assert.strictEqual(result.stdout, 'partial');
    assert.strictEqual(result.stderr, 'Command timed out');
  });
});
