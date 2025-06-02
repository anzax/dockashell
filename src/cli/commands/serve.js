import DockashellServer from '../../mcp/mcp-server.js';

export function registerServe(program) {
  program
    .command('serve')
    .description('Start MCP server')
    .option('--http', 'Start HTTP server (coming soon)')
    .option('-v, --verbose', 'Enable debug logging')
    .action(async () => {
      const server = new DockashellServer();
      await server.run();
    });
}
