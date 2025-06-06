import { RemoteMCPServer } from '../../mcp/remote/remote-mcp-server.js';
import { loadConfig, hashPassword } from '../../utils/config.js';
import { success, info, error as errorColor } from '../utils/output.js';
import { secureInput, textInput } from '../utils/prompts.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export function registerRemoteServe(program) {
  program
    .command('remote')
    .description('Start remote MCP server with authentication')
    .option('-p, --port <port>', 'Port to run server on', '3333')
    .option('--setup-auth', 'Setup initial authentication credentials')
    .action(async (options) => {
      try {
        if (options.setupAuth) {
          await setupAuthentication();
          return;
        }

        // Load configuration
        const config = await loadConfig();

        if (options.port) {
          config.remote_mcp.port = parseInt(options.port);
        }

        // Check if auth is configured
        if (
          !config.remote_mcp.auth.password ||
          config.remote_mcp.auth.password === 'changeme123'
        ) {
          console.log(errorColor('⚠️  Default password detected. Please run:'));
          console.log(info('   dockashell remote --setup-auth'));
          process.exit(1);
        }

        // Start remote server
        const server = new RemoteMCPServer(config);
        await server.start();
      } catch (err) {
        console.error(
          errorColor(`Error starting remote server: ${err.message}`)
        );
        process.exit(1);
      }
    });
}

async function setupAuthentication() {
  try {
    console.log(info('🔐 Setting up DockaShell Remote MCP Authentication'));
    console.log('');

    const username = await textInput('Username:');
    const password = await secureInput('Password:');
    const confirmPassword = await secureInput('Confirm Password:');

    if (password !== confirmPassword) {
      console.log(errorColor('❌ Passwords do not match'));
      process.exit(1);
    }

    if (password.length < 8) {
      console.log(errorColor('❌ Password must be at least 8 characters'));
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update config
    const configDir = path.join(os.homedir(), '.dockashell');
    const configPath = path.join(configDir, 'config.json');

    let config = {};
    if (await fs.pathExists(configPath)) {
      config = await fs.readJSON(configPath);
    }

    if (!config.remote_mcp) config.remote_mcp = {};
    if (!config.remote_mcp.auth) config.remote_mcp.auth = {};

    config.remote_mcp.auth.username = username;
    config.remote_mcp.auth.password = hashedPassword;

    await fs.writeJSON(configPath, config, { spaces: 2 });

    console.log('');
    console.log(success('✅ Authentication configured successfully!'));
    console.log('');
    console.log(info('Start the remote server with:'));
    console.log('   dockashell remote');
    console.log('');
  } catch (err) {
    console.error(errorColor(`Setup failed: ${err.message}`));
    process.exit(1);
  }
}
