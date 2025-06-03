import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

/**
 * Manages MCP transports for both modern (Streamable HTTP) and legacy (HTTP+SSE) clients
 */
export class TransportManager {
  constructor() {
    this.transports = new Map(); // sessionId -> transport
    this.pendingTransports = new Map(); // sessionId -> transport (being initialized)
  }

  /**
   * Create and connect a Streamable HTTP transport
   */
  async createStreamableTransport(sessionId, mcpServer) {
    if (
      this.pendingTransports.has(sessionId) ||
      this.transports.has(sessionId)
    ) {
      return (
        this.pendingTransports.get(sessionId) || this.transports.get(sessionId)
      );
    }

    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true,
      eventSourceEnabled: true,
      onesessioninitialized: (actualId) => {
        this.pendingTransports.delete(actualId);
      },
    });

    // Manually assign session ID
    transport.sessionId = sessionId;

    // Set cleanup handler
    transport.onclose = () => {
      this.transports.delete(sessionId);
    };

    // Track pending transport
    this.pendingTransports.set(sessionId, transport);
    this.transports.set(sessionId, transport);

    try {
      await mcpServer.connect(transport);
      this.pendingTransports.delete(sessionId);
      return transport;
    } catch (error) {
      this.pendingTransports.delete(sessionId);
      this.transports.delete(sessionId);
      throw error;
    }
  }

  /**
   * Create and connect an SSE transport (legacy)
   */
  async createSSETransport(mcpServer, res) {
    const transport = new SSEServerTransport('/messages', res);

    // Store transport for future messages
    this.transports.set(transport.sessionId, transport);

    // Set cleanup handler
    transport.onclose = () => {
      this.transports.delete(transport.sessionId);
    };

    try {
      await mcpServer.connect(transport);
      return transport;
    } catch (error) {
      this.transports.delete(transport.sessionId);
      throw error;
    }
  }

  /**
   * Get existing transport by session ID
   */
  getTransport(sessionId) {
    return this.transports.get(sessionId);
  }

  /**
   * Get pending transport by session ID
   */
  getPendingTransport(sessionId) {
    return this.pendingTransports.get(sessionId);
  }

  /**
   * Remove transport by session ID
   */
  removeTransport(sessionId) {
    const transport = this.transports.get(sessionId);
    if (transport) {
      this.transports.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions() {
    return Array.from(this.transports.keys());
  }

  /**
   * Clean up all transports
   */
  async cleanup() {
    const promises = [];

    for (const transport of this.transports.values()) {
      try {
        if (transport.close) {
          promises.push(transport.close());
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    await Promise.allSettled(promises);
    this.transports.clear();
    this.pendingTransports.clear();
  }

  /**
   * Get transport statistics
   */
  getStats() {
    return {
      activeTransports: this.transports.size,
      pendingTransports: this.pendingTransports.size,
      sessions: Array.from(this.transports.keys()),
    };
  }
}
