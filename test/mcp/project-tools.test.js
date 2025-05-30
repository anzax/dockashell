import { describe, test } from 'node:test';
import assert from 'node:assert';
import { registerProjectTools } from '../../src/mcp/tools/project-tools.js';

function createServer() {
  return {
    tools: {},
    tool(name, _schema, handler) {
      this.tools[name] = { handler };
    },
  };
}

describe('project-tools', () => {
  test('registers tools', () => {
    const server = createServer();
    registerProjectTools(server, {}, {});
    assert.ok(server.tools.list_projects);
    assert.ok(server.tools.start_project);
    assert.ok(server.tools.stop_project);
    assert.ok(server.tools.project_status);
  });

  test('list_projects no projects', async () => {
    const server = createServer();
    const pm = { listProjects: async () => [] };
    registerProjectTools(server, pm, {});
    const res = await server.tools.list_projects.handler();
    assert.ok(res.content[0].text.includes('No projects configured'));
  });

  test('start_project success', async () => {
    const server = createServer();
    const pm = {
      loadProject: async () => ({ image: 'img', mounts: [], ports: [] }),
      listProjects: async () => [],
    };
    const cm = {
      startContainer: async () => ({
        containerId: 'id',
        status: 'running',
        ports: [],
      }),
    };
    registerProjectTools(server, pm, cm);
    const res = await server.tools.start_project.handler({ project_name: 'p' });
    assert.ok(res.content[0].text.includes('# Project Started: p'));
  });

  test('project_status not found', async () => {
    const server = createServer();
    const cm = { getStatus: async () => ({ status: 'not_found' }) };
    registerProjectTools(server, {}, cm);
    const res = await server.tools.project_status.handler({
      project_name: 'p',
    });
    assert.ok(res.content[0].text.includes('Container not found'));
  });
});
