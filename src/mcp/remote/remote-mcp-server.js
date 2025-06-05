import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import ContainerManager from '../../core/container-manager.js';
import ProjectManager from '../../core/project-manager.js';
import SecurityManager from '../../core/security.js';
import Logger from '../../utils/logger.js';
import { registerExecutionTools } from '../tools/execution-tools.js';
import { registerLogTools } from '../tools/log-tools.js';
import { registerProjectTools } from '../tools/project-tools.js';
import { SimpleAuth } from './auth/simple-auth.js';
import { TransportManager } from './transport/transport-manager.js';

/**
 * Remote MCP Server with simple single-user authentication
 */
export class RemoteMCPServer {
  constructor(config) {
    this.config = config.remote_mcp;
    this.app = express();
    this.auth = new SimpleAuth(this.config);
    this.transportManager = new TransportManager();

    // DockaShell core components
    this.projectManager = new ProjectManager();
    this.logger = new Logger();
    this.containerManager = new ContainerManager(this.projectManager);
    this.securityManager = new SecurityManager();

    // MCP Server
    this.mcpServer = new McpServer({
      name: 'dockashell-remote',
      version: '0.1.0',
      instructions: 'Remote DockaShell MCP server with authentication',
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupCleanup();
  }

  async initialize() {
    await this.projectManager.initialize();
    this.setupMCPTools();
  }

  setupMiddleware() {
    // CORS
    this.app.use(
      cors({
        origin:
          this.config.cors.origin === '*' ? true : this.config.cors.origin,
        credentials: this.config.cors.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        exposedHeaders: ['MCP-Session-ID', 'WWW-Authenticate'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'MCP-Session-ID',
          'mcp-protocol-version',
          'mcp-client-info',
          'mcp-client-version',
          'user-agent',
          'accept',
          'cf-ray',
          'cf-connecting-ip',
          'x-mcp-*',
        ],
        optionsSuccessStatus: 200,
        preflightContinue: false,
      })
    );

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Debug CORS issues in development
    if (process.env.NODE_ENV !== 'production') {
      this.app.use((req, _res, next) => {
        if (req.method === 'OPTIONS') {
          console.log('CORS Preflight Request:', {
            origin: req.headers.origin,
            method: req.headers['access-control-request-method'],
            headers: req.headers['access-control-request-headers'],
          });
        }
        next();
      });
    }
  }

  setupMCPTools() {
    registerProjectTools(
      this.mcpServer,
      this.projectManager,
      this.containerManager
    );
    registerExecutionTools(
      this.mcpServer,
      this.projectManager,
      this.containerManager,
      this.securityManager
    );
    registerLogTools(this.mcpServer, this.logger);
  }

  setupRoutes() {
    // OAuth Discovery endpoints
    this.app.get('/.well-known/oauth-protected-resource', (req, res) => {
      const baseUrl = this.getBaseUrl(req);
      res.json(this.auth.getResourceMetadata(baseUrl));
    });

    this.app.get('/.well-known/oauth-authorization-server', (req, res) => {
      const baseUrl = this.getBaseUrl(req);
      res.json(this.auth.getServerMetadata(baseUrl));
    });

    // OAuth endpoints
    this.app.get('/authorize', this.handleAuthorize.bind(this));
    this.app.post('/callback', this.handleCallback.bind(this));
    this.app.post('/token', this.handleToken.bind(this));
    this.app.post('/register', this.handleRegister.bind(this));

    // Modern MCP endpoint (Streamable HTTP)
    this.app.post('/mcp', this.handleMCPRequest.bind(this));
    this.app.delete('/mcp', this.handleMCPDelete.bind(this));

    // Legacy MCP endpoints (HTTP+SSE)
    this.app.get('/mcp', this.handleSSEConnection.bind(this));
    this.app.post('/messages', this.handleSSEMessage.bind(this));

    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        version: '0.1.0',
        transport_stats: this.transportManager.getStats(),
      });
    });
  }

  async handleAuthorize(req, res) {
    const {
      code_challenge,
      code_challenge_method,
      state,
      redirect_uri,
      client_id,
    } = req.query;

    // Serve simple login page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DockaShell - Login</title>
          <style>
            body { font-family: system-ui; max-width: 400px; margin: 100px auto; padding: 20px; }
            .form-group { margin: 15px 0; }
            input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
            button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .error { color: red; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h2>DockaShell Authentication</h2>
          <form onsubmit="handleLogin(event)">
            <div class="form-group">
              <input type="text" id="username" placeholder="Username" required>
            </div>
            <div class="form-group">
              <input type="password" id="password" placeholder="Password" required>
            </div>
            <button type="submit">Login & Authorize</button>
          </form>
          <div id="error" class="error"></div>
          
          <script>
            async function handleLogin(e) {
              e.preventDefault();
              const username = document.getElementById('username').value;
              const password = document.getElementById('password').value;
              const errorDiv = document.getElementById('error');
              
              try {
                const response = await fetch('/callback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    username,
                    password,
                    code_challenge: '${code_challenge}',
                    code_challenge_method: '${code_challenge_method}',
                    state: '${state}',
                    redirect_uri: '${redirect_uri}',
                    client_id: '${client_id}'
                  })
                });
                
                const result = await response.json();
                if (response.ok) {
                  window.location.href = result.redirect_url;
                } else {
                  errorDiv.textContent = result.error || 'Login failed';
                }
              } catch (err) {
                errorDiv.textContent = 'Network error: ' + err.message;
              }
            }
          </script>
        </body>
      </html>
    `);
  }

  async handleCallback(req, res) {
    try {
      const {
        username,
        password,
        code_challenge,
        code_challenge_method,
        state,
        redirect_uri,
      } = req.body;

      // Validate user
      const user = await this.auth.validateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate authorization code
      const authCode = this.auth.generateAuthCode(
        user.id,
        code_challenge,
        code_challenge_method
      );

      // Build redirect URL
      const redirectUrl = new URL(
        redirect_uri || 'http://localhost:3000/callback'
      );
      redirectUrl.searchParams.set('code', authCode);
      if (state) redirectUrl.searchParams.set('state', state);

      res.json({ redirect_url: redirectUrl.toString() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleToken(req, res) {
    try {
      const { code, code_verifier, grant_type } = req.body;

      if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
      }

      const tokenData = this.auth.exchangeCodeForToken(code, code_verifier);
      res.json(tokenData);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async handleRegister(req, res) {
    try {
      const { client_name, redirect_uris = [] } = req.body;
      const clientData = this.auth.registerClient(client_name, redirect_uris);
      res.status(201).json(clientData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleMCPRequest(req, res) {
    const authResult = await this.authenticateRequest(req, res);
    if (!authResult.success) return;

    const body = req.body;
    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId = Array.isArray(sessionIdHeader)
      ? sessionIdHeader[0]
      : sessionIdHeader;
    const isInitRequest = body && body.method === 'initialize';

    let transport;
    let effectiveSessionId;

    try {
      if (isInitRequest) {
        effectiveSessionId = uuidv4();
        transport = await this.transportManager.createStreamableTransport(
          effectiveSessionId,
          this.mcpServer
        );
        res.setHeader('mcp-session-id', effectiveSessionId);
      } else if (sessionId) {
        transport =
          this.transportManager.getTransport(sessionId) ||
          this.transportManager.getPendingTransport(sessionId);
        if (!transport) {
          return res.status(404).json({
            jsonrpc: '2.0',
            error: { code: -32001, message: 'Session not found' },
            id: body?.id || null,
          });
        }
        effectiveSessionId = sessionId;
      } else {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32003,
            message: 'No session ID for non-initialize request',
          },
          id: body?.id || null,
        });
      }

      req.headers['mcp-session-id'] = effectiveSessionId;
      res.setHeader('mcp-session-id', effectiveSessionId);

      await transport.handleRequest(req, res, body);
    } catch {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: body?.id || null,
        });
      }
    }
  }

  async handleMCPDelete(req, res) {
    const authResult = await this.authenticateRequest(req, res);
    if (!authResult.success) return;

    const sessionId = req.headers['mcp-session-id'];
    if (this.transportManager.removeTransport(sessionId)) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  }

  async handleSSEConnection(req, res) {
    const authResult = await this.authenticateRequest(req, res);
    if (!authResult.success) return;

    try {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const transport = await this.transportManager.createSSETransport(
        this.mcpServer,
        res
      );
      res.setHeader('MCP-Session-ID', transport.sessionId);
    } catch {
      if (!res.headersSent) {
        res.status(500).send('Internal server error during SSE setup');
      }
    }
  }

  async handleSSEMessage(req, res) {
    const authResult = await this.authenticateRequest(req, res);
    if (!authResult.success) return;

    const sessionId = req.query.sessionId;
    const body = req.body;

    if (!sessionId) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Missing sessionId' },
        id: body?.id || null,
      });
    }

    const transport = this.transportManager.getTransport(sessionId);
    if (!transport) {
      return res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session not found' },
        id: body?.id || null,
      });
    }

    try {
      await transport.handlePostMessage(req, res, body);
    } catch {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Error handling message' },
          id: body?.id || null,
        });
      }
    }
  }

  async authenticateRequest(req, res) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const baseUrl = this.getBaseUrl(req);

    if (!token) {
      const wwwAuthHeader = `Bearer realm="DockaShell MCP", resource_metadata_uri="${baseUrl}/.well-known/oauth-protected-resource"`;
      res
        .status(401)
        .header('WWW-Authenticate', wwwAuthHeader)
        .json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Missing Bearer token' },
          id: null,
        });
      return { success: false };
    }

    const authData = this.auth.validateToken(token);
    if (!authData) {
      res.status(403).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Invalid or expired token' },
        id: null,
      });
      return { success: false };
    }

    req.auth = authData;
    return { success: true, authData };
  }

  getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${protocol}://${host}`;
  }

  setupCleanup() {
    const cleanup = async () => {
      await this.transportManager.cleanup();
      await this.containerManager.cleanup();
      await this.logger.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGQUIT', cleanup);

    // Periodic cleanup
    setInterval(() => {
      this.auth.cleanup();
    }, 300000); // 5 minutes
  }

  async start() {
    await this.initialize();

    const server = this.app.listen(this.config.port, () => {
      console.log(
        `DockaShell Remote MCP Server started on port ${this.config.port}`
      );
      console.log(`Health check: http://localhost:${this.config.port}/health`);
      console.log(
        `OAuth discovery: http://localhost:${this.config.port}/.well-known/oauth-authorization-server`
      );
    });

    return server;
  }
}
