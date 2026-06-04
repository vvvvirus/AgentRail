---
name: "Rail: Plan"
description: Plan a new task or update an existing plan — create proposal, design, and task checklist in one step
category: Workflow
tags: [workflow, rail]
---

Plan a new task or update an existing one. Creates (or edits) the task directory and all planning artifacts.

I'll create or update:
- proposal.md (what & why)
- design.md (strategy & approach)
- tasks.md (step-by-step checklist)

When ready to execute, run /raildo

---

**Input**: The argument after `/railplan` is the task name (kebab-case), OR a description of what the user wants to accomplish. For existing tasks, the same command enters update mode — describe changes inline or when prompted.

**Steps**

0. **Locate runtime** — The runtime CLI is installed alongside these commands in your agent config directory:
   ```bash
   RT=$(find "$HOME" -maxdepth 4 -type f -path "*/agentrail/cli.ts" 2>/dev/null | head -1)
   ```
   If `$RT` is empty, skip all runtime-dependent steps (init, validate, status, step-done).

1. **Derive task name** — If no clear input, use AskUserQuestion: "What task do you want to plan?" Derive kebab-case name. Do NOT proceed without understanding the goal.

2. **Check for existing task** — If `agentrail/tasks/<name>/` exists → skip to step 11 (update mode). Otherwise continue.

3. **Detect verify commands** — Run `npx tsx $RT` to verify runtime works. Detection is automatic during `init` (step 5) — `detectVerifyCommands()` scans cwd + immediate subdirectories for package.json/Cargo.toml/go.mod/pyproject.toml. After `init`, read `task-state.json` to see what was detected. If zero commands found or user wants custom checks: use AskUserQuestion to collect `name:command` pairs (e.g. "tests:npm test"), then write them directly to `verifyCommands` in `task-state.json`:
   ```json
   { "name": "tests", "command": "npm test" }
   ```

4. **Create task directory and log.md** —
   ```bash
   mkdir -p agentrail/tasks/<name>
   ```
   Create `agentrail/tasks/<name>/log.md`:
   ```markdown
   # Execution Log: <name>
   ## Overview
   Task created on YYYY-MM-DD.
   ```

5. **Initialize runtime state** —
   ```bash
   npx tsx $RT init <name> --tasks="<t1>,<t2>,..."   ```
   For dependencies: `--deps="1:0 2:0,1"` (0-based indices). Format: `task-index:dep-index[,dep-index]`. Out-of-range indices are warned and skipped.

6. **Create proposal.md** — Write `agentrail/tasks/<name>/proposal.md`. Match section headers to the user's language:
   ```markdown
   # <Task Title>
   ## Goal
   <One sentence — what success looks like>
   ## Motivation
   <Why this needs to be done>
   ## Scope
   ### In scope
   - <what will be done>
   ### Out of scope
   - <what will NOT be done>
   ## Constraints
   - <limits, requirements, boundaries>
   ```
   Keep it concise. Scope is the most important section.

7. **Create design.md** — Write `agentrail/tasks/<name>/design.md`. Match section headers to the user's language:
   ```markdown
   # Design: <Task Title>
   ## Strategy
   <High-level approach>
   ## Key decisions
   - <Decision>: <Rationale>
   ## Risks
   - <Risk>: <Mitigation>
   ```
   Focus on "how", not "what". Explain WHY for each decision.

8. **Create tasks.md** — Write `agentrail/tasks/<name>/tasks.md`. Match section headers to the user's language:
   ```markdown
   # Tasks: <Task Title>
   ## Setup
   - [ ] <setup or prep>
   ## Execute
   - [ ] <Task 1 — specific, verifiable action>
   - [ ] <Task 2>
   ...
   ## Verify
   - [ ] <How to confirm success>
   ```
   Guidelines:
   - 3-15 top-level tasks. Dependencies in runtime via `--deps`, NOT inline text.
   - Each task = single verifiable action. Order by dependency.
   - Sub-tasks may be indented but don't count toward the total.

9. **Verify all artifacts** —
   ```bash
   ls -la agentrail/tasks/<name>/proposal.md agentrail/tasks/<name>/design.md agentrail/tasks/<name>/tasks.md agentrail/tasks/<name>/log.md agentrail/tasks/<name>/runtime/task-state.json
   grep -c "^## " agentrail/tasks/<name>/proposal.md
   grep -c "^## " agentrail/tasks/<name>/design.md
   grep -c "^- \[" agentrail/tasks/<name>/tasks.md
   ```

