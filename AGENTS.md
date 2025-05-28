# AGENTS.md

## Code Style

- **Files**: kebab-case (`container-manager.js`)
- **Classes**: PascalCase (`ProjectManager`)
- **Exports**: Named exports for utilities, default for main classes
- **Imports**: Always include `.js` extension
- **Formatting**: Prettier (single quotes, 2 spaces, 80 width)

## Key Patterns

- Use Zod schemas for MCP tool validation
- Handle errors gracefully
- Test-driven development approach

## Testing

- Node.js built-in test runner: `node --test`
- Pattern: `import { test, describe } from 'node:test'`
- Aim for 100% coverage on new features
- Test error cases and edge conditions

## Before Submitting

**Always run these commands before submitting any changes:**

```bash
npm test           # Run all tests
npm run lint:fix   # Auto-fix linting issues
npm run format     # Format code with Prettier
```
