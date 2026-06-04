---
name: "Rail: Verify"
description: Run verification commands (tests, lint, typecheck) for a task and display results
category: Workflow
tags: [workflow, rail, verify]
---

Run verification for a task using the AgentRail runtime. Detects project type, runs configured verify commands, and displays results.

**Input**: Optionally specify a task name. If omitted, prompt for selection from active tasks.

**Steps**

0. **Locate runtime** — The runtime CLI is installed alongside these commands in your agent config directory:
   ```bash
   RT=$(find "$HOME" -maxdepth 4 -type f -path "*/agentrail/cli.ts" 2>/dev/null | head -1)
   ```
   If `$RT` is empty, fall back to auto-detection mode (step 2 fallback).

1. **Select the task**

   If a task name is provided, use it. Otherwise list active tasks from `agentrail/tasks/` and use the **AskUserQuestion tool** to let the user select.

   Verify `agentrail/tasks/<name>/` exists. If not, show error with available tasks.

2. **Run the verification**

   ```bash
   npx tsx $RT verify <name>
   ```

   This command reads verifyCommands from runtime state, runs each one, and outputs:
   - JSON lines to stderr (per-check results with output)
   - JSON to stdout (overall result)

   If `$RT` is empty (runtime not installed), use AskUserQuestion to collect verify commands from the user ("What commands should I run to verify this task?"), then execute them directly with Bash. Report pass/fail per command.
   If `$RT` is available but no runtime state exists yet, run `npx tsx $RT init <name>` to auto-detect, then `npx tsx $RT verify <name>`.

3. **Parse results and display**

   Parse the JSON output from stdout and stderr. Display a formatted summary:

   ```
   ## Verification: <task-name>

   | Check | Command | Result |
   |-------|---------|--------|
   | tests | npm test | Passed |
   | lint  | npm run lint | Failed |
   ...

   **Overall:** N/M checks passed
   ```

   If any checks failed, show the error output (truncated to 500 chars):
   ```
   ### Failed: lint
   <error output>
   ```

4. **Display final status**

   - All passed: "All verification checks passed. Task can be archived with `/raildone <name>`."
   - Some failed: "Some checks failed. Fix the issues above, then re-run `/railverify <name>`."
   - No commands configured: "No verification commands configured for auto-detected project type."
