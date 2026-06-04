---
name: "Rail: List"
description: List all active and archived tasks
category: Workflow
tags: [workflow, rail]
---

List all tasks - active and archived.

**Steps**

0. **Locate runtime** — The runtime CLI is installed alongside these commands in your agent config directory:
   ```bash
   RT=$(find "$HOME" -maxdepth 4 -type f -path "*/agentrail/cli.ts" 2>/dev/null | head -1)
   ```
   If `$RT` is empty, skip runtime-dependent steps (verification status lookup).

1. **Scan active tasks** —
   ```bash
   ls -d agentrail/tasks/*/ 2>/dev/null | grep -v archive
   ```
   Skip anything without a tasks.md.

2. **Parse tasks** — For each active task:
   - Read proposal.md for the goal: extract the first `## ` heading line (language-agnostic)
   - Parse tasks.md for `- [x]` / `- [ ]` counts
   - Read log.md for last activity timestamp
   - Run `npx tsx $RT status <name>` for verification status (if runtime available)

3. **Display table** —
   ```
   ## Active Tasks
   | Task | Goal | Progress | Verification | Last Activity |
   |------|------|----------|-------------|---------------|
   | <name> | <one-line goal> | N/M (X%) | <status> | <timestamp> |
   ```

4. **Scan archive** —
   ```bash
   ls -1dt agentrail/tasks/archive/*/ 2>/dev/null | head -10
   ```
   For each: read completion summary from proposal.md.

5. **Display recent archives** —
   ```
   ## Recent Archives (10 most recent)
   | Task | Archived | Result | Verification |
   |------|----------|--------|-------------|
   | <name> | <date> | <outcome> | <status> |
   ```

6. **Display summary** — Total active, total archived.

**Guardrails**
- **Language**: English only. Do not insert Chinese or mix languages.
- Show both active and archived tasks — don't require separate commands.
- Active tasks sorted by last activity (most recent first).
- Group by status: in-progress first, then pending, then blocked.
- If runtime is available, use runtime data for verification status. If not, fall back to tasks.md parsing.
- **Project root**: Auto-detected by runtime from `process.cwd()`. No manual flag needed.
