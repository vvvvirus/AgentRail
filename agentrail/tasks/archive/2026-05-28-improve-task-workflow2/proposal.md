# Improve Task Workflow v2 — Prompt-Driven → Runtime-Driven

## Goal
为 claude-task-workflow 增加一个 TypeScript runtime engine (`workflow-runtime.ts`)，接管状态管理、依赖解析、验证执行和断点恢复，实现"Prompt 负责 reasoning，Runtime 负责 orchestration"的分层架构。

## Motivation

当前项目本质是 prompt 驱动状态机——Claude 通过读写 markdown 维护状态。反馈文档指出这导致：

1. **状态不可验证** — `status: completed` 是 Claude 声称的，不代表 tests 真过了
2. **依赖检查靠人眼** — `(depends on: xxx)` 是文本约定，Claude 可能跳过
3. **中断后难以恢复** — 没有机器可读的断点数据
4. **Orchestration 散落在 prompt 中** — Claude 会忘步骤、跳 hook

核心问题不是格式（md vs JSON），是**状态管理没有独立的执行者**。

解决方案：写一个 Claude Code 可以通过 Bash 调用的独立 runtime，由它来管理所有结构化状态。Claude 继续负责 reasoning（读 proposal、理解意图、写代码），但 state transition 由代码确定性地执行。

## Scope

### In scope
- 新增 `workflow-runtime.ts` — 独立 TypeScript CLI（通过 `npx tsx` 运行）
- Runtime 提供命令: `init`、`next`、`verify`、`checkpoint`、`complete`、`kg-add`、`kg-query`
- 新增 `package.json` + `tsconfig.json`（最小依赖: tsx）
- 新增 `runtime/task-state.schema.json` — task 状态结构定义
- 新增 `runtime/knowledge-graph.schema.json` — 服务依赖图结构
- **删除** tasks.md 中的内联 `(depends on: xxx)`，改为 task-state.json 中的 `deps` 数组
- 升级 `task-do`、`task-plan`、`task-done`、`task-replan` skill 调用 runtime
- 新增 `/task:verify` 命令（调用 `runtime.ts verify`）
- 更新 README 说明四层架构

### Out of scope
- Worktree isolation — 下个迭代
- Task Compiler / decomposition engine — 下个迭代
- Code graph (symbol/import/type) — 未来
- 将 markdown 整体替换为 JSON — 叙事文本保留 md

---
<!-- COMPLETION -->

## Completion Summary
- **Completed:** 2026-05-28
- **Result:** Successfully added workflow-runtime.ts (520-line TypeScript CLI with 11 sub-commands), upgraded 4 skills to v2.0, created /task:verify command, and rewrote README with four-layer architecture docs. E2E tests passed — DAG resolution, checkpointing, verification, and knowledge graph all functional.
- **Tasks completed:** 12/12
- **Deviations from plan:** Added `step-done` sub-command (not in original design) for per-task progress tracking. Changed deps format from description-based to index-based to handle descriptions with spaces. Added `next-checkpoint` and `checkpoints` commands for recovery flow.

## Constraints
- 只依赖 `tsx`（TypeScript 执行器），`npm install` 即可
- Runtime 通过 Bash tool 被 Claude Code 调用，不直接暴露给用户
- 向后兼容：无 runtime 的旧 task 仍可用 `/task:do`（fallback 到纯 prompt 模式）
- proposal.md、design.md、log.md 保持 markdown，不做 JSON 化
