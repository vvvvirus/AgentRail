# Design: Improve Task Workflow v2

## Strategy

新增一个独立 TypeScript CLI（`workflow-runtime.ts`），由 Claude Code 的 skill 通过 Bash 调用。Runtime 是结构化状态的唯一写入者，Claude 只读 reasoning 数据。

### 四层架构

```
Claude Prompt (reasoning)
    │
    ├─ 读取 proposal.md, design.md, log.md （叙事，人类可读）
    │
    ▼
workflow-runtime.ts (orchestration)
    │
    ├─ 管理 task-state.json （状态, deps, checks）
    ├─ 解析 DAG → 返回可执行任务列表
    ├─ 运行验证命令 → 写回 exit code
    ├─ 写 checkpoint → 支持断点恢复
    └─ 管理 knowledge-graph.json
```

### 文件分工

| 文件 | 格式 | 谁写 | 用途 |
|------|------|------|------|
| proposal.md | Markdown | Claude（plan） | 人类读的目标和范围 |
| design.md | Markdown | Claude（plan） | 人类读的策略和决策 |
| tasks.md | Markdown | Claude（plan）+ 用户 | 人类读的任务清单 |
| log.md | Markdown | Claude（do/log） | 人类读的执行日志 |
| runtime/task-state.json | JSON | **runtime.ts** | 机器读写的权威状态 |
| runtime/knowledge-graph.json | JSON | **runtime.ts** | 机器读写的服务依赖 |

Markdown 不再有 `(depends on: xxx)` 内联语法——移入 task-state.json 的 `deps` 字段。Markdown 的 `- [ ]` checkbox 仍保留（作为人类友好的进度视图），但 runtime.ts 不读它。

## Steps Overview

1. 搭建 TypeScript 项目骨架（package.json, tsconfig.json）
2. 实现 `workflow-runtime.ts` 的核心命令
3. 创建 JSON Schema 文件
4. 升级 task-plan skill 调用 `runtime.ts init`
5. 升级 task-do skill 调用 `runtime.ts next`、`checkpoint`、`verify`
6. 升级 task-done skill 调用 `runtime.ts complete`、`kg-add`
7. 升级 task-replan skill 调用 `runtime.ts` 更新 deps
8. 创建 `/task:verify` 命令
9. 更新 README

## Key Decisions

- **`tsx` 而非 `ts-node` 或编译为 JS** — `tsx` 零配置执行 TS 文件，启动快，npm 上最流行。用户只需 `npm install`。
- **Runtime 通过 Bash 调用，不直接暴露给用户** — 用户在 Claude Code 中仍然用 `/task:do`，skill 内部调用 `npx tsx workflow-runtime.ts next <task>`。对用户体验无影响。
- **tasks.md 保留 `- [ ]` checkbox，但不再作为依赖检查来源** — 依赖解析完全由 runtime.ts 从 task-state.json 读取。Checkbox 是给人类看的进度条。两者不会冲突，因为 runtime.ts 完成一个 task 后也更新 task-state.json 的 status，而 task-do 同步打勾。
- **Verifier 是 runtime.ts 的子命令，不是独立 skill** — `runtime.ts verify` 读取验证命令配置，逐个执行，收集 exit code，写回 task-state.json#/checks。独立 skill 会导致两个地方管理验证逻辑。
- **Knowledge graph 初步只做 service 级依赖** — 不解析代码做 import graph。格式简单：`{services: {X: {depends_on: [...], used_by: [...]}}}`。手动添加，供 Claude 做 impact analysis 时读取。

### workflow-runtime.ts CLI 接口

```
npx tsx workflow-runtime.ts init <task-name> [--tasks "task1,task2,..."]
  创建 tasks/<name>/runtime/task-state.json

npx tsx workflow-runtime.ts next <task-name>
  读取 DAG，返回第一个可执行任务（所有 deps 已满足且 status 为 pending）
  输出: { "task": "write-controller", "index": 3 } 或 { "done": true }

npx tsx workflow-runtime.ts verify <task-name>
  运行配置的验证命令，写回 checks 字段
  输出: { "passed": true, "checks": { "tests": true, "lint": false, ... } }

npx tsx workflow-runtime.ts checkpoint <task-name> <step-name> [--files "a.ts,b.ts"] [--passed true|false]
  写入 checkpoint JSON 到 checkpoints/ 目录
  输出: { "checkpoint": "checkpoint-3.json" }

npx tsx workflow-runtime.ts complete <task-name>
  标记 task 为 completed，更新 updated 时间戳
  输出: { "status": "completed" }

npx tsx workflow-runtime.ts status <task-name>
  输出完整 task state JSON

npx tsx workflow-runtime.ts kg-add <service-name> [--depends-on "X,Y"] [--used-by "Z"]
  更新 runtime/knowledge-graph.json

npx tsx workflow-runtime.ts kg-query <service-name>
  输出该 service 的依赖信息
```

## Risks & Mitigations

- **`npx tsx` 启动延迟** — 约 0.5-1 秒。相比 Claude API 调用延迟（几秒到几十秒），可忽略。如果后续成为瓶颈，可预编译为 JS。
- **Runtime 和 tasks.md checkbox 不同步** — task-do 每次更新 task-state 后立即同步打勾 tasks.md。两者以 task-state.json 为准，不一致时 task-do 以 JSON 为准并修正 md。
- **用户没装 Node.js / npm** — README 中将 Node.js >= 18 列为 requirements（已广泛安装）。若用户环境无 Node，fallback 到纯 prompt 模式。
- **Runtime 验证命令在不同项目中不同** — 不从 proposal.md 读取。在 task-state.json 中存放 `verifyCommands` 数组，task-plan 时询问用户或自动检测项目类型。

## Resources Needed
- 目标仓库：`D:\claude\claude-task-workflow`
- 新增文件：`package.json`、`tsconfig.json`、`workflow-runtime.ts`、2 个 JSON Schema
- 修改文件：4 个 skill、4 个 command、`README.md`
- 仅 npm 依赖：`tsx`（devDependency）
