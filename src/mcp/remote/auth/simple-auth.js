import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { verifyPassword } from '../../../utils/config.js';

/**
 * Simple single-user authentication for remote MCP server
 * Implements OAuth 2.1 with PKCE for MCP client compatibility
 */
export class SimpleAuth {
  constructor(config) {
    this.username = config.auth.username;
    this.passwordHash = config.auth.password; // Should be bcrypt hash
    this.tokens = new Map(); // access_token -> { userId, scopes, expiresAt }
    this.authCodes = new Map(); // code -> { userId, codeChallenge, expiresAt }
    this.clients = new Map(); // client_id -> client info
    this.sessionTimeout = this.parseTimeout(config.session?.timeout || '1h');
  }

  parseTimeout(timeout) {
    const match = timeout.match(/^(\d+)([hm])$/);
    if (!match) return 3600000; // 1 hour default
    const [, amount, unit] = match;
    const multiplier = unit === 'h' ? 3600000 : 60000;
    return parseInt(amount) * multiplier;
  }

  /**
   * Validate user credentials
   */
  async validateUser(username, password) {
    if (username !== this.username) return null;
    const isValid = await verifyPassword(password, this.passwordHash);
    return isValid ? { id: 'user-1', username } : null;
  }

  /**
   * Generate authorization code for OAuth flow
   */
  generateAuthCode(userId, codeChallenge, codeChallengeMethod = 'S256') {
    const code = uuidv4();
    this.authCodes.set(code, {
      userId,
      codeChallenge,
      codeChallengeMethod,
      expiresAt: Date.now() + 600000, // 10 minutes
    });
    return code;
  }

  /**
   * Exchange authorization code for access token
   */
  exchangeCodeForToken(code, codeVerifier) {
    const authData = this.authCodes.get(code);
    if (!authData) {
      throw new Error('Invalid authorization code');
    }

    if (authData.expiresAt < Date.now()) {
      this.authCodes.delete(code);
      throw new Error('Authorization code expired');
    }

    // Validate PKCE
    if (authData.codeChallenge) {
      let calculatedChallenge;
      if (authData.codeChallengeMethod === 'S256') {
        calculatedChallenge = crypto
          .createHash('sha256')
          .update(codeVerifier)
          .digest('base64url');
      } else {
        calculatedChallenge = codeVerifier;
      }

      if (calculatedChallenge !== authData.codeChallenge) {
        throw new Error('Invalid code verifier');
      }
    }

    // Generate access token
    const accessToken = uuidv4();
    this.tokens.set(accessToken, {
      userId: authData.userId,
      scopes: ['dockashell:read', 'dockashell:write'],
      expiresAt: Date.now() + this.sessionTimeout,
    });

    // Clean up auth code
    this.authCodes.delete(code);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: Math.floor(this.sessionTimeout / 1000),
      scope: 'dockashell:read dockashell:write',
    };
  }

  /**
   * Validate access token
   */
  validateToken(token) {
    const tokenData = this.tokens.get(token);
    if (!tokenData) return null;

    if (tokenData.expiresAt < Date.now()) {
      this.tokens.delete(token);
      return null;
    }

    return {
      userId: tokenData.userId,
      scopes: tokenData.scopes,
      token,
    };
  }

  /**
   * Register OAuth client (required for MCP compatibility)
   */
  registerClient(clientName, redirectUris = []) {
    const clientId = uuidv4();
    this.clients.set(clientId, {
      id: clientId,
      name: clientName,
      redirect_uris: redirectUris,
      created_at: new Date(),
    });
    return {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: 'none',
    };
  }

  /**
   * Get OAuth server metadata (required for MCP discovery)
   */
  getServerMetadata(baseUrl) {
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      registration_endpoint: `${baseUrl}/register`,
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ['dockashell:read', 'dockashell:write'],
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256', 'plain'],
    };
  }

  /**
   * Get protected resource metadata
   */
  getResourceMetadata(baseUrl) {
    return {
      authorization_servers: [
        {
          issuer: baseUrl,
          authorization_endpoint: `${baseUrl}/authorize`,
        },
      ],
    };
  }

  /**
   * Clean up expired tokens and codes
   */
  cleanup() {
    const now = Date.now();

    // Clean expired tokens
    for (const [token, data] of this.tokens.entries()) {
      if (data.expiresAt < now) {
        this.tokens.delete(token);
      }
    }

    // Clean expired auth codes
    for (const [code, data] of this.authCodes.entries()) {
      if (data.expiresAt < now) {
        this.authCodes.delete(code);
      }
    }
  }
}
