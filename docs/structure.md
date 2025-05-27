# DockaShell Project Structure

## Directory Organization

```
dockashell/
├── src/                          # Core implementation
│   ├── mcp/                     # MCP server entry point
│   ├── core/                    # Container & project management
│   ├── utils/                   # Shared utilities
│   └── tui/                     # Terminal user interface components
├── test/                         # Test suite
│   ├── *.test.js               # Unit tests (Node.js test runner)
│   └── integration/            # Integration tests
├── scripts/                      # Build and setup scripts
│   ├── setup/                  # Project setup utilities
│   └── image/                  # Docker image management
├── utils/                        # Utilities and examples
│   └── claude_desktop_config_example.json  # MCP config example
├── package.json                  # Node.js dependencies
└── README.md                    # Project documentation
```

## Key Files

### Core Implementation (`src/`)

- **mcp/mcp-server.js**: Main entry point, MCP protocol handling
- **core/container-manager.js**: Docker API integration, container lifecycle
- **core/project-manager.js**: Configuration loading, devcontainer support
- **core/security.js**: Command validation, security policies
- **utils/logger.js**: Command logging and audit trails

### Testing (`test/`)

- **\*.test.js**: Unit tests using Node.js built-in test runner
- **integration/**: Integration tests for MCP tools and error handling

### Utilities (`utils/`)

- **claude_desktop_config_example.json**: Example MCP configuration

## Development Workflow

1. **Core changes**: Edit files in `src/`
2. **Unit testing**: Run `npm test` for quick unit tests
3. **Integration testing**: Run `npm run test:integration` for full testing
4. **Setup**: Use utilities from `utils/` for configuration
5. **Build**: Use scripts from `scripts/` for image management

This structure maintains separation of concerns while keeping the project
accessible and maintainable.
