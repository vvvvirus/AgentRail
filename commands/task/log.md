---
name: "Task: Log"
description: Record a manual checkpoint note to a task's execution log
category: Workflow
tags: [workflow, task, log]
---

Record a checkpoint to a task's log.md. Auto-generates a structured summary (progress, done, pending, blockers, plan changes) — no need to manually summarize. Optionally add notes: `/task:log <name> <notes>`.

**Input**: Optionally specify a task name (e.g., `/task:log organize-photos`). If omitted, prompt for selection from active tasks.

**Steps**

1. **Select task** — Announce "Using task: <name>". Verify `task-workflow/tasks/<name>/` exists.

2. **Auto-detect changes** —
   ```bash
   npx tsx ~/.claude/task-workflow/workflow-runtime.ts checkpoints <name> --project-root=<PROJECT_ROOT>
   npx tsx ~/.claude/task-workflow/workflow-runtime.ts status <name> --project-root=<PROJECT_ROOT>
   ```
   Check git diff for task files since last checkpoint.
   Count completed tasks this session vs last recorded session end.
   Compare current tasks.md against plan snapshot from checkpoint.

3. **Show delta** — Display what Auto-detect found:
   ```
   ## Checkpoint: <name>
   **Time:** <now>
   ### Progress
   - **Completed this session:** <list or "None">
   - **Still pending:** <list>
   - **Progress delta:** N → M (since last session)
   ### Changes detected
   - **Files modified:** <list or "None">
   - **Plan changes:** <yes/no — details>
   - **Verification:** <status from runtime>
   - **Blockers:** <list or "None">
   ```

4. **Prompt for notes** — Ask: "Add notes?" Accept freeform text or skip. If user passed notes as argument, use directly.

5. **Write checkpoint** — Append to log.md:
   ```markdown
   ---
   ## Checkpoint: YYYY-MM-DD HH:MM
   **Trigger:** manual
   ### Progress
   **Completed this session:** <list>
   **Still pending:** <list>
   **Progress delta:** N → M
   ### State
   **Files modified:** <list>
   **Plan changes:** <details or "None">
   **Verification:** <status>
   **Blockers:** <list or "None">
   **Notes:** <user notes or "None">
   ```

6. **Confirm** — Display summary of recorded checkpoint.

**Guardrails**
- **Language**: English only. Do not insert Chinese or mix languages.
- Auto-detect ALL changes — don't make the user summarize.
- Delta = only what changed since last session end, not full task history.
- Checkpoint writes directly to log.md. Don't ask for confirmation before writing.
- **Project root**: Determine PROJECT_ROOT as the directory containing `task-workflow/`. Pass `--project-root=<PROJECT_ROOT>` to every `workflow-runtime.ts` call.
