[English](README.md) | [中文](README.zh-CN.md)

# Claude Task Workflow

Plan → review → execute → archive any multi-step task inside Claude Code. File processing, data migration, research, content creation — anything that takes more than one step and is worth remembering later.

Not a code framework. No dependencies, no config, no CLI. Six slash commands, one skill, and a directory of markdown files. Driven by a TypeScript runtime for deterministic DAG ordering, checkpointing, and verification.

## What's new in v2.4.0

- **Artifact tracking**: SubTask and Checkpoint now carry an `artifacts` field — a list of files produced by each task. Reviewer and downstream tasks can locate outputs without re-reading entire execution logs. Pass `--artifacts=<f1>,<f2>` to `step-done` and `checkpoint`.
- **Structured validation**: New `validate` command runs 4 deterministic checks (task_count, deps_valid, verify_coverage, granularity) with structured JSON output and standard exit codes (0=PASS / 1=WARN / 2=BLOCK). Callable from scripts, reusable by plan review.
- **Skills merged into commands**: task-plan, task-done, task-log, task-list are standalone commands. Only task-do remains as a skill.
- **Plan review agent**: Two-layer review — deterministic (now via `validate`) + LLM subagent. Returns PASS / WARN / BLOCK.
- **Native progress UI**: `/task:do` drives Claude Code's built-in progress bar via TaskCreate/TaskUpdate.
- **Pre-task checkpoint + compact recovery**: Checkpoints written BEFORE each task. Auto-recovery from context compaction.
- **Bilingual README + runtime included in install**.

## How it works

```
/task:plan "organize 5000 photos by year and rename them"

  Creates:  task-workflow/tasks/organize-photos/
            ├── proposal.md    ← What & why. Goal, scope, constraints.
            ├── design.md      ← How. Strategy, key decisions, risks.
            ├── tasks.md       ← Step-by-step checklist. Each line one action.
            ├── log.md         ← Execution journal. Created during planning.
            └── runtime/       ← Machine-verifiable task state + checkpoints.

  Also runs an internal review (deterministic checks + LLM subagent)
  and shows PASS / WARN / BLOCK before you start.

/task:do organize-photos

  Registers all pending tasks in Claude Code's native progress bar (◻).
  Loops through tasks, marking current as ◼, completed as ✔.
  Writes pre-task checkpoints before each step.
  Auto-recovers from compact interruptions.
  Writes session end to log.md (on completion or blocker).

/task:log organize-photos

  Auto-generates a structured checkpoint:
    → Progress delta since last checkpoint
    → Completed tasks this session
    → Still-pending tasks
    → Plan changes detected
    → Verification status (from runtime state)
    → Unresolved blockers
  Asks if you want to add freeform notes.

/task:plan organize-photos "narrow scope to PDF only"

  Same command for creating AND updating plans. Enters update mode:
  shows current state, asks what to change, surgically edits files.
  Preserves completed checkboxes and session history.

/task:done organize-photos

  Appends completion summary to proposal.md.
  Moves to task-workflow/tasks/archive/2026-05-29-organize-photos/.

/task:verify organize-photos

  Runs verification checks (tests, lint, typecheck, build).
  Displays per-check pass/fail results.

/task:list

  Lists all active tasks with goals, progress, and verification status.
  Shows the 10 most recently archived tasks with outcomes.
```

## Artifacts

| File | Purpose | Who writes it |
|------|---------|--------------|
| `proposal.md` | What & why. Goal, motivation, scope, constraints. | `/task:plan` |
| `design.md` | How. Strategy, key decisions, risks. | `/task:plan` |
| `tasks.md` | Checklist. Each line one verifiable action. | `/task:plan` (planned), `/task:do` (checked) |
| `log.md` | Execution journal. Sessions, checkpoints, plan revisions, blockers. | `/task:plan` (created + revisions), `/task:do` (auto), `/task:log` (manual) |

## Key design decisions

**No guessing.** If a task description is ambiguous, the agent stops and asks. This is enforced in skill instructions, not left to the model's discretion.

**Log.md is the backbone.** Every session writes a start entry before executing and an end entry on completion or blocker. Plan revisions are recorded immediately. Checkpoints capture deltas — only what changed since last checkpoint.

**Artifacts are just markdown.** No YAML config, no JSON schema, no database. You can read, edit, or delete them with any text editor.

**Structured review, not LLM guesswork.** The plan review agent reads `task-state.json` (a task graph), not markdown text. Deterministic checks run first (zero LLM cost). The LLM subagent only sees the structured graph and is constrained to PASS/WARN/BLOCK — no rewriting, no scope creep.

**Pre-task checkpointing.** Checkpoints are written before executing, not after. This guarantees no work is lost if the context compacts mid-task. Recovery compares checkpoint data against `log.md` and `task-state.json` to determine the exact interruption point.

## Project structure

```
claude-task-workflow/
├── install.sh / install.ps1            # Installers
├── README.md
├── LICENSE
├── commands/task/                      # 6 slash commands (standalone)
│   ├── plan.md
│   ├── do.md
│   ├── done.md
│   ├── list.md
│   ├── log.md
│   └── verify.md
├── skills/                             # 1 skill
│   └── task-do/SKILL.md                # Execute + native UI + recovery
└── task-workflow/                      # Runtime + tasks (installed to ~/.claude/)
    ├── tasks/                          # Active + archived task plans
    │   ├── <active-task>/
    │   └── archive/
    ├── workflow-runtime.ts             # DAG, checkpoint, verify engine
    ├── package.json
    └── tsconfig.json
```

## Install

```bash
git clone https://github.com/vvvvirus/claude-task-workflow.git
cd claude-task-workflow

# macOS / Linux
./install.sh

# Windows (PowerShell)
.\install.ps1
```

Copies the task-do skill to `~/.claude/skills/`, all 6 commands to `~/.claude/commands/task/`, and runtime to `~/.claude/task-workflow/`. Runs `npm install` in `~/.claude/task-workflow/` to cache the `tsx` dependency. Restart Claude Code. No other setup.

## Requirements

- Claude Code
- Node.js >= 18 (the `tsx` package auto-resolves via `npx`; `npm install` during setup pre-caches it)

## After install

```
~/.claude/
├── skills/task-do/   ← Skill (Claude Code auto-discovers)
├── commands/task/    ← Commands (Claude Code auto-discovers)
└── task-workflow/    ← Runtime (one clean subdirectory)
    ├── workflow-runtime.ts
    ├── package.json
    ├── tsconfig.json
    └── node_modules/
```

## Archive structure

```
your-project/
└── task-workflow/
    ├── tasks/                            # Active
    │   └── organize-photos/
    │       ├── proposal.md
    │       ├── design.md
    │       ├── tasks.md
    │       ├── log.md
    │       └── runtime/
    ├── tasks/archive/                    # Done
    │   └── 2026-05-29-organize-photos/
    ├── workflow-runtime.ts
    ├── package.json
    └── tsconfig.json
```
