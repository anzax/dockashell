# DockaShell v0.1

> **DockaShell** is an open-source MCP server that gives every project its own isolated Docker container — complete with file access, shell execution, and full action traceability.

- **MCP tools for file access & shell execution:** Use any compatible client — _Claude Desktop_, _Zed_, _Cursor IDE_, _VS Code_, and more — to interact with your dedicated project container.
- **Dedicated, persistent containers per project:** Each project runs in its own container, giving AI agents and assistants full control _inside_, with zero risk to your host.
- **Comprehensive action tracking:** Every file edit, shell command, and agent action is logged and fully traceable.
- **Built-in TUI for observability:** Inspect agent behavior, command traces, and file changes in real time — with filters and search.

Perfect for agentic development, Vibe Coding, AI assistant workflows, and safe, auditable experimentation.

---

## Experimental technology disclaimer

DockaShell is an experimental project under active development. It is not yet stable, may contain bugs, incomplete features, or undergo breaking changes.

---

## ✨ Features

- **🔒 Project Isolation**: Each project runs in its own Docker container
- **💾 Persistent State**: Containers maintain state across command executions
- **🌐 Port Mapping**: Easy web development with port forwarding
- **📁 Project Directory Mounting**: Seamless file access between host and container
- **🛡️ Container Security**: Isolated, non-privileged execution with timeouts
- **📊 Command Logging**: Full audit trail of all executed commands
- **🔧 MCP Integration**: Standard Model Context Protocol interface
- **🐳 Default Development Image**: Pre-built Python 3.12 + Node.js 20 LTS development environment

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone <repository>
cd dockashell
npm install
```

### 2. Build the Default Docker Image

```bash
npm run build-image
```

### 3. Create Example Projects

```bash
npm run setup-examples
```

## 🐳 Default Development Image

DockaShell includes a comprehensive default development image (`dockashell/default-dev:latest`) with:

- **Python 3.12** development environment base (Microsoft DevContainer)
- **Node.js 20 LTS** - Active LTS support
- **Essential CLI Tools**: ripgrep, jq, git-lfs, build-essential, curl
- **Package Managers**: npm, yarn, pnpm (via corepack), pip
- **apply_patch JavaScript tool** for file editing
- **Non-root user** (vscode, UID 1000) with workspace access

### Benefits of the Default Image

- **Consistency**: Every project gets the same comprehensive environment
- **Simplicity**: Project configs focus on project-specific needs (ports, mounts, env vars)
- **Performance**: Base image is cached and reused across all projects
- **Zero Configuration**: Python, Node.js, and essential tools pre-installed

### Using Custom Images

You can override the default image for specific project requirements:

```json
{
  "name": "legacy-project",
  "image": "node:16-bullseye",
  "description": "Legacy project requiring Node.js 16"
}
```

### Building the Default Image

```bash
# Build the default image
npm run build-image

# Force rebuild
npm run rebuild-image
```

## 📝 Example Workflow

Here's how an AI agent would typically use DockaShell:

```javascript
// 1. List available projects
list_projects();

// 2. Start a web development project
start_project({ project_name: 'web-app' });

// 3. Initialize a new Node.js project
run_command({
  project_name: 'web-app',
  command: 'npm init -y',
});

// 4. Install dependencies
run_command({
  project_name: 'web-app',
  command: 'npm install express',
});

// 5. Create a simple server
run_command({
  project_name: 'web-app',
  command: 'echo \'const express = require("express"); const app = express(); app.get("/", (req, res) => res.send("Hello World!")); app.listen(3000);\' > app.js',
});

// 6. Start the server
run_command({
  project_name: 'web-app',
  command: 'node app.js',
});

