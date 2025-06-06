# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing

- `npm test` - Run all unit tests
- `npm run test:integration` - Run integration tests
- `node --test test/specific-file.test.js` - Run single test file

## Architecture Overview

DockaShell is an MCP (Model Context Protocol) server that provides AI agents with isolated Docker containers for secure code execution. The architecture consists of several key layers:

### Core Components

**MCP Server Layer** (`src/mcp/`):

- `mcp-server.js` - Main MCP server implementation with tool registration
- `tools/` - MCP tool implementations (project, execution, logging tools)
- `remote/` - Remote MCP server with web authentication for multi-user scenarios

**Core Management Layer** (`src/core/`):

- `project-manager.js` - Handles project configuration, validation, and devcontainer parsing
- `container-manager.js` - Docker container lifecycle management and execution
- `security.js` - Security policies and command validation

**CLI Layer** (`src/cli/`):

- `cli.js` - Main CLI entry point with command registration
- `commands/` - Individual CLI commands (build, create, start, stop, logs, etc.)
- `utils/` - CLI utilities for Docker operations, validation, and output formatting

**TUI Layer** (`src/tui/`):

- `tui-launcher.js` - Terminal UI entry point
- `app.js` - Main TUI application component
- `components/` - React Ink UI components for project selection, log viewing, etc.
- `stores/` - State management using nanostores for project data, traces, filters

### Key Design Patterns

**Project Isolation**: Each project runs in its own Docker container with persistent state, mounted directories, and port forwarding. Projects are configured via `~/.dockashell/projects/{name}/config.json`.

**Trace Logging**: All agent actions are logged to JSONL files in `~/.dockashell/projects/{name}/traces/` for full auditability and TUI display.

**MCP Tool Architecture**: Tools are organized by domain (project management, execution, logging) and registered with the MCP server. Each tool validates inputs and logs execution traces.

### Configuration Structure

Projects use a schema-validated configuration system:

- Global config: `~/.dockashell/config.json`
- Project config: `~/.dockashell/projects/{name}/config.json`

### Testing Strategy

Tests are organized by layer:

- Unit tests: Test individual components in isolation
- Integration tests: Test MCP tool interactions and container operations
- CLI tests: Test command-line interface and validation logic

When working on this codebase, always run tests and linting before committing changes.

## Before Submitting

**Always run these commands before submitting any changes:**

```bash
npm test           # Run all tests
npm run lint:fix   # Auto-fix linting issues
npm run format     # Format code with Prettier
```
