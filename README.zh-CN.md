[English](README.md) | [中文](README.zh-CN.md)

# AgentRail

在你的 agent 内规划 → 审查 → 执行 → 归档任何多步骤任务。文件处理、数据迁移、调研、内容创作 —— 任何需要多步骤且值得记录的任务。

不是代码框架。无依赖、无配置、无 CLI。六个斜杠命令、一个 skill、一组 markdown 文件。由 TypeScript 运行时驱动，提供确定性 DAG 排序、检查点和验证功能。

## v3.0.0 更新

- **重命名为 AgentRail**：项目从 "Claude Task Workflow" 改名。命令从 `/task:xxx` 改为 `/railxxx`——更短、无冒号、agent 无关。运行时目录改为 `agentrail/`。
- **新命令名**：`/railplan`、`/raildo`、`/raildone`、`/raillist`、`/raillog`、`/railverify`
- **Agent 无关表述**：所有文档和消息用 "agent" 替代 Claude 特定术语。任何支持自定义斜杠命令的 agent 均可使用。
- **模块化运行时**：`src/` 模块 —— task-graph、checkpoint、verify-runner、validate、knowledge-graph，加上精简的 `cli.ts` 编排器。每个模块可独立测试。
- **单元测试**：`node:test` 测试覆盖 DAG 调度（getRunnableTask、死锁检测）和结构化校验（4 项检查全部）。零新依赖。
- **并行提示**：`next` 命令输出包含 `parallel_candidates` —— 依赖已满足、可并行执行的任务列表。DAG 驱动，不再是纯线性。
- **KG 自动推断**：`/raildone` 从 checkpoint artifacts 自动提取候选服务名。无需手动输入 —— 确认即可。
- **产物追踪**：SubTask 和 Checkpoint 新增 `artifacts` 字段。
- **结构化校验**：`validate` 命令 4 项检查，结构化 JSON，exit code 0/1/2。
- **Plan 审查 Agent**：两层审查 —— 确定性 + LLM 子代理。

## 工作原理

```
/railplan "把 5000 张照片按年份分类并重命名"

  创建：    agentrail/tasks/organize-photos/
            ├── proposal.md    ← 什么 & 为什么。目标、范围、约束。
            ├── design.md      ← 怎么做。策略、关键决策、风险。
            ├── tasks.md       ← 分步清单。每行是一个可验证的操作。
            ├── log.md         ← 执行日志。规划时创建。
            └── runtime/       ← 机器可验证的任务状态 + 检查点。

  同时运行内部审查（确定性检查 + LLM 子代理）
  开始前显示 PASS / WARN / BLOCK。

/raildo organize-photos

  在 agent 原生进度条中注册所有待办任务。
  循环执行任务，标记进行中和已完成。
  每步执行前写入前置检查点。
  对话压缩后自动恢复。
  写入会话结束记录到 log.md（完成或阻塞时）。

/raillog organize-photos

  自动生成结构化检查点：
    → 自上次检查点以来的进度变化
    → 本次会话完成的任务
    → 仍待办的任务
    → 检测到的计划变更
    → 验证状态（来自运行时）
    → 未解决的阻塞问题
  询问是否需要添加备注。

/railplan organize-photos "把范围缩小到只处理 PDF"

  创建和更新计划用同一命令。进入更新模式：
  显示当前状态，询问要改什么，精确编辑文件。
  保留已完成的复选框和会话历史。

/raildone organize-photos

  追加完成摘要到 proposal.md。
  移动到 agentrail/tasks/archive/YYYY-MM-DD-organize-photos/。

/railverify organize-photos

  运行验证检查（测试、lint、类型检查、构建）。
  显示每个检查的通过/失败结果。

/raillist

  列出所有活跃任务及其目标、进度和验证状态。
  显示最近归档的 10 个任务及其结果。
```

## 产物

| 文件 | 用途 | 由谁写入 |
|------|------|---------|
| `proposal.md` | 什么 & 为什么。目标、动机、范围、约束。 | `/railplan` |
| `design.md` | 怎么做。策略、关键决策、风险。 | `/railplan` |
| `tasks.md` | 清单。每行是一个可验证的操作。 | `/railplan`（规划）, `/raildo`（勾选） |
| `log.md` | 执行日志。会话、检查点、计划修订、阻塞问题。 | `/railplan`（创建 + 修订）, `/raildo`（自动）, `/raillog`（手动） |

