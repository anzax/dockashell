Below is a single-stop “cookbook” for **aider-cli ≥ v0.80** that shows — from first install to CI wiring — how to apply diff files *and* exactly what the valid diff formats look like.

---

## 1 · Fast install & one-liner smoke test

```bash
python3 -m pip install --upgrade aider-chat   # installs `aider`
export OPENAI_API_KEY=sk-…                    # or ANTHROPIC_API_KEY, etc.
git clone https://github.com/you/project.git
cd project
echo '# noop' > touch.diff                    # dummy diff
aider --apply touch.diff --dry-run            # should say “No edits to apply”
```

`--apply` switches aider into **non-interactive “patch mode”** so it consumes your diff file and exits; `--dry-run` lets you verify nothing crazy happens first. ([Aider][1])

---

## 2 · Recognised **edit formats**

| Keyword ( `--edit-format` ) | When to choose it                                                                                         | Anatomy                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **`diff`** (the default)    | Works best with GPT-4o, Claude Opus, DeepSeek, etc.                                                       | *Search/Replace* block (see §2.1) |
| **`diff-fenced`**           | Gemini sometimes needs the filename *inside* the fence. Syntax is identical otherwise.                    |                                   |
| **`udiff`**                 | Aider’s line-number-free **unified diff**—great for GPT-4-Turbo, reduces “lazy-code” by \~3× ([Aider][2]) |                                   |
| **`whole`**                 | Fallback: send the entire new file. Costlier; rarely needed.                                              |                                   |

You can override per run (`aider --apply my.patch --edit-format udiff`) or set a default in `~/.aider.conf`.

---

### 2.1 · SEARCH/REPLACE **diff** spec (the polyglot-benchmark format)

```
path/to/file.py
```

<<<<<<< SEARCH          ← literal text to locate
old line 1
old line 2
==========

new line 1
new line 2

> > > > > > > REPLACE

```

* **Filename** sits **above** the fenced block.
* Three markers: `SEARCH`, a single `=======` separator, `REPLACE`.
* Deleting code → leave the REPLACE half empty. Inserting new code → leave SEARCH empty.
* Repeat additional blocks back-to-back for the same or different files.

> **Tip:** keep at least one unchanged context line on each side to make matching robust, exactly like you would for `git apply`.

---

### 2.2 · `diff-fenced`

Same block, but the *first* line after the opening back-ticks is the path:

```

```
path/to/file.py
<<<<<<< SEARCH
...
>>>>>>> REPLACE
```

````

Useful when models drop the path if it’s outside the fence.

---

### 2.3 · `udiff` (line-number-less unified diff)

```diff
--- path/to/file.py
+++ path/to/file.py
@@ ... @@                              ← one per “hunk”
-class Foo:
+import attrs
+class Foo:
````

*Line numbers after `@@` are replaced by a literal `...`, because GPT is terrible at counting.* Aider simply treats every hunk as a big search/replace and applies it **flexibly** (ignores extra whitespace, re-splits hunks if needed, etc.). ([Aider][2])

---

## 3 · Applying a patch in practice

```bash
# 1 – Generate patch however you like (LLM, git diff, hand-edit)
my_agent > echo "$DIFF" > fix_bug.diff

# 2 – Apply with safety nets
aider --apply fix_bug.diff       \
      --auto-lint                \
      --auto-test                \
      --commit                   \
      --yes-always
```

**What happens under the hood**

1. Aider loads your repo (or initialises one if missing).
2. Each diff block is applied *tolerantly* (fuzzy whitespace, context search, multi-pass fallback) ([Aider][2]).
3. If `--auto-lint` is on (default **True**) Aider runs the configured linter(s); failures are surfaced and **block the commit**. ([Aider][3])
4. Same for `--auto-test` if you provided `--test-cmd`.
5. Clean run → helper commit authored by “aider”. Dirty run → patch is reverted and you get a detailed error.

---

## 4 · Configuring **lint / test** hooks (sanity checks)

| Flag                           | Purpose                                   | Example                     |
| ------------------------------ | ----------------------------------------- | --------------------------- |
| `--lint`                       | One-shot lint & fix, then exit.           | `aider --lint src/*.py`     |
| `--auto-lint / --no-auto-lint` | Toggle post-edit lint pass. Default = on. |                             |
| `--lint-cmd "<lang>: <cmd>"`   | Override built-ins.                       | `--lint-cmd "python: ruff"` |
| `--test-cmd "<cmd>"`           | Run unit tests after each patch.          | `--test-cmd "pytest -q"`    |
| `--auto-test`                  | Make the test pass blocking.              |                             |

All aider needs is: *print errors, exit ≠ 0*. The LLM then gets the error text and can auto-fix in the next chat round if you’re in interactive mode. ([Aider][3])

---

## 5 · CI / Dev-container snippet

```Dockerfile
# --- base OS layer ---
RUN apt-get update && apt-get install -y --no-install-recommends git build-essential \
    && rm -rf /var/lib/apt/lists/*

# --- Python & aider ---
RUN pip install --no-cache-dir aider-chat ruff pytest

# --- generic entrypoint ---
WORKDIR /workspace
COPY . .
CMD ["aider", "--apply", "incoming.patch", "--auto-lint", "--auto-test", "--commit", "--yes-always"]
```

Pipe your patch in via CI or mount it in `/workspace/incoming.patch`.

---

## 6 · Troubleshooting quick chart

| Symptom                                              | Likely cause                                                       | Fix                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| “✗ Failed to apply hunk”                             | Search text didn’t match exactly.                                  | Add more context lines or switch to `udiff`.                       |
| Linter keeps failing even after AI fix               | Formatter exits ≠ 0 on first run.                                  | Wrap formatter in a two-pass shell script (see docs). ([Aider][3]) |
| Patch applies but nothing committed                  | `--auto-commits` disabled or repo dirty and `--dirty-commits` off. | Re-enable or clean working tree.                                   |
| Extremely large diff blows token limit (interactive) | Consider non-interactive `--apply` + manual commit message.        |                                                                    |

---

### TL;DR cheat-sheet

```bash
# create diff (any format from §2)
vim fix.diff

# dry-run
aider --apply fix.diff --dry-run

# real run with safety
aider --apply fix.diff --auto-lint --test-cmd "pytest" --commit
```

You now have every moving part: **diff grammar ➜ aider flags ➜ lint/test safeguards ➜ CI hooks**. Patch away!

[1]: https://aider.chat/docs/config/options.html "Options reference | aider"
[2]: https://aider.chat/2023/12/21/unified-diffs.html "Unified diffs make GPT-4 Turbo 3X less lazy | aider"
[3]: https://aider.chat/docs/usage/lint-test.html "Linting and testing | aider"
