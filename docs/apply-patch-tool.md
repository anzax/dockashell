# apply_patch MCP Tool (OpenAI Format File Edits)

**Based on:** [OpenAI Prompting Guide - Generating and Applying File Diffs](https://cookbook.openai.com/examples/gpt4-1_prompting_guide#appendix-generating-and-applying-file-diffs)

The `apply_patch` tool enables flexible, incremental file updates using the OpenAI-proposed patch format. Executes a pure Python script inside the project container for reliable, context-based file patching without external dependencies.

## How It Works

- Executes `python3 /usr/local/bin/apply_patch.py` with patch data via stdin
- Uses context-based matching instead of fragile line numbers
- Returns structured error messages with clear diagnostics
- Supports Add, Update, Delete, and Move operations

## Arguments

```json
{ "project_name": "string", "patch": "string" }
```

- `project_name` – Target project container name
- `patch` – OpenAI format patch string (**_ Begin Patch / _** End Patch)

## Patch Format

### Basic Structure

```
*** Begin Patch
*** Update File: path/to/file.js
[context_before]
- [old_code]
+ [new_code]
[context_after]
*** End Patch
```

### Context Guidelines

- Show 3 lines before and after each change by default
- Use `@@` markers for class/function context when needed
- No line numbers required - matching is context-based
- Support for fuzzy matching with whitespace tolerance

### Supported Operations

#### Update File

```
*** Update File: src/example.js
 function test() {
-  console.log("old");
+  console.log("new");
 }
```

#### Add File

```
*** Add File: src/new.js
+export function newFunction() {
+  return true;
+}
```

#### Delete File

```
*** Delete File: src/unused.js
```

#### Move File

```
*** Update File: src/old.js
*** Move to: src/new.js
[content changes...]
```

## LLM Usage Guidance

### Best Practices

1. **Provide sufficient context** – Include 3+ lines around changes
2. **Use descriptive context** – Choose unique code snippets for matching
3. **Handle complex changes incrementally** – Multiple small patches are more reliable
4. **Leverage fuzzy matching** – Script handles minor whitespace differences

### When to Use

- ✅ Adding/removing lines with clear context
- ✅ Modifying functions, classes, or configuration sections
- ✅ Creating new files or deleting existing ones
- ✅ Moving files with content changes
- ❌ Large file restructuring (use `run_command` with text editors instead)

### Error Recovery

Common error types and solutions:

- **"Invalid context"** → Verify context lines exist in target file
- **"Duplicate add/update/delete"** → Don't repeat operations on same file
- **"Missing file"** → Ensure file exists before Update/Delete operations
- **"File already exists"** → Don't Add files that already exist

### Advanced Context Matching

For repeated code patterns, use `@@` markers:

```
*** Update File: src/example.js
@@ class UserService
@@   validate():
   if (!user) {
-    return false;
+    throw new Error("Invalid user");
   }
```

Multiple context levels:

```
*** Update File: src/complex.js
@@ class DataProcessor
@@   processUser():
@@     if (user.active)
       user.lastSeen = new Date();
-      user.status = 'active';
+      user.status = 'online';
       return user;
```

## Technical Details

- **No external dependencies** – Pure Python 3.9+ implementation
- **Context-based matching** – Robust against minor file changes
- **Structured error reporting** – Clear diagnostics for failed patches
- **Atomic operations** – Files updated completely or not at all
- **Performance optimized** – No subprocess overhead
