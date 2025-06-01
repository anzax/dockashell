import { describe, test } from 'node:test';
import assert from 'node:assert';
import { registerExecutionTools } from '../../src/mcp/tools/execution-tools.js';

function createServer() {
  return {
    tools: {},
    tool(name, _schema, handler) {
      this.tools[name] = { handler };
    },
  };
}

describe('execution-tools', () => {
  test('registers tools', () => {
    const server = createServer();
    registerExecutionTools(server, {}, {}, {});
    assert.ok(server.tools.bash);
    assert.ok(server.tools.apply_patch);
    assert.ok(server.tools.write_file);
  });

  test('bash success', async () => {
    const server = createServer();
    const pm = { loadProject: async () => ({}) };
    const cm = {
      executeCommand: async () => ({
        exitCode: 0,
        success: true,
        stdout: 'ok',
        stderr: '',
        timedOut: false,
      }),
    };
    const sm = { validateCommand: () => {}, getMaxExecutionTime: () => 1 };
    registerExecutionTools(server, pm, cm, sm);
    const result = await server.tools.bash.handler({
      project_name: 'proj',
      command: 'ls',
    });
    assert.strictEqual(result.isError, undefined);
    assert.ok(result.content[0].text.includes('**Exit Code:** 0'));
  });

  test('bash failure response', async () => {
    const server = createServer();
    const pm = { loadProject: async () => ({}) };
    const cm = {
      executeCommand: async () => ({ success: false, exitCode: 1 }),
    };
    const sm = { validateCommand: () => {}, getMaxExecutionTime: () => 1 };
    registerExecutionTools(server, pm, cm, sm);
    const res = await server.tools.bash.handler({
      project_name: 'p',
      command: 'ls',
    });
    assert.strictEqual(res.isError, true);
  });

  test('bash invalid command throws', async () => {
    const server = createServer();
    registerExecutionTools(server, {}, {}, {});
    await assert.rejects(
      server.tools.bash.handler({ project_name: 'p', command: '' }),
      /Command must be a non-empty string/
    );
  });

  test('apply_patch success', async () => {
    const server = createServer();
    const pm = { loadProject: async () => ({}) };
    const cm = {
      applyPatch: async () => ({ exitCode: 0, success: true }),
    };
    registerExecutionTools(server, pm, cm, {});
    const res = await server.tools.apply_patch.handler({
      project_name: 'p',
      patch: 'diff',
    });
    assert.strictEqual(res.isError, undefined);
    assert.ok(res.content[0].text.includes('**Exit Code:** 0'));
  });

  test('write_file invalid path throws', async () => {
    const server = createServer();
    registerExecutionTools(server, {}, {}, {});
    await assert.rejects(
      server.tools.write_file.handler({ project_name: 'p', path: null }),
      /Path must be a non-empty string/
    );
  });
});
