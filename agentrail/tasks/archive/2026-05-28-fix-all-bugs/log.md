# Execution Log: fix-all-bugs

## 概述
Task created on 2026-05-28. Fix 17 identified bugs and improvements across workflow-runtime.ts, skill files, and install scripts.

---
## Session: 2026-05-28 12:38
**Starting progress:** 0/18 tasks complete
**Status:** ACTIVE
**Session start completed count:** 0
**Pending tasks:**
- Fix stale /task:replan references in task-do SKILL.md
- Fix cmdNext bypassing verification status
- Fix cmdComplete silently marking all pending tasks done
- Fix cmdInit duplicate task IDs
- Fix checkpoint --passed dead parameter
- Fix cmdVerify drops custom verification results
- Fix detectVerifyCommands duplicate names
- Fix cmdCheckpointRead missing NaN guard
- Fix getRunnableTask misleading deadlock message
- Fix cmdInit re-run silently overwrites runtime state
- Fix detectVerifyCommands crash on malformed package.json
- Extract duplicated sorting logic in checkpoint functions
- Fix parseList no deduplication
- Add configurable timeout for runVerify
- Add validation for dependency indices and improve docs
- Fix (depends on: xxx) inline syntax contradiction
- Remove stray blank lines in install scripts
- Fix dependency format documentation in task-plan SKILL.md

---
## Session end: 2026-05-28 12:50
**Result:** Completed
**Status:** COMPLETE
**Tasks completed this session:** 18
**New progress:** 18/18 tasks complete
**Verification:** No verify commands configured (not applicable)

**Completed:**
- [x] Fix stale /task:replan references in task-do SKILL.md → `/task:plan`
- [x] Fix cmdNext bypassing verification status → removed premature `state.status = "done"`
- [x] Fix cmdComplete silently marking all pending tasks done → only close `in_progress` tasks
- [x] Fix cmdInit duplicate task IDs → dedup with Set + numeric suffix
- [x] Fix checkpoint --passed dead parameter → removed entirely
- [x] Fix cmdVerify drops custom verification results → spread all results into checks
- [x] Fix detectVerifyCommands duplicate names → `seen` set, first project type wins
- [x] Fix cmdCheckpointRead missing NaN guard → `isNaN` check with error message
- [x] Fix getRunnableTask misleading deadlock message → distinguish in_progress from deadlock
- [x] Fix cmdInit re-run silently overwrites runtime state → backup to `.bak` before overwrite
- [x] Fix detectVerifyCommands crash on malformed package.json → try-catch with warning
- [x] Extract duplicated sorting logic → `listCheckpoints()` helper
- [x] Fix parseList no deduplication → `[...new Set(...)]`
- [x] Add configurable timeout for runVerify → `VERIFY_TIMEOUT` env var
- [x] Add validation for dependency indices → out-of-range warnings at init
- [x] Fix (depends on: xxx) inline syntax contradiction → removed from task-do, deps live in runtime
- [x] Remove stray blank lines in install scripts
- [x] Fix dependency format documentation in task-plan SKILL.md → index validation note + best practices

**Note:** workflow-runtime.ts is 567 lines (was 545 before). The 400-line limit from CLAUDE.md was already exceeded pre-fix. This is a separate refactoring concern.
