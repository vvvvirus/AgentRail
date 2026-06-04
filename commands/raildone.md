---
name: "Rail: Done"
description: Archive a completed task - moves it to archive with date prefix and summary
category: Workflow
tags: [workflow, rail, archive]
---

Archive a completed task.

**Input**: Optionally specify a task name (e.g., `/raildone organize-photos`). If omitted, prompt for selection from active tasks.

**Steps**

0. **Locate runtime** — The runtime CLI is installed alongside these commands in your agent config directory:
   ```bash
   RT=$(find "$HOME" -maxdepth 4 -type f -path "*/agentrail/cli.ts" 2>/dev/null | head -1)
   ```
   If `$RT` is empty, skip all runtime-dependent steps.

1. **Select task** — Announce "Using task: <name>". Verify `agentrail/tasks/<name>/` exists.

2. **Check completion** —
   ```bash
   npx tsx $RT status <name>   ```
   - If `checks` exist but some false → warn. If `status: "verified"` → all good.
   - Parse tasks.md for top-level `- [x]` / `- [ ]` counts.
   - If verification incomplete: ask user to confirm proceeding without it.
   - If incomplete tasks remain: warn with count, ask to confirm.
   - If no tasks.md: error — task wasn't properly planned.

3. **Auto-detect service dependencies for knowledge graph** —
   ```bash
   npx tsx $RT next-checkpoint <name>   ```
   Parse `files_changed` and `artifacts` from the latest checkpoint. Extract top-level directory names from file paths as candidate service names:
   - Split each path into segments, take the first non-hidden directory (e.g., `src/auth/handler.ts` → `src`)
   - Filter out `node_modules`, `.git`, and dot-prefixed dirs
   - Deduplicate

   Present candidates to user:
   ```
   ## Knowledge Graph: detected services
   From checkpoint artifacts, these look like affected services:
   - src/
   - docs/
   Record any as knowledge graph entries?
   ```
   For each confirmed service, ask for `depends-on` (comma-separated service names or skip). Then:
   ```bash
   npx tsx $RT kg-add <svc> --depends-on="svc1,svc2"   ```
   If user skips all, note "Knowledge graph: skipped by user." in the archive summary.
   If no candidates found (empty checkpoint or no file paths), silently skip.

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
   mkdir -p agentrail/tasks/archive
   mv agentrail/tasks/<name> agentrail/tasks/archive/YYYY-MM-DD-<name>
   ```
   If target exists, append `-2`, `-3`, etc.

6. **Display** —
   ```
   ## Archive Complete
   **Task:** <name>  **Archived to:** agentrail/tasks/archive/YYYY-MM-DD-<name>/
   **Result:** <outcome>  **Verification:** <status>
   ```
   With warnings: show incomplete tasks and verification issues.

**Guardrails**
- **Language**: English only. Do not insert Chinese or mix languages.
- Check verification before archiving — warn but don't block.
- Show clear summary. Significant plan deviations → note them.
- Date prefix = archive date (not creation date).
- **Project root**: Auto-detected by runtime from `process.cwd()`. No manual flag needed.