## 关键设计决策

**禁止猜测。** 如果任务描述模糊，Agent 会停下来询问。这被写入指令中执行，而非留给模型自行判断。

**log.md 是骨架。** 每次会话在执行前写入开始记录，在完成或阻塞时写入结束记录。计划修订即时记录。检查点只捕获增量 —— 自上次检查点以来的变化。

**产物就是 Markdown。** 没有 YAML 配置、没有 JSON schema、没有数据库。用任意文本编辑器即可阅读、编辑或删除。

**结构化审查，而非 LLM 猜测。** Plan 审查 Agent 读取 `task-state.json`（任务图），而非 markdown 文本。确定性检查先运行（零 LLM 成本）。LLM 子代理只能看到结构化图，且被限制为 PASS/WARN/BLOCK —— 不能重写、不能范围蔓延。

**前置检查点。** 检查点在执行前写入，而非之后。这保证即使上下文中途压缩，也不会有工作丢失。恢复时比对检查点数据和 `log.md` 及 `task-state.json` 来确定确切的断点。

## 项目结构

```
AgentRail/
├── install.sh / install.ps1            # 安装脚本
├── README.md
├── LICENSE
├── commands/                            # 6 个斜杠命令（扁平文件，无冒号）
│   ├── railplan.md
│   ├── raildo.md
│   ├── raildone.md
│   ├── raillist.md
│   ├── raillog.md
│   └── railverify.md
├── skills/                             # 1 个 skill
│   └── rail-do/SKILL.md                # 执行 + 原生 UI + 恢复
└── agentrail/                          # 运行时 + 任务（安装到 agent 配置目录）
    ├── tasks/                          # 活跃 + 已归档的任务计划
    │   ├── <active-task>/
    │   └── archive/
    ├── src/                            # 模块化运行时
    │   ├── task-graph.ts               # DAG 调度 + 并行提示
    │   ├── validate.ts                 # 4 项确定性检查
    │   ├── checkpoint.ts               # 检查点读写
    │   ├── verify-runner.ts            # 测试/lint/build 自动检测
    │   ├── knowledge-graph.ts          # 服务依赖图
    │   └── types.ts                    # 共享接口定义
    ├── tests/                          # 单元测试 (node:test)
    │   ├── task-graph.test.ts
    │   └── validate.test.ts
    ├── cli.ts                          # 精简 CLI 编排器
    ├── package.json
    └── tsconfig.json
```

## 安装

```bash
git clone https://github.com/vvvvirus/AgentRail.git
cd AgentRail

# macOS / Linux — 自动检测 agent 或使用 --target
./install.sh

# 或显式指定 agent 配置目录：
./install.sh --target ~/.claude   # Claude Code
./install.sh --target ~/.codex    # OpenAI Codex

# Windows (PowerShell)
.\install.ps1
# 或: .\install.ps1 -Target ~\.codex
```

将 rail-do skill、6 个 command、运行时复制到你的 agent 配置目录。安装脚本自动检测 `~/.claude`、`~/.codex`、`~/.gemini`、`~/.opencode`。用 `--target`（Windows 上用 `-Target`）指定自定义路径。在 `<config>/agentrail/` 运行 `npm install` 预缓存 `tsx` 依赖。重启 Agent。无需其他设置。

## 测试

```bash
cd agentrail
npx tsx --test tests/task-graph.test.ts tests/validate.test.ts
```

零额外依赖，仅需 Node 18+ 内置的 `node:test`。覆盖 DAG 调度（排序、死锁、并行候选）和校验逻辑（全部 4 项检查及判决）。

## 环境要求

- 支持自定义斜杠命令的 Agent（Claude Code 等）
- Node.js >= 18（`tsx` 包通过 `npx` 自动解析；安装时的 `npm install` 会预缓存）

## 安装后

```
~/.claude/               ← Claude Code（或 ~/.codex、~/.gemini 等）
├── skills/rail-do/      ← Skill（Agent 自动发现）
├── commands/             ← Commands（Agent 自动发现，扁平文件）
└── agentrail/           ← 运行时（一个干净的子目录）
    ├── cli.ts
    ├── src/              ← 模块化运行时
    ├── tests/            ← 单元测试
    ├── package.json
    ├── tsconfig.json
    └── node_modules/
```

## 归档结构

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
