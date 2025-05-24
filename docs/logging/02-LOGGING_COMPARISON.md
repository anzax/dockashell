# System Logs vs Agent Traces - Quick Reference

## At a Glance

| Aspect | System Logs | Agent Traces |
|--------|-------------|--------------|
| **Purpose** | Debug & monitor DockaShell | Observe & remember agent activity |
| **Format** | Text with log levels | Structured JSONL |
| **Location** | `~/.dockashell/logs/` | `~/.dockashell/projects/{name}/traces/` |
| **Audience** | Developers | AI agents & users |
| **Retention** | 7 days | 30 days (configurable) |
| **Examples** | "Container startup failed" | "Agent executed npm test" |

## What Goes Where?

### System Logs (system.log)
```
[2025-05-24 10:00:01] INFO  Starting DockaShell server v1.0.0
[2025-05-24 10:00:02] DEBUG Docker connection established
[2025-05-24 10:00:03] ERROR Container startup failed: port 3333 already in use
[2025-05-24 10:00:04] WARN  Retrying with port 3334
```

### Agent Traces (traces.jsonl)
```json
{"id":"tr_abc123","tool":"start_project","trace_type":"execution","project_name":"myapp","result":{"success":true}}
{"id":"tr_def456","tool":"write_log","trace_type":"observation","type":"agent","text":"Planning React app structure"}
{"id":"tr_ghi789","tool":"run_command","trace_type":"execution","command":"npm init -y","result":{"success":true}}
```

## Decision Tree

```
Is it about agent activity?
├─ YES → Agent Trace
│   ├─ Command execution → trace_type: "execution"
│   ├─ Agent thinking → trace_type: "observation"
│   └─ System decision → trace_type: "decision"
└─ NO → System Log
    ├─ Docker errors → ERROR level
    ├─ Server startup → INFO level
    └─ Debug details → DEBUG level
```

## Key Differences

### 1. Lifecycle
- **System logs**: Rotate daily, keep 1 week
- **Agent traces**: Group by session, compress when done

### 2. Structure
- **System logs**: Free-form messages with context
- **Agent traces**: Strict schema with IDs and metadata

### 3. Querying
- **System logs**: grep, tail, text search
- **Agent traces**: Structured queries, session replay

### 4. Storage
- **System logs**: Global to DockaShell instance
- **Agent traces**: Per-project isolation

## Implementation Priority

### Phase 1: Core (Week 1)
1. Create `TraceRecorder` class
2. Add session management
3. Update MCP tools to emit traces
4. Keep existing logging intact

### Phase 2: Migration (Week 2)
1. Update TUI to read traces
2. Add `read_traces` tool
3. Implement trace compression
4. Document changes

### Phase 3: Enhancement (Week 3)
1. Add correlation IDs
2. Implement trace viewer filters
3. Build session index
4. Remove old logging code

## Example: run_command Flow

```javascript
// OLD: Everything in one log
logger.logCommand(command, result)

// NEW: Separated concerns
systemLogger.debug(`Executing command in container ${containerId}`)
traceRecorder.execution('run_command', {
  command: 'npm test',
  log: 'Running tests'
}, {
  success: true,
  exit_code: 0,
  duration_ms: 2100
})
```

## Why This Matters

1. **Agents need memory**: Traces provide structured history
2. **Users need observability**: See what agents are doing
3. **Developers need debugging**: System logs for troubleshooting
4. **Everyone needs clarity**: Clear separation prevents confusion

The new design treats agent activity as first-class data, not just logs.
