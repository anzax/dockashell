# DockaShell Project Structure

## Directory Organization

```
dockashell/
├── src/                          # Core implementation
│   ├── mcp-server.js            # Main MCP server entry point
│   ├── container-manager.js     # Docker container operations
│   ├── project-manager.js       # Project configuration handling
│   ├── security.js              # Command validation & security
│   └── logger.js                # Command logging functionality
├── tests/                        # Test suite
│   ├── test-error-handling.js   # Error handling tests
│   ├── test-mcp-tools.js        # MCP tool integration tests
│   ├── test-server.js           # Server functionality tests
│   └── test-timeout.js          # Timeout & performance tests
├── utils/                        # Utilities and examples
│   ├── claude_desktop_config_example.json  # MCP config example
│   └── create-test-project.js   # Test project setup utility
├── package.json                  # Node.js dependencies
├── tests/                       # Test suite
├── create-examples.js           # Project examples generator
└── README.md                    # Project documentation
```

## Key Files

### Core Implementation (`src/`)
- **mcp-server.js**: Main entry point, MCP protocol handling
- **container-manager.js**: Docker API integration, container lifecycle
- **project-manager.js**: Configuration loading, devcontainer support
- **security.js**: Command validation, security policies
- **logger.js**: Command logging and audit trails

### Testing (`tests/`)
- **test-error-handling.js**: Docker errors, network issues, validation
- **test-mcp-tools.js**: MCP tool functionality integration testing
- **test-server.js**: Server startup, tool registration, basic operations
- **test-timeout.js**: Long-running commands, timeout handling

### Utilities (`utils/`)
- **claude_desktop_config_example.json**: Example MCP configuration
- **create-test-project.js**: Helper to create test project configurations

## Development Workflow

1. **Core changes**: Edit files in `src/`
2. **Testing**: Run tests from `tests/` directory
3. **Setup**: Use utilities from `utils/` for configuration
4. **Examples**: Generate with `create-examples.js`

This structure maintains separation of concerns while keeping the project accessible and maintainable.
