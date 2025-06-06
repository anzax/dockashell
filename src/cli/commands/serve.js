import DockashellServer from '../../mcp/mcp-server.js';
import { error as errorColor } from '../utils/output.js';

export function registerServe(program) {
  program
    .command('serve')
    .description('Start MCP server')
    .option('-v, --verbose', 'Enable debug logging')
    .action(async () => {
      try {
        const server = new DockashellServer();
        await server.run();
      } catch (err) {
        console.error(errorColor(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}
