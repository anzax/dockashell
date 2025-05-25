# Code Quality Tools

This project uses ESLint and Prettier for consistent code style and quality.

## Setup

### VS Code Extensions (Recommended)

Install these VS Code extensions for the best development experience:

- **ESLint** (`ms-vscode.vscode-eslint`)
- **Prettier - Code formatter** (`esbenp.prettier-vscode`)

The project includes VS Code settings that will automatically format code on save and fix ESLint issues.

### Manual Usage

```bash
# Check for linting errors
npm run lint

# Fix automatically fixable issues
npm run lint:fix

# Format all files with Prettier
npm run format

# Run both linting and formatting (recommended workflow)
npm run lint:fix && npm run format
```

## Configuration

### ESLint (`eslint.config.js`)

- Uses ESLint 10 flat config format (modern approach)
- Configured for Node.js ES6 modules
- Integrates with Prettier to avoid conflicts
- Allows console usage (for CLI tools)
- Requires unused variables to be prefixed with `_`

### Prettier (`prettier.config.js`)

- 2 spaces indentation
- Single quotes
- Semicolons required
- 80 character line width
- Unix line endings (`\n`)

## Common Issues

### Unused Variables

If you have intentionally unused variables, prefix them with underscore:

```javascript
// ❌ Error: 'error' is defined but never used
catch (error) {
  // handle error
}

// ✅ Correct: Use underscore prefix
catch (_error) {
  // handle error  
}
```

### Empty Catch Blocks

Add a comment or minimal handling:

```javascript
// ❌ Error: Empty block statement
catch (_error) {
}

// ✅ Correct: Add comment
catch (_error) {
  // Ignore error intentionally
}
```

## Integration

These tools run automatically in:

- **VS Code**: Format on save, real-time error highlighting
- **Git hooks**: Could be added for pre-commit validation
- **CI/CD**: Could be added to build pipeline

The configuration is designed to be zero-friction while maintaining high code quality.
