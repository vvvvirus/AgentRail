---
name: "Task: Done"
description: Archive a completed task - moves it to archive with date prefix and summary
category: Workflow
tags: [workflow, task, archive]
---

Archive a completed task.

**Input**: Optionally specify a task name (e.g., `/task:done organize-photos`). If omitted, prompt for selection from active tasks.

**Steps**

1. **Select task** — Announce "Using task: <name>". Verify `task-workflow/tasks/<name>/` exists.

2. **Check completion** —
   ```bash
   npx tsx ~/.claude/task-workflow/workflow-runtime.ts status <name> --project-root=<PROJECT_ROOT>
   ```
   - If `checks` exist but some false → warn. If `status: "verified"` → all good.
   - Parse tasks.md for top-level `- [x]` / `- [ ]` counts.
   - If verification incomplete: ask user to confirm proceeding without it.
   - If incomplete tasks remain: warn with count, ask to confirm.
   - If no tasks.md: error — task wasn't properly planned.

3. **Prompt for knowledge graph** — Ask: "Record service dependencies?" If yes: `npx tsx ~/.claude/task-workflow/workflow-runtime.ts kg-add <svc> --depends-on="..." --used-by="..." --project-root=<PROJECT_ROOT>`

4. **Generate completion summary** — Append to proposal.md:
   ```markdown
   ---
   ## Completion Summary
   - **Completed:** YYYY-MM-DD
   - **Result:** <one-line outcome>
   - **Tasks:** N/M done
   - **Verification:** <passed | skipped | failed: X>
   - **Deviations:** <or "None">
   ```

5. **Archive** —
   ```bash
   mkdir -p task-workflow/tasks/archive
   mv task-workflow/tasks/<name> task-workflow/tasks/archive/YYYY-MM-DD-<name>
   ```
   If target exists, append `-2`, `-3`, etc.

6. **Display** —
   ```
   ## Archive Complete
   **Task:** <name>  **Archived to:** task-workflow/tasks/archive/YYYY-MM-DD-<name>/
   **Result:** <outcome>  **Verification:** <status>
   ```
   With warnings: show incomplete tasks and verification issues.

**Guardrails**
- **Language**: English only. Do not insert Chinese or mix languages.
- Check verification before archiving — warn but don't block.
- Show clear summary. Significant plan deviations → note them.
- Date prefix = archive date (not creation date).
- **Project root**: Determine PROJECT_ROOT as the directory containing `task-workflow/`. Pass `--project-root=<PROJECT_ROOT>` to every `workflow-runtime.ts` call.
