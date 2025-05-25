# apply_diff MCP Tool (Incremental File Edits)

The `apply_diff` tool enables flexible, incremental file updates by feeding [Aider](better-edit-tool/aider.md) diff blocks to `aider --apply` inside the project container. Optimized for small, focused changes that build up complex edits through multiple iterations.

## How It Works

- Executes `aider --apply -` with automatic newline handling
- Applies patches using Aider's tolerant diff matching
- Returns detailed exit codes and error messages for debugging
- Handles stream transmission reliably within Docker containers

## Arguments

```json
{ "project_name": "string", "diff": "string" }
```

- `project_name` – Target project container name
- `diff` – Aider diff format string (automatic newline handling)

## LLM Usage Guidance

### Best Practices

1. **Send small, focused diffs** – Single logical changes work best
2. **Include a bit of context** – At least one unchanged line around the edit helps Aider match correctly
3. **Use incremental approach** – Build complex changes through multiple small patches
4. **Handle failures gracefully** – Inspect error output to adjust context/line numbers

### When to Use

- ✅ Adding/removing single lines or small code blocks
- ✅ Modifying existing functions, classes, or configuration sections
- ✅ Incremental refactoring with precise control over changes
- ❌ Large file restructuring (use `run_command` with text editors instead)

### Error Recovery

- **"Failed to apply hunk"** → Verify diff format and context lines
- **"Patch did not apply"** → Check that target file state matches diff expectations
- Use `run_command` to inspect current file content before retrying with adjusted context
