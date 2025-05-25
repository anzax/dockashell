# git_apply MCP Tool

The `git_apply` tool lets an LLM apply a unified diff inside a project container.
It first runs `git apply --check` to ensure the patch will apply cleanly. If the
check succeeds, the patch is applied with `git apply`. If not, the tool returns
an error and no files are changed.

## Arguments

```json
{ "project_name": "string", "diff": "string" }
```

- `project_name` – target project container
- `diff` – unified git diff to apply

## LLM Usage Guidance

1. Send small, focused diffs to avoid conflicts.
2. Inspect the tool response; on errors, adjust the diff and retry.
3. After a successful apply, use `run_command` for additional git operations
   like commits.
4. Avoid very large diffs as they may exceed resource limits.
