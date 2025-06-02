// Enhanced help content for DockaShell CLI

const MAIN_HELP = `
DockaShell v0.1.0
AI agent secure Docker environments for project work

USAGE:
  dockashell <command> [options]

COMMANDS:
  status [--json]           Show Docker status, images, and all projects
  build [--force]           Build default development image  
  start <project>           Start project container
  stop <project>            Stop project container
  create <project>          Create new project configuration
  recreate <project>        Rebuild container (apply config changes)
  logs [project]            Launch interactive trace viewer
  serve [--http]            Start MCP server for AI integration
  help [command]            Show detailed help for command

EXAMPLES:
  dockashell status                   # Check system health
  dockashell build --force            # Rebuild default image
  dockashell create web-app           # Create new project
  dockashell start web-app            # Start working on project
  dockashell logs                     # Monitor all activity
  dockashell recreate web-app         # Apply config changes

Run 'dockashell help <command>' for detailed information.
For more: https://github.com/your-org/dockashell
`;

const DETAILED_HELP = {
  status: `
COMMAND: status
Show comprehensive system status including Docker daemon, 
default image, and all projects with container states.

USAGE:
  dockashell status [--json]

OPTIONS:
  --json                   Output machine-readable JSON

OUTPUT INCLUDES:
  • Docker daemon status and version  
  • Default image availability and build date
  • All projects with container states (running/stopped/missing)
  • Port usage and basic resource summary

EXAMPLES:
  dockashell status                   # Human-readable overview
  dockashell status --json            # For scripts/automation
`,

  build: `
COMMAND: build  
Build the default DockaShell development image with Python 3.12,
Node.js 20 LTS, and essential development tools.

USAGE:
  dockashell build [--force]

OPTIONS:
  -f, --force              Force rebuild (remove existing image first)

BUILD DETAILS:
  • Image: dockashell/default-dev:latest
  • Base: Microsoft Python 3.12 devcontainer  
  • Build time: 2-5 minutes on first run
  • Includes: Python, Node.js, npm, yarn, ripgrep, jq

EXAMPLES:
  dockashell build                    # Build if missing
  dockashell build --force            # Force fresh rebuild
`,

  start: `
COMMAND: start
Start a project container. Creates container from config if needed.

USAGE:  
  dockashell start <project>

REQUIREMENTS:
  • Project config must exist: ~/.dockashell/projects/<project>/config.json
  • Docker daemon must be running
  • Default image must be built

BEHAVIOR:
  • Creates container with configured mounts, ports, environment
  • Uses existing container if already created
  • Mounts project directory to /workspace by default

EXAMPLES:
  dockashell start web-app            # Start web-app project
  dockashell start data-analysis      # Start data project
`,

  stop: `
COMMAND: stop
Stop a running project container gracefully.

USAGE:
  dockashell stop <project>

BEHAVIOR:
  • Sends SIGTERM with 10 second grace period
  • Preserves container state for future start
  • Safe to run on already stopped containers

EXAMPLES:
  dockashell stop web-app             # Stop specific project
`,

  create: `
COMMAND: create  
Create a new project with default configuration.

USAGE:
  dockashell create <project>

BEHAVIOR:
  • Creates ~/.dockashell/projects/<project>/ directory
  • Generates default config.json with common settings
  • Sets up workspace mount to ~/projects/<project>
  • Configures common development ports (3000, 8000, etc.)

PROJECT NAMING:
  • Use lowercase letters, numbers, hyphens, underscores only
  • No spaces or special characters

EXAMPLES:
  dockashell create my-web-app        # Create web project
  dockashell create data-science      # Create data project  
`,

  recreate: `
COMMAND: recreate
Stop, remove, and restart project container to apply configuration changes.

USAGE:
  dockashell recreate <project>

USE CASES:
  • Applied changes to config.json (ports, mounts, environment)
  • Updated default image and want to use new version
  • Container corrupted or needs fresh start

BEHAVIOR:  
  • Stops running container
  • Removes container (preserves project files)
  • Creates new container with current config
  • Starts new container

EXAMPLES:
  dockashell recreate web-app         # Apply config changes
`,

  logs: `
COMMAND: logs
Launch interactive trace viewer (TUI) for monitoring project activity.

USAGE:
  dockashell logs [project]

FEATURES:
  • View all project activity in real-time
  • Filter by trace type (commands, notes, errors)
  • Search across all traces
  • Navigate with keyboard shortcuts
  • Project selector if no project specified

KEYBOARD SHORTCUTS:
  • ↑↓ Navigate traces
  • Enter: View trace details  
  • f: Filter by type
  • /: Search
  • q: Quit

EXAMPLES:
  dockashell logs                     # Show project selector
  dockashell logs web-app             # Open specific project
`,

  serve: `
COMMAND: serve
Start MCP (Model Context Protocol) server for AI agent integration.

USAGE:
  dockashell serve [--http]

TRANSPORT OPTIONS:
  Default: stdio (for direct AI client integration)
  --http: HTTP server (coming soon)

INTEGRATION:
  Add to AI client config:
  {
    "mcpServers": {
      "dockashell": {
        "command": "dockashell", 
        "args": ["serve"]
      }
    }
  }

EXAMPLES:
  dockashell serve                    # Start stdio server
`,
};

export function registerHelp(program) {
  program.helpInformation = () => MAIN_HELP;

  program
    .command('help [command]')
    .description('Show detailed help for command')
    .action((cmd) => {
      if (cmd && DETAILED_HELP[cmd]) {
        console.log(DETAILED_HELP[cmd]);
      } else if (cmd) {
        console.log(`Unknown command: ${cmd}\n`);
        console.log(
          'Available commands: status, build, start, stop, create, recreate, logs, serve'
        );
      } else {
        console.log(MAIN_HELP);
      }
    });
}
