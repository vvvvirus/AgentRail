[English](README.md) | [中文](README.zh-CN.md)

# AgentRail

Plan → review → execute → archive any multi-step task inside your agent. File processing, data migration, research, content creation — anything that takes more than one step and is worth remembering later.

Not a code framework. No dependencies, no config, no CLI. Six slash commands, one skill, and a directory of markdown files. Driven by a TypeScript runtime for deterministic DAG ordering, checkpointing, and verification.

## What's new in v3.0.0

- **Rebranded to AgentRail**: Project renamed from "Claude Task Workflow". Commands changed from `/task:xxx` to `/railxxx` — shorter, no colon, agent-agnostic. Runtime directory renamed to `agentrail/`.
- **New command names**: `/railplan`, `/raildo`, `/raildone`, `/raillist`, `/raillog`, `/railverify`
- **Agent-agnostic language**: All docs and messages use "agent" instead of Claude-specific terms. Works with any agent that supports custom slash commands.
- **Modular runtime**: `src/` modules — task-graph, checkpoint, verify-runner, validate, knowledge-graph, and a thin `cli.ts` orchestrator. Each module independently testable.
- **Unit tests**: `node:test` tests covering DAG scheduling (getRunnableTask, deadlock detection) and structured validation (all 4 checks). Zero new dependencies.
- **Parallel hints**: `next` command output includes `parallel_candidates` — tasks with all dependencies met that could run concurrently. DAG-enabled, not just linear.
- **KG auto-detection**: `/raildone` auto-extracts candidate service names from checkpoint artifacts. No manual typing required — confirm and go.
- **Artifact tracking**: SubTask and Checkpoint carry `artifacts` — files produced per task.
- **Structured validation**: `validate` command runs 4 deterministic checks with structured JSON and exit codes (0=PASS / 1=WARN / 2=BLOCK).
- **Plan review agent**: Two-layer review — deterministic + LLM subagent. Returns PASS / WARN / BLOCK.

## How it works

```
/railplan "organize 5000 photos by year and rename them"

  Creates:  agentrail/tasks/organize-photos/
            ├── proposal.md    ← What & why. Goal, scope, constraints.
            ├── design.md      ← How. Strategy, key decisions, risks.
            ├── tasks.md       ← Step-by-step checklist. Each line one action.
            ├── log.md         ← Execution journal. Created during planning.
            └── runtime/       ← Machine-verifiable task state + checkpoints.

  Also runs an internal review (deterministic checks + LLM subagent)
  and shows PASS / WARN / BLOCK before you start.

/raildo organize-photos

  Registers all pending tasks in the agent's native progress bar.
  Loops through tasks, marking current as in-progress, completed as done.
  Writes pre-task checkpoints before each step.
  Auto-recovers from compact interruptions.
  Writes session end to log.md (on completion or blocker).

/raillog organize-photos

  Auto-generates a structured checkpoint:
    → Progress delta since last checkpoint
    → Completed tasks this session
    → Still-pending tasks
    → Plan changes detected
    → Verification status (from runtime state)
    → Unresolved blockers
  Asks if you want to add freeform notes.

/railplan organize-photos "narrow scope to PDF only"

  Same command for creating AND updating plans. Enters update mode:
  shows current state, asks what to change, surgically edits files.
  Preserves completed checkboxes and session history.

/raildone organize-photos

  Appends completion summary to proposal.md.
  Moves to agentrail/tasks/archive/YYYY-MM-DD-organize-photos/.

/railverify organize-photos

  Runs verification checks (tests, lint, typecheck, build).
  Displays per-check pass/fail results.

/raillist

  Lists all active tasks with goals, progress, and verification status.
  Shows the 10 most recently archived tasks with outcomes.
```

## Artifacts

| File | Purpose | Who writes it |
|------|---------|--------------|
| `proposal.md` | What & why. Goal, motivation, scope, constraints. | `/railplan` |
| `design.md` | How. Strategy, key decisions, risks. | `/railplan` |
| `tasks.md` | Checklist. Each line one verifiable action. | `/railplan` (planned), `/raildo` (checked) |
| `log.md` | Execution journal. Sessions, checkpoints, plan revisions, blockers. | `/railplan` (created + revisions), `/raildo` (auto), `/raillog` (manual) |

## Key design decisions

