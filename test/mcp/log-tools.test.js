import { describe, test } from 'node:test';
import assert from 'node:assert';
import { registerLogTools } from '../../src/mcp/tools/log-tools.js';

function createServer() {
  return {
    tools: {},
    tool(name, description, schema, handler) {
      // Handle both 3-param (old) and 4-param (new) formats
      if (typeof description === 'function') {
        // 3-param format: tool(name, schema, handler)
        this.tools[name] = { handler: description };
      } else if (typeof schema === 'function') {
        // 4-param format: tool(name, description, schema, handler)
        this.tools[name] = { handler: schema };
      } else {
        // 4-param format: tool(name, description, schema, handler)
        this.tools[name] = { handler };
      }
    },
  };
}

describe('log-tools', () => {
  test('registers tools', () => {
    const server = createServer();
    registerLogTools(server, {});
    assert.ok(server.tools.write_trace);
    assert.ok(server.tools.read_traces);
  });

  test('write_trace records note', async () => {
    const server = createServer();
    const logger = { logNote: async () => {} };
    registerLogTools(server, logger);
    const res = await server.tools.write_trace.handler({
      project_name: 'p',
      type: 'user',
      text: 'hi',
    });
    assert.deepStrictEqual(res, {
      content: [{ type: 'text', text: 'Trace recorded' }],
    });
  });

  test('write_trace error bubbles', async () => {
    const server = createServer();
    const logger = {
      logNote: async () => {
        throw new Error('oops');
      },
    };
    registerLogTools(server, logger);
    await assert.rejects(
      server.tools.write_trace.handler({
        project_name: 'p',
        type: 'user',
        text: 'x',
      }),
      /Failed to write trace: oops/
    );
  });

  test('read_traces returns formatted text', async () => {
    const server = createServer();
    const logger = {
      readTraces: async () => [
        {
          timestamp: 't',
          kind: 'command',
          command: 'ls',
          result: { exitCode: 0 },
        },
      ],
    };
    registerLogTools(server, logger);
    const res = await server.tools.read_traces.handler({ project_name: 'p' });
    assert.ok(res.content[0].text.includes('[COMMAND]'));
  });

  test('read_traces error bubbles', async () => {
    const server = createServer();
    const logger = {
      readTraces: async () => {
        throw new Error('bad');
      },
    };
    registerLogTools(server, logger);
    await assert.rejects(
      server.tools.read_traces.handler({ project_name: 'p' }),
      /Failed to read traces: bad/
    );
  });

  test('truncates output and reports length', async () => {
    const server = createServer();
    const logger = {
      readTraces: async () => [
        {
          timestamp: 't',
          kind: 'command',
          command: 'ls',
          result: { exitCode: 0, output: 'abcdef' },
        },
      ],
    };
    registerLogTools(server, logger);
    const res = await server.tools.read_traces.handler({
      project_name: 'p',
      fields: ['timestamp', 'type', 'content', 'exit_code', 'output'],
      output_max_len: 3,
    });
    const text = res.content[0].text;
    assert.ok(text.includes('output_chars=6'));
    assert.ok(text.includes('abc'));
    assert.ok(!text.includes('def'));
  });

  test('uses default preview length', async () => {
    const long = 'x'.repeat(1200);
    const server = createServer();
    const logger = {
      readTraces: async () => [
        {
          timestamp: 't',
          kind: 'command',
          command: 'ls',
          result: { exitCode: 0, output: long },
        },
      ],
    };
    registerLogTools(server, logger);
    const res = await server.tools.read_traces.handler({
      project_name: 'p',
      fields: ['timestamp', 'type', 'content', 'exit_code', 'output'],
    });
    const text = res.content[0].text;
    assert.ok(text.includes('output_chars=1200'));
    assert.ok(text.includes('x'.repeat(1000)));
    assert.ok(!text.includes('x'.repeat(1001)));
  });
});
