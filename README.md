# DockaShell

> **DockaShell** is an open-source MCP server that gives every AI Agent its own isolated Docker container — complete with file access, shell execution, and full action traceability.

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
npm install -g dockashell

# OR for development:
git clone <repository>
cd dockashell
npm install
npm link  # Makes dockashell command available
```

### 2. Initial Setup

```bash
# Check system status
dockashell status

# Build default development image
dockashell build

# Create your first project
dockashell create my-project

# Start working
dockashell start my-project
```

### 📋 Requirements

- **Node.js 20+**
- **Docker** installed and running
- **Home directory write access** for configuration storage

### MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "dockashell": {
      "command": "dockashell",
      "args": ["serve"]
    }
  }
}
```

---

## 🖥️ Terminal User Interface (TUI)

DockaShell includes a Terminal User Interface for viewing agent activity and project traces. The TUI provides immediate visibility into what agents are working on without interrupting their progress.

```bash
dockashell logs
```

### Features

- **Project Discovery**: Automatically finds all DockaShell projects
- **Trace Viewing**: Navigate through agent logs with keyboard
- **Entry Types**: Displays user inputs, agent reasoning, and command results

---

## 🐳 Default Development Image

DockaShell includes a comprehensive default development image (`dockashell/default-dev:latest`) with:

- **Python 3.12** development environment base (Microsoft DevContainer)
- **Node.js 20 LTS** - Active LTS support
- **Essential CLI Tools**: ripgrep, jq, git-lfs, build-essential, curl
- **Package Managers**: npm, yarn, pnpm (via corepack), pip
- **Non-root user** (vscode, UID 1000) with workspace access

### Benefits of the Default Image

- **Consistency**: Every project gets the same comprehensive environment
- **Simplicity**: Project configs focus on project-specific needs (ports, mounts, env vars)
- **Performance**: Base image is cached and reused across all projects
- **Zero Configuration**: Python, Node.js, and essential tools pre-installed

### Building the Default Image

```bash
# Build the default image
dockashell build

# Force rebuild
dockashell build --force
```

## 📝 CLI Usage

See [docs/cli-usage.md](docs/cli-usage.md) for workflow examples and full command reference.

## ⚙️ Configuration

See [docs/dockashell-configuration.md](docs/dockashell-configuration.md) for global and project configuration details.

## 🔧 MCP Tools

DockaShell provides a comprehensive set of MCP tools for AI agents:

- **Project Management** - Start, stop, and monitor project containers
- **Shell Execution** - Run shell commands with full isolation and audit trails
- **File Operations** - Create files and apply patches with context-based matching
- **Trace & Logging** - Document agent reasoning and query traces history

See [docs/mcp-tools.md](docs/mcp-tools.md) for the complete tools reference with examples and best practices.

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
{"id":"tr_ghi789","tool":"bash","trace_type":"execution","command":"npm start","result":{"exitCode":0,"duration":"0.1s"}}
```

Use `write_trace` to store notes and `read_traces` to query previous entries.

Trace sessions rotate automatically when there are more than four hours between entries. If DockaShell restarts within this window, the same `current.jsonl` file continues to be used so history remains visible in the TUI. See [docs/dockashell-configuration.md](docs/dockashell-configuration.md) for trace session configuration options.

## 📄 License

Apache License 2.0 - see LICENSE file for details.