**No guessing.** If a task description is ambiguous, the agent stops and asks. This is enforced in skill instructions, not left to the model's discretion.

**Log.md is the backbone.** Every session writes a start entry before executing and an end entry on completion or blocker. Plan revisions are recorded immediately. Checkpoints capture deltas — only what changed since last checkpoint.

**Artifacts are just markdown.** No YAML config, no JSON schema, no database. You can read, edit, or delete them with any text editor.

**Structured review, not LLM guesswork.** The plan review agent reads `task-state.json` (a task graph), not markdown text. Deterministic checks run first (zero LLM cost). The LLM subagent only sees the structured graph and is constrained to PASS/WARN/BLOCK — no rewriting, no scope creep.

**Pre-task checkpointing.** Checkpoints are written before executing, not after. This guarantees no work is lost if the context compacts mid-task. Recovery compares checkpoint data against `log.md` and `task-state.json` to determine the exact interruption point.

## Project structure

```
AgentRail/
├── install.sh / install.ps1            # Installers
├── README.md
├── LICENSE
├── commands/                            # 6 slash commands (flat, no colon)
│   ├── railplan.md
│   ├── raildo.md
│   ├── raildone.md
│   ├── raillist.md
│   ├── raillog.md
│   └── railverify.md
├── skills/                             # 1 skill
│   └── rail-do/SKILL.md                # Execute + native UI + recovery
└── agentrail/                          # Runtime + tasks (installed to agent config dir)
    ├── tasks/                          # Active + archived task plans
    │   ├── <active-task>/
    │   └── archive/
    ├── src/                            # Modular runtime
    │   ├── task-graph.ts               # DAG scheduling + parallel hints
    │   ├── validate.ts                 # 4 deterministic plan checks
    │   ├── checkpoint.ts               # Checkpoint read/write
    │   ├── verify-runner.ts            # Test/lint/build auto-detection
    │   ├── knowledge-graph.ts          # Service dependency graph
    │   └── types.ts                    # Shared interfaces
    ├── tests/                          # Unit tests (node:test)
    │   ├── task-graph.test.ts
    │   └── validate.test.ts
    ├── cli.ts                          # Thin CLI orchestrator
    ├── package.json
    └── tsconfig.json
```

## Install

```bash
git clone https://github.com/vvvvirus/AgentRail.git
cd AgentRail

# macOS / Linux — auto-detects agent or use --target
./install.sh

# Or specify the agent config directory explicitly:
./install.sh --target ~/.claude   # Claude Code
./install.sh --target ~/.codex    # OpenAI Codex

# Windows (PowerShell)
.\install.ps1
# Or: .\install.ps1 -Target ~\.codex
```

Copies the rail-do skill, all 6 commands, and the runtime into your agent's config directory. The install script auto-detects `~/.claude`, `~/.codex`, `~/.gemini`, or `~/.opencode`. Use `--target` (or `-Target` on Windows) to specify a custom path. Runs `npm install` in `<config>/agentrail/` to cache the `tsx` dependency. Restart your agent. No other setup.

## Testing

```bash
cd agentrail
npx tsx --test tests/task-graph.test.ts tests/validate.test.ts
```

Zero dependencies beyond Node 18+ built-in `node:test`. Covers DAG scheduling (ordering, deadlock, parallel candidates) and validation (all 4 checks, verdict logic).

## Requirements

- Any agent with custom slash command support (Claude Code, etc.)
- Node.js >= 18 (the `tsx` package auto-resolves via `npx`; `npm install` during setup pre-caches it)

## After install

```
~/.claude/               ← Claude Code (or ~/.codex, ~/.gemini, etc.)
├── skills/rail-do/      ← Skill (agent auto-discovers)
├── commands/             ← Commands (agent auto-discovers, flat files)
└── agentrail/           ← Runtime (one clean subdirectory)
    ├── cli.ts
    ├── src/              ← Modular runtime
    ├── tests/            ← Unit tests
    ├── package.json
    ├── tsconfig.json
    └── node_modules/
```

## Archive structure

```
your-project/
└── agentrail/
    └── tasks/
        ├── organize-photos/
        │   ├── proposal.md
        │   ├── design.md
        │   ├── tasks.md
        │   ├── log.md
        │   └── runtime/
        └── archive/
            └── YYYY-MM-DD-organize-photos/
```
