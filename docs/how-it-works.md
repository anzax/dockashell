# How DockaShell Works

This document explains DockaShell's architecture, security model, and technical implementation.

## Architecture Overview

```
AI Agent (Claude/GPT/...)
  ↔ DockaShell (MCP Server)
      └─ Docker Engine
          ├─ Container A (Project 1)
          │    └─ Persistent Volume
          ├─ Container B (Project 2)
          │    └─ Persistent Volume
          └─ Container C (Project 3)
               └─ Persistent Volume
```

Each project gets its own isolated Docker container with a persistent volume for data that survives container restarts.

## Container Design

### Default Development Image

DockaShell uses a standard development image (`dockashell/default-dev:latest`) based on Microsoft's DevContainer Python 3.12 base:

- **Python 3.12** with pip and development tools
- **Node.js 20 LTS** with npm, yarn, pnpm via corepack
- **Essential CLI tools**: ripgrep, jq, git-lfs, build-essential, curl
- **Non-root user**: vscode (UID 1000) with sudo access
- **Working directory**: `/workspace` (mounted from host)

### Container Lifecycle

1. **Creation**: Container created from default image with project-specific configuration
2. **Startup**: Container starts with mounted volumes and configured ports
3. **Persistence**: Container keeps running between command executions
4. **Restart**: Container can be stopped/restarted without losing data
5. **Cleanup**: Container can be removed while preserving data volumes

## Security Model

DockaShell's security relies on Docker's proven container isolation rather than command filtering or sandboxing.

### Isolation Boundaries

- **Process isolation**: Container processes separated from host
- **Filesystem isolation**: Container filesystem independent of host
- **Network isolation**: Controlled network access via Docker networking
- **User isolation**: Containers run as non-root user (UID 1000)
- **Resource limits**: Memory and CPU constraints via Docker

### Execution Controls

- **Command timeouts**: All commands automatically terminated after configured limit
- **Audit logging**: Every command execution logged with timestamps and exit codes
- **Containers management**: Containers can be stopped, restarted, or destroyed
- **Volume persistence**: Data persists in Docker volumes even when containers are removed

### What's Protected

- **Host filesystem**: Container cannot access files outside mounted volumes
- **Host processes**: Container processes isolated from host processes
- **Network access**: Container network access controlled by Docker
- **System resources**: Resource usage limited by Docker constraints

### What's Not Protected

- **Container contents**: Agents have full control within their container
- **Mounted volumes**: Agents can modify any files in mounted project directories
- **Network within limits**: Agents can make network requests (if enabled)
- **Resource consumption**: Agents can use resources up to configured limits

## Trace System

DockaShell tracks all agent activity through structured trace files.

### Trace Storage

- **Location**: `~/.dockashell/projects/{project}/traces/current.jsonl`
- **Format**: JSON Lines (one JSON object per line)
- **Session rotation**: New session starts after 4+ hours of inactivity
- **Persistence**: Traces survive container restarts and DockaShell restarts

### Trace Types

```json
// Tool execution
{"id":"tr_123","tool":"bash","trace_type":"execution","command":"npm start","result":{"exitCode":0}}

// Agent reasoning
{"id":"tr_456","tool":"write_trace","trace_type":"observation","type":"agent","text":"Planning React app"}

// User input
{"id":"tr_789","tool":"write_trace","trace_type":"observation","type":"user","text":"Build a todo app"}
```

### Trace Observability

- **Real-time TUI**: `dockashell logs` shows live trace activity
- **Historical queries**: `read_traces` tool lets agents query past activity
- **Searchable**: Traces can be filtered by type, time range, or content

## MCP Integration

DockaShell implements the Model Context Protocol (MCP) standard for AI tool integration.

### Transport

- **Local**: STDIO transport for local MCP clients
- **Remote** (experimental): HTTP transport with OAuth2 authentication

### Tool Categories

- **Project management**: `list_projects`, `start_project`, `stop_project`
- **Shell execution**: `bash` with full command line support
- **File operations**: `write_file`, `apply_patch` with context matching
- **Trace operations**: `write_trace`, `read_traces` for agent memory

### Tool Design Philosophy

DockaShell favors general-purpose tools (like `bash`) over specialized tools. This lets agents use standard POSIX commands and build their own workflows rather than being limited to predefined operations.

## Performance Considerations

### Container Reuse

- Containers stay running between commands to avoid startup overhead
- Base image is cached and shared across all projects
- Only project-specific data is unique per container

### Resource Management

- Containers can be stopped when not in use to save resources
- Resource limits prevent runaway processes
- Trace files are capped to prevent unlimited growth

### Scaling

- Each project is independent - supports multiple concurrent projects
- No shared state between projects beyond the base image
- Can run on any system with Docker support

## Configuration

DockaShell uses layered configuration:

1. **Global defaults**: System-wide settings in `~/.dockashell/config.json`
2. **Project config**: Per-project settings in `project/config.json`
3. **Runtime overrides**: Command-line flags and environment variables

Key configuration areas:

- **Container settings**: Image, ports, environment variables, resource limits
- **Trace settings**: Session timeout, output truncation, storage location
- **Security settings**: Network access, volume mounts, execution timeouts

See [dockashell-configuration.md](dockashell-configuration.md) for complete configuration reference.
