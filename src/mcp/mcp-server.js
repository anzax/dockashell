#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerProjectTools } from './tools/project-tools.js';
import { registerExecutionTools } from './tools/execution-tools.js';
import { registerLogTools } from './tools/log-tools.js';
import ProjectManager from '../core/project-manager.js';
import ContainerManager from '../core/container-manager.js';
import SecurityManager from '../core/security.js';
import Logger from '../utils/logger.js';

class DockashellServer {
  constructor() {
    this.server = new McpServer({
      name: 'dockashell',
      version: '0.1.0',
    });

    this.projectManager = new ProjectManager();
    this.logger = new Logger();
    this.containerManager = new ContainerManager(this.projectManager);
    this.securityManager = new SecurityManager();
    this.transport = null;
  }

  async initialize() {
    await this.projectManager.initialize();
    this.setupTools();
    this.setupCleanupHandlers();
  }
  setupTools() {
    registerProjectTools(
      this.server,
      this.projectManager,
      this.containerManager
    );
    registerExecutionTools(
      this.server,
      this.projectManager,
      this.containerManager,
      this.securityManager
    );
    registerLogTools(this.server, this.logger);
  }

  async cleanup() {
    try {
      await this.server.close();
    } catch {
      // Ignore errors during close
    }
    await this.containerManager.cleanup();
    await this.logger.cleanup();
  }

  setupCleanupHandlers() {
    const exitHandler = async () => {
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);
    process.on('SIGQUIT', exitHandler);
    process.stdin.on('end', exitHandler);
    process.stdin.on('close', exitHandler);
  }

  async run() {
    await this.initialize();

    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);

    // console.log("DockaShell MCP server started");
  }
}

// Export the class for testing
export default DockashellServer;

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new DockashellServer();
  server.run().catch(console.error);
}