10. **Run review (internal)** — Review the plan before showing it to the user. Two layers:

    **Layer 1 — Deterministic checks** (run via validate command, zero LLM cost):
    ```bash
    npx tsx $RT validate <name>    ```
    Runs 4 structured checks: task_count, deps_valid, verify_coverage, granularity.
    Exit 0 = PASS, 1 = WARN, 2 = BLOCK. WARN continues; BLOCK stops here — fix the issues before Layer 2.

    **Layer 2 — LLM review** (spawn via Agent tool, only if Layer 1 passes):
    Use Agent with a strict review prompt. Input is `task-state.json` — not markdown text. Output format:
    ```
    VERDICT: PASS | WARN | BLOCK
    COMPLETENESS: <missing pieces or "OK">
    DEPENDENCIES: <ordering issues or "OK">
    GRANULARITY: <size issues or "OK">
    RISKS: <risks or "OK">
    ```
    Subagent constraints (hardcoded in prompt):
    - Only review the task graph structure. Do NOT read proposal.md or design.md.
    - Do NOT suggest rewrites, alternative approaches, or scope changes.
    - Do NOT execute anything. You have no tools.
    - Only report problems — don't fix them.
    - If everything looks fine, say PASS. Do not invent issues.

    After review, append result to the summary. WARN does not block `/raildo`; BLOCK does.

11. **Show summary** —
    ```
    ## Task Planned: <name>
    **Goal:** <from proposal.md>
    **Strategy:** <from design.md>
    ### Tasks (N)
    1. [ ] <task>
    ...
    ### Review: <PASS|WARN|BLOCK>
    <details if not PASS>
    ---
    Ready. Run `/raildo <name>` to start.
    ```

---

### UPDATE MODE

12. **Read all existing artifacts** — proposal.md, design.md, tasks.md, log.md. Load runtime: `npx tsx $RT status <name> --project-root=<PROJECT_ROOT>`.

13. **Show current state and ask what to change** —
    ```
    ## Update Plan: <name>
    **Goal:** <current>  **Progress:** N/M done
    ### Current tasks
    1. [x] <task>  2. [ ] <task>  ...
    ```
    Ask: "What needs to change?" If user provided changes inline, use those.

14. **Edit only what changed** —
    | Change | File |
    |--------|------|
    | Goal/scope/constraints | proposal.md |
    | Strategy/decisions/risks | design.md |
    | Tasks added/removed/reordered | tasks.md + re-init runtime |

    Preserve checkbox states for unchanged tasks. Reset `[x]`→`[ ]` only if the task's core action changed. Flag any task that may need re-doing.

15. **Sync runtime state** — Re-init with updated task list, then restore progress for completed tasks:
    ```bash
    npx tsx $RT init <name> --tasks="<updated>" [--deps="..."]    npx tsx $RT step-done <name> <index> --project-root=<PROJECT_ROOT>  # per completed task
    ```

16. **Record change in log.md immediately** —
    ```markdown
    ---
    ## Plan update: YYYY-MM-DD HH:MM
    **Reason:** <reason>
    **Changes:** <summary>
    **Files modified:** <file list>
    ```

17. **Confirm** —
    ```
    ## Plan updated: <name>
    **Files changed:** <list>
    **Preserved:** N/M completions, log.md history
    Resume with `/raildo <name>`.
    ```

**Guardrails**
- **Language**: This command file is English only. Templates show English section headers — when writing artifacts, translate headers to match the user's language. Do NOT insert non-English text into this command's instruction text.
- Create ALL artifacts; don't skip any.
- If the goal/scope/constraints/approach is unclear, STOP and use AskUserQuestion.
- State assumptions explicitly in the artifact.
- Task names: kebab-case. Each checkbox = concrete action.
- Dependencies in runtime/task-state.json, NOT tasks.md.
- Write log.md during planning. After every update, append to log.md immediately.
- In update mode, only edit files that need changing. Preserve completed checkboxes.
- **Project root**: The runtime auto-detects project root from `process.cwd()`. No manual flag needed.
- **Artifacts**: When calling `step-done`, append `--artifacts=<file1>,<file2>` to record outputs per task.
