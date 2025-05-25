# git_apply MCP Tool (Incremental File Edits)

The `git_apply` tool enables precise, incremental file modifications by applying unified diffs directly inside project containers. Optimized for small, focused changes that build up complex edits through multiple iterations.

## How It Works

- Executes `git apply --whitespace=fix -` with automatic newline handling
- Applies patches immediately with intelligent whitespace normalization
- Returns detailed exit codes and error messages for debugging
- Handles stream transmission reliably within Docker containers

## Arguments

```json
{ "project_name": "string", "diff": "string" }
```

- `project_name` – Target project container name
- `diff` – Unified git diff in standard format (automatic newline handling)

## LLM Usage Guidance

### Best Practices

1. **Send small, focused diffs** – Single logical changes work best
2. **Ensure accurate context** – @@ line numbers and context lines must match target file exactly
3. **Use incremental approach** – Build complex changes through multiple small patches
4. **Handle failures gracefully** – Inspect error output to adjust context/line numbers

### When to Use

- ✅ Adding/removing single lines or small code blocks
- ✅ Modifying existing functions, classes, or configuration sections
- ✅ Incremental refactoring with precise control over changes
- ❌ Large file restructuring (use `run_command` with text editors instead)

### Error Recovery

- **"corrupt patch at line X"** → Verify diff format and context line accuracy
- **"patch does not apply"** → Check that target file state matches diff expectations
- Use `run_command` to inspect current file content before retrying with adjusted context
