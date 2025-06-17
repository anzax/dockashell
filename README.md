[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/anzax-dockashell-badge.png)](https://mseep.ai/app/anzax-dockashell)

# DockaShell

DockaShell is an MCP (Model Context Protocol) server that gives AI agents isolated Docker containers to work in. Each agent gets its own persistent environment with shell access, file operations, and full audit trails.

> This is a research project exploring agent autonomy: How far can we push shell-based workflows? Can agents manage their own development environments and create their own tools?

## Why this exists

Current AI assistants hit fundamental walls:

- **No persistent memory**: Conversations reset, context is lost, agents can't build on previous work
- **Tool babysitting**: Every shell command needs human approval, breaking agent flow and autonomy
- **Limited toolsets**: Agents stuck with predefined tools instead of building what they need
- **No self-reflection**: Can't analyze their own traces to improve or learn from past sessions

DockaShell removes these constraints to explore what emerges:

- **Self-evolving agents**: Build and refine their own tools, scripts, and workflows
- **Continuous memory**: Maintain knowledge bases, wikis, notebooks that persist across sessions
- **Autonomous exploration**: Run shell commands without constant human intervention
- **Meta-learning**: Analyze previous traces to improve decision-making and tool usage

The core question: What can agents accomplish when they have real persistence and autonomy?

## How it works

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

Each AI agent gets its own isolated Docker container with persistent storage. Instead of dozens of custom tools, agents use standard shell commands (`bash`, `git`, `npm`, etc.) and build their own workflows.

Key principles:

- **Shell > specialized tools**: Agents already "speak" POSIX, so let them use real commands
- **Container isolation**: Full autonomy inside, zero risk to your host system
- **Persistent workspace**: Files, databases, and context survive across sessions
- **Complete audit trail**: Every command and file change is logged for analysis

→ **[See detailed architecture and security model](docs/how-it-works.md)**

## Quick Start

```bash
# Install
npm install -g dockashell

# Setup
dockashell build
dockashell create my-project
dockashell start my-project
```

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

**Requirements**: Node.js 20+, Docker running

## Example workflows

**Data analysis**: Agent spins up Python environment, processes CSV files, generates insights

**Web development**: Agent builds React app, installs dependencies, runs dev server with live preview

**Research assistant**: Agent tracks information across sessions, maintains SQLite databases, remembers context

## Documentation

- **[CLI usage](docs/cli-usage.md)** - Commands and workflow examples
- **[Configuration](docs/dockashell-configuration.md)** - Global and project settings
- **[MCP tools](docs/mcp-tools.md)** - Complete tool reference for agents

## Current state

This is active research, not production software. The core functionality works well for experimentation, but expect changes as I explore what agents can do with persistent shell environments.

Contributions and feedback welcome.

## License

Apache License 2.0
