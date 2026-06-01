---
name: "Task: List"
description: List all active and archived tasks
category: Workflow
tags: [workflow, task]
---

List all tasks - active and archived.

**Steps**

1. **Scan active tasks** —
   ```bash
   ls -d task-workflow/tasks/*/ 2>/dev/null | grep -v archive
   ```
   Skip anything without a tasks.md.

2. **Parse tasks** — For each active task:
   - Read proposal.md for the goal (first `## 目标` line)
   - Parse tasks.md for `- [x]` / `- [ ]` counts
   - Read log.md for last activity timestamp
   - Run `npx tsx ~/.claude/task-workflow/workflow-runtime.ts status <name> --project-root=<PROJECT_ROOT>` for verification status (if runtime available)

3. **Display table** —
   ```
   ## Active Tasks
   | Task | Goal | Progress | Verification | Last Activity |
   |------|------|----------|-------------|---------------|
   | <name> | <one-line goal> | N/M (X%) | <status> | <timestamp> |
   ```

4. **Scan archive** —
   ```bash
   ls -1dt task-workflow/tasks/archive/*/ 2>/dev/null | head -10
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
- **Project root**: Determine PROJECT_ROOT as the directory containing `task-workflow/`. Pass `--project-root=<PROJECT_ROOT>` to every `workflow-runtime.ts` call.
