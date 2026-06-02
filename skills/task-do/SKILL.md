---
name: task-do
description: Execute tasks from a planned task. Use when the user wants to start executing, continue execution, or work through task steps. Also use when resuming a previously paused task, picking up where you left off, or when the user says "continue with", "keep going on", "let's work on", "execute the plan", "do the tasks". Reads proposal, design, tasks, and log artifacts, then loops through pending tasks marking them complete.
compatibility: Requires Claude Code and Node.js >= 18 (for workflow-runtime.ts).
metadata:
  author: custom
  version: "2.2"
---

Execute tasks from a planned task. Uses the task-workflow runtime for DAG-based ordering, checkpointing, and verification. Drives Claude Code's native progress bar via TaskCreate/TaskUpdate.

**Input**: Optionally a task name. If omitted, infer from context or prompt for selection.

**Steps**

1. **Select and validate task** — Announce "Using task: <name>". Verify `task-workflow/tasks/<name>/` exists with `tasks.md`.

2. **Read all context files** — proposal.md, design.md, tasks.md, log.md.

3. **Load runtime state** — First verify runtime is available: `test -f ~/.claude/task-workflow/workflow-runtime.ts`. If missing, skip all runtime calls, use markdown-only mode. Otherwise `npx tsx ~/.claude/task-workflow/workflow-runtime.ts status <name>`. If `_runnable.done: true`, skip to step 10a.

4. **Check for compact recovery** — `npx tsx ~/.claude/task-workflow/workflow-runtime.ts next-checkpoint <name>` + status. Recovery logic:
   - Tasks with `status: "in_progress"` in task-state.json → interrupted by compact.
   - checkpoint says in_progress + task-state says in_progress → re-execute task N.
   - checkpoint says done + task-state says pending → trust task-state, mark pending.
   - log.md BLOCKED → show blocker, pause. Do not resume.
   - Announce recovery point, skip to step 7 loop.

5. **Show progress and register tasks for native UI** —
   Record `session_start_completed = N`. Display summary header.

   Then use **TaskCreate** for each pending task to register them in Claude Code's native progress bar:
   ```
   TaskCreate(subject="<description>", description="Task N/M from <task-name>")
   ```
   Store each returned task ID mapped to its runtime index. Completed tasks from previous sessions do NOT get re-created — they're already done.

6. **Write session start to log.md** —
   ```markdown
   ---
   ## Session: YYYY-MM-DD HH:MM
   **Starting progress:** N/M  **Status:** ACTIVE
   **Pending:** <list>
   ```

7. **Execute tasks (loop)** —

   a. `npx tsx ~/.claude/task-workflow/workflow-runtime.ts next <name>` → if `done: true`, go to step 10a. If deadlock, warn and pause.

   b. **Mark in progress** — Use **TaskUpdate** on the matching TaskCreate task: `status: "in_progress"`. This shows ◼ in the native progress bar.

   c. Review design.md for relevant strategy/decisions.

   d. **Write pre-task checkpoint:**
      ```bash
      npx tsx ~/.claude/task-workflow/workflow-runtime.ts checkpoint <name> "starting-task-<N>" --files="<known-files>" --artifacts="<produced-files>" --project-root=<PROJECT_ROOT>
      ```
      If checkpoint fails (non-zero exit), log warning but **do not block** — continue to step 7e. Checkpoint failure must never stop task execution. If runtime is completely unavailable, skip silently and fall back to markdown-only mode.

   e. Execute the task. After success:
      - Mark runtime done: `npx tsx ~/.claude/task-workflow/workflow-runtime.ts step-done <name> <index> --artifacts="<produced-files>" --project-root=<PROJECT_ROOT>`
      - **Mark complete in native UI**: Use **TaskUpdate** on the matching task: `status: "completed"`. This shows ✔ in the native progress bar.
      - Update `- [ ]` → `- [x]` in tasks.md

   f. If a task fails: do NOT mark done in either system. Report error and pause.

   **Pause if:** task ambiguous → AskUserQuestion; design issue → suggest `/task:plan <name>`; error/blocker → report; user interrupts; manual action needed.

   **Fallback (no runtime):** Parse tasks.md checkboxes directly. Still use TaskCreate/TaskUpdate for native UI. Skip checkpoint writes and verification.

8. **Run verification** — `npx tsx ~/.claude/task-workflow/workflow-runtime.ts verify <name>`. Report results.

9. **Session end logging** —

   **a. All complete** — `npx tsx ~/.claude/task-workflow/workflow-runtime.ts complete <name>`. Append to log.md:
   ```markdown
   ## Session end: YYYY-MM-DD HH:MM
   **Result:** Completed  **Status:** COMPLETE
   **Tasks this session:** N  **Progress:** M/M
   **Verification:** <summary>
   ```
   All native tasks will show ✔. Suggest `/task:done <name>`.

   **b. Blocked** — Append:
   ```markdown
   ## Session end: YYYY-MM-DD HH:MM
   **Result:** Paused  **Status:** BLOCKED
   **Tasks this session:** N  **Progress:** N/M
   **Blocker:** <specific issue>
   ```

   **c. Other pauses** — Do NOT auto-write. Prompt: "Run `/task:log <name>` to checkpoint."

**Guardrails**
- **Language**: This skill file is English only. Do not insert Chinese or mix languages — keep all instruction text, comments, and output templates in English.
- Keep going until done or blocked. Don't stop early.
- Use `~/.claude/task-workflow/workflow-runtime.ts next` for ordering — never parse tasks.md manually.
- TaskCreate for all pending tasks at session start. TaskUpdate to `in_progress` before executing, `completed` after.
- Write pre-task checkpoint BEFORE executing each task (not after).
- On startup, check for in-progress tasks and offer recovery.
- If task description is ambiguous, STOP and ask — never guess.
- Call `step-done` and `checkpoint` immediately after each task.
- Verification is mandatory after execution. Report results.
- For destructive actions, confirm with user first.