// Server is now running at http://localhost:3000
```

## ⚙️ Configuration

Projects are configured in `~/.dockashell/projects/{project-name}/config.json`:

```json
{
  "name": "my-project",
  "description": "Project description",
  "mounts": [
    {
      "host": "~/projects/my-project",
      "container": "/workspace",
      "readonly": false
    }
  ],
  "ports": [
    {
      "host": 3000,
      "container": 3000
    }
  ],
  "environment": {
    "NODE_ENV": "development"
  },
  "working_dir": "/workspace",
  "shell": "/bin/bash",
  "security": {
    "max_execution_time": 300
  }
}
```

Note: The `image` field is optional - if omitted, projects will use the default `dockashell/default-dev:latest` image.

## 🔧 MCP Tools

DockaShell exposes several MCP tools:

### `list_projects`

Lists all configured projects with their status.

### `start_project`

**Arguments:** `{"project_name": "string"}` Starts a Docker container for the specified project.

### `run_command`

**Arguments:** `{"project_name": "string", "command": "string"}` Executes a shell command in the project container.

### `apply_patch`

**Arguments:** `{"project_name": "string", "patch": "string"}` Applies patches using the [OpenAI format](https://cookbook.openai.com/examples/gpt4-1_prompting_guide#appendix-generating-and-applying-file-diffs) inside the project container with context-based matching. More reliable than line-number based diffs for iterative edits.

### `write_file`

**Arguments:** `{"project_name": "string", "path": "string", "content": "string", "overwrite?": "boolean"}` Creates or overwrites a file inside the container. Intermediate directories are created automatically. Set `overwrite` to `true` to replace existing files (defaults to `false`).

### `project_status`

**Arguments:** `{"project_name": "string"}` Returns detailed status information about the project container.

### `stop_project`

**Arguments:** `{"project_name": "string"}` Stops the project container.

### `write_trace`

**Arguments:** `{"project_name": "string", "type": "user|summary|agent", "text": "string"}` Writes an arbitrary note to the project trace log.

### `read_traces`

**Arguments:** `{"project_name": "string", "type?": "string", "search?": "string", "skip?": "number", "limit?": "number", "fields?": "string[]"}` Returns formatted trace entries with optional filtering and field selection.

**Field Options:**

- `timestamp`, `type`, `content` - Always included for context
- `exit_code`, `duration` - Command execution metadata (commands only)
- `output` - Command output preview, truncated to 200 chars for display (commands only)

**Type Filtering:**

- `"command"` - Shell command executions only
- `"note"` - All note types (user, agent, summary)
- `"user"`, `"agent"`, `"summary"` - Specific note types

**Usage Examples:**

```javascript
// Recent activity overview
read_traces('project', { limit: 10 });

// Debug failed commands with output
read_traces('project', {
  type: 'command',
  fields: ['timestamp', 'type', 'content', 'exit_code', 'output'],
});

// Search across traces
read_traces('project', { search: 'error' });
```

## 🛡️ Security Model

DockaShell relies on Docker's proven container isolation rather than maintaining command blocklists, enabling AI agents to use any legitimate tools while maintaining security boundaries.

### Container-Based Security & Execution Controls

- **Process Isolation**: Each project runs in its own Docker container
- **Filesystem Isolation**: Container filesystem separate from host system
- **Non-privileged Execution**: Containers run as non-root user (vscode, UID 1000)
- **Network Isolation**: Controlled network access via Docker networking
- **Resource Limits**: Memory and CPU constraints via Docker
- **Timeout Protection**: Commands automatically terminated after configured time limit
- **Audit Trail**: All commands logged with timestamps and exit codes
- **Session Management**: Persistent containers maintain state but can be stopped/restarted

## 📊 Logging

Agent traces are stored in `~/.dockashell/projects/{project-name}/traces/current.jsonl`:

```
{"id":"tr_abc123","tool":"start_project","trace_type":"execution","project_name":"web-app","result":{"success":true}}
{"id":"tr_def456","tool":"write_trace","trace_type":"observation","type":"agent","text":"Planning React app"}
{"id":"tr_ghi789","tool":"run_command","trace_type":"execution","command":"npm start","result":{"exitCode":0,"duration":"0.1s"}}
```

Use `write_trace` to store notes and `read_traces` to query previous entries.

Trace sessions rotate automatically when there are more than four hours between entries. If DockaShell restarts within this window, the same `current.jsonl` file continues to be used so history remains visible in the TUI. The timeout can be changed in `~/.dockashell/config.json` using `logging.traces.session_timeout` (e.g. `"2h"`). The default configuration sets this to `"4h"`:

```json
{
  "logging": {
    "traces": {
      "session_timeout": "4h"
    }
  }
}
```

## 🔌 MCP Client Integration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "dockashell": {
      "command": "node",
      "args": ["path/to/dockashell/src/mcp/mcp-server.js"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "dockashell": {
      "command": "dockashell"
    }
  }
}
```

## 📋 Requirements

- **Node.js 18+**
- **Docker** installed and running
- **Home directory write access** for configuration storage

---

## 🖥️ Terminal User Interface (TUI)

DockaShell includes a Terminal User Interface for viewing agent activity and project traces. The TUI provides immediate visibility into what agents are working on without interrupting their progress.

### Usage

**Interactive project selector:**

```bash
dockashell-tui
```

### Features

- **Project Discovery**: Automatically finds all DockaShell projects
- **Activity Sorting**: Projects sorted by most recent activity
- **Trace Viewing**: Navigate through agent logs with keyboard
- **Entry Types**: Displays user inputs, agent reasoning, and command results
- **Configurable**: Customizable display settings via `~/.dockashell/config.json`

### TUI Configuration

TUI settings in `~/.dockashell/config.json`:

```json
{
  "tui": {
    "display": {
      "max_entries": 100
    }
  }
}
```

---

## 📄 License

Apache License 2.0 - see LICENSE file for details.
