---
name: "Task: Plan"
description: Plan a new task or update an existing plan — create proposal, design, and task checklist in one step
category: Workflow
tags: [workflow, task]
---

Plan a new task or update an existing one. Creates (or edits) the task directory and all planning artifacts.

I'll create or update:
- proposal.md (what & why)
- design.md (strategy & approach)
- tasks.md (step-by-step checklist)

When ready to execute, run /task:do

---

**Input**: The argument after `/task:plan` is the task name (kebab-case), OR a description of what the user wants to accomplish. For existing tasks, the same command enters update mode — describe changes inline or when prompted.

**Steps**

1. **Derive task name** — If no clear input, use AskUserQuestion: "What task do you want to plan?" Derive kebab-case name. Do NOT proceed without understanding the goal.

2. **Check for existing task** — If `task-workflow/tasks/<name>/` exists → skip to step 11 (update mode). Otherwise continue.

3. **Detect verify commands** — Run `npx tsx ~/.claude/task-workflow/workflow-runtime.ts` to verify runtime works. Detection is automatic during `init` (step 5) — `detectVerifyCommands()` scans cwd + immediate subdirectories for package.json/Cargo.toml/go.mod/pyproject.toml. After `init`, read `task-state.json` to see what was detected. If zero commands found or user wants custom checks, use AskUserQuestion to collect them.

4. **Create task directory and log.md** —
   ```bash
   mkdir -p task-workflow/tasks/<name>
   ```
   Create `task-workflow/tasks/<name>/log.md`:
   ```markdown
   # Execution Log: <name>
   ## Overview
   Task created on YYYY-MM-DD.
   ```

5. **Initialize runtime state** —
   ```bash
   npx tsx ~/.claude/task-workflow/workflow-runtime.ts init <name> --tasks="<t1>,<t2>,..." --project-root=<PROJECT_ROOT>
   ```
   For dependencies: `--deps="1:0 2:0,1"` (0-based indices). Format: `task-index:dep-index[,dep-index]`. Out-of-range indices are warned and skipped.

6. **Create proposal.md** — Write `task-workflow/tasks/<name>/proposal.md`:
   ```markdown
   # <Task Title>
   ## 目标
   <One sentence — what success looks like>
   ## 动机
   <Why this needs to be done>
   ## 范围
   ### 包含
   - <what will be done>
   ### 不包含
   - <what will NOT be done>
   ## 约束
   - <limits, requirements, boundaries>
   ```
   Keep it concise. Scope is the most important section.

7. **Create design.md** — Write `task-workflow/tasks/<name>/design.md`:
   ```markdown
   # 设计：<Task Title>
   ## 策略
   <High-level approach>
   ## 关键决策
   - <Decision>: <Rationale>
   ## 风险
   - <Risk>: <Mitigation>
   ```
   Focus on "how", not "what". Explain WHY for each decision.

8. **Create tasks.md** — Write `task-workflow/tasks/<name>/tasks.md`:
   ```markdown
   # 任务清单：<Task Title>
   ## 前置
   - [ ] <setup or prep>
   ## 执行
   - [ ] <Task 1 — specific, verifiable action>
   - [ ] <Task 2>
   ...
   ## 验证
   - [ ] <How to confirm success>
   ```
   Guidelines:
   - 3-15 top-level tasks. Dependencies in runtime via `--deps`, NOT inline text.
   - Each task = single verifiable action. Order by dependency.
   - Sub-tasks may be indented but don't count toward the total.

9. **Verify all artifacts** —
   ```bash
   ls -la task-workflow/tasks/<name>/proposal.md task-workflow/tasks/<name>/design.md task-workflow/tasks/<name>/tasks.md task-workflow/tasks/<name>/log.md task-workflow/tasks/<name>/runtime/task-state.json
   grep -c "## 目标" task-workflow/tasks/<name>/proposal.md
   grep -c "## 策略" task-workflow/tasks/<name>/design.md
   grep -c "## 执行" task-workflow/tasks/<name>/tasks.md
   grep -c "## 验证" task-workflow/tasks/<name>/tasks.md
   ```

10. **Run review (internal)** — Review the plan before showing it to the user. Two layers:

    **Layer 1 — Deterministic checks** (execute directly, zero LLM cost):
    - Task count: 3-15? If <3 → WARN "too few tasks, may be under-planned." If >15 → WARN "too many tasks, consider grouping."
    - Dep validity: all `deps` IDs exist in the task list? If not → BLOCK "broken dependency reference."
    - Verify coverage: at least one verify command or verification step? If not → WARN "no verification configured."
    - Granularity: any task description >50 chars without a verb? If yes → WARN "task may be too vague."

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

    After review, append result to the summary. WARN does not block `/task:do`; BLOCK does.

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
    Ready. Run `/task:do <name>` to start.
    ```

---

### UPDATE MODE

12. **Read all existing artifacts** — proposal.md, design.md, tasks.md, log.md. Load runtime: `npx tsx ~/.claude/task-workflow/workflow-runtime.ts status <name> --project-root=<PROJECT_ROOT>`.

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
    npx tsx ~/.claude/task-workflow/workflow-runtime.ts init <name> --tasks="<updated>" [--deps="..."] --project-root=<PROJECT_ROOT>
    npx tsx ~/.claude/task-workflow/workflow-runtime.ts step-done <name> <index> --project-root=<PROJECT_ROOT>  # per completed task
    ```

16. **Record change in log.md immediately** —
    ```markdown
    ---
    ## Plan update: YYYY-MM-DD HH:MM
    **触发：** <reason>
    **改动：** <summary>
    **修改文件：** <file list>
    ```

17. **Confirm** —
    ```
    ## Plan updated: <name>
    **Files changed:** <list>
    **Preserved:** N/M completions, log.md history
    Resume with `/task:do <name>`.
    ```

**Guardrails**
- **Language**: This command file is English only. Plan artifacts (proposal/design/task-workflow/tasks/log) use the user's language — section headers in templates above are Chinese because the user communicates in Chinese. When writing plan files, match the user's language. Do NOT insert Chinese into this command's instruction text.
- Create ALL artifacts; don't skip any.
- If the goal/scope/constraints/approach is unclear, STOP and use AskUserQuestion.
- State assumptions explicitly in the artifact.
- Task names: kebab-case. Each checkbox = concrete action.
- Dependencies in runtime/task-state.json, NOT tasks.md.
- Write log.md during planning. After every update, append to log.md immediately.
- In update mode, only edit files that need changing. Preserve completed checkboxes.
- **Project root**: Determine PROJECT_ROOT as the directory containing `task-workflow/`. Pass `--project-root=<PROJECT_ROOT>` to every `workflow-runtime.ts` call.
