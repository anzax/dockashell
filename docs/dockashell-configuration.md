# DockaShell Configuration

This document covers both global and project-specific configuration for DockaShell.

## Global Configuration

DockaShell stores global settings in `~/.dockashell/config.json`. This file controls system-wide behavior and default settings.

### Complete Global Configuration Example

```json
{
  "projects": {
    "directory": "~/dockashell-projects"
  },
  "tui": {
    "display": {
      "max_entries": 300
    }
  },
  "logging": {
    "traces": {
      "session_timeout": "4h"
    }
  },
  "remote_mcp": {
    "enabled": false,
    "port": 3333,
    "auth": {
      "username": "admin",
      "password": "changeme123"
    },
    "cors": {
      "origin": "*",
      "credentials": true
    },
    "session": {
      "timeout": "24h"
    }
  }
}
```

### Global Configuration Fields

#### Projects Configuration

- `projects.directory` – Default directory where project files are stored (default: `"~/dockashell-projects"`)

#### TUI Configuration

- `tui.display.max_entries` – Maximum number of trace entries to display in the TUI log viewer (default: `300`)

#### Logging Configuration

- `logging.traces.session_timeout` – Time between trace entries before starting a new session (default: `"4h"`, formats: `"2h"`, `"30m"`)

#### Remote MCP Server Configuration

- `remote_mcp.enabled` – Enable remote MCP server for multi-user access (default: `false`)
- `remote_mcp.port` – Port for remote MCP server (default: `3333`)

##### Authentication Settings

- `remote_mcp.auth.username` – Username for authentication (default: `"admin"`)
- `remote_mcp.auth.password` – Password for authentication (default: `"changeme123"` - should be changed)

##### CORS Settings

- `remote_mcp.cors.origin` – Allowed origins for CORS requests (default: `"*"`)
- `remote_mcp.cors.credentials` – Allow credentials in CORS requests (default: `true`)

##### Session Settings

- `remote_mcp.session.timeout` – Session timeout for authenticated users (default: `"24h"`)

## Project Configuration

DockaShell stores each project's config in `~/.dockashell/projects/{name}/config.json`. These JSON files define how containers are started and configured for each project.

### Project Configuration Fields

- `name` – Project name
- `description` – Optional description
- `image` – Docker image to use (defaults to `dockashell/default-dev:latest`)
- `mounts` – List of host paths mounted into the container
- `ports` – Ports forwarded from host to container
- `environment` – Environment variables
- `working_dir` – Default working directory inside the container
- `shell` – Login shell
- `security.max_execution_time` – Maximum seconds for any command

### Project Configuration Examples

#### Node.js Web App

```json
{
  "name": "web-app",
  "description": "Node.js web application with hot reload",
  "mounts": [
    {
      "host": "~/dockashell-projects/web-app",
      "container": "/workspace",
      "readonly": false
    }
  ],
  "ports": [
    { "host": 3000, "container": 3000 },
    { "host": 8080, "container": 8080 }
  ],
  "environment": {
    "NODE_ENV": "development"
  },
  "working_dir": "/workspace",
  "shell": "/bin/bash",
  "security": { "max_execution_time": 300 }
}
```

#### Custom Image

```json
{
  "name": "legacy-app",
  "image": "node:16-bullseye",
  "mounts": [
    {
      "host": "~/dockashell-projects/legacy-app",
      "container": "/workspace",
      "readonly": false
    }
  ],
  "ports": [{ "host": 3000, "container": 3000 }],
  "working_dir": "/workspace",
  "shell": "/bin/bash"
}
```

## Configuration Storage Locations

- **Global Config**: `~/.dockashell/config.json`
- **Project Config**: `~/.dockashell/projects/{name}/config.json`
- **Trace Logs**: `~/.dockashell/projects/{name}/traces/current.jsonl`

## Trace Session Management

Trace sessions rotate automatically when there are more than four hours between entries. If DockaShell restarts within this window, the same `current.jsonl` file continues to be used so history remains visible in the TUI. The timeout can be configured using the global `logging.traces.session_timeout` setting.
