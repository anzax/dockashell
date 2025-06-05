# DockaShell Configuration

This document covers both global and project-specific configuration for DockaShell.

## Global Configuration

DockaShell stores global settings in `~/.dockashell/config.json`. This file controls system-wide behavior and default settings.

### Global Configuration Example

```json
{
  "logging": {
    "traces": {
      "session_timeout": "4h"
    }
  }
}
```

### Global Configuration Fields

- `logging.traces.session_timeout` – Time between trace entries before starting a new session (e.g., `"2h"`, `"4h"`)

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
