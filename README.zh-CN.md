[English](README.md) | [中文](README.zh-CN.md)

# Claude Task Workflow

在 Claude Code 内规划 → 审查 → 执行 → 归档任何多步骤任务。文件处理、数据迁移、调研、内容创作 —— 任何需要多步骤且值得记录的任务。

不是代码框架。无依赖、无配置、无 CLI。六个斜杠命令、一个 skill、一组 markdown 文件。由 TypeScript 运行时驱动，提供确定性 DAG 排序、检查点和验证功能。

## v2.3.0 更新

- **Skill 合并到 Command**: task-plan、task-done、task-log、task-list 现在是独立 command，不再通过 Skill tool 转发。仅 task-do 保留 skill 形式（长循环任务需要 system-reminder 持久性）。每个 command 是单个文件，加载极快，无转发开销。
- **双语 README**: 英文 + 中文，顶部有语言切换链接。

## v2.2.0 更新

- **Skill 精简**: Skill 文件从 943 行缩减到 456 行（-52%）。功能不变，上下文占用大幅减少。
- **Plan 审查 Agent**: 每次 `/task:plan` 自动审查任务图。两层 —— 确定性检查（任务数量、依赖有效性、验证覆盖率、粒度）+ LLM 子代理（完整性、排序、风险）。输出 PASS / WARN / BLOCK。WARN 不阻塞执行；BLOCK 会阻塞。
- **原生进度条**: `/task:do` 通过 TaskCreate/TaskUpdate 驱动 Claude Code 内置进度条。待办显示 ◻，进行中显示 ◼，完成显示 ✔ —— 全在底部状态栏。
- **前置检查点 + 压缩恢复**: 检查点在每个任务执行前写入（而非之后）。如果上下文中途压缩，下次会话自动从被打断的任务恢复。
- **安装包含运行时**: `workflow-runtime.ts`、`package.json`、`tsconfig.json` 现在安装到 `~/.claude/task-workflow/`。工作流可在任意目录使用，不限于仓库目录。
- **语言护栏**: 每个 command/skill 自带语言规则。不依赖项目级 CLAUDE.md（不会被安装的文件）。

## 工作原理

```
/task:plan "把 5000 张照片按年份分类并重命名"

  创建：    task-workflow/tasks/organize-photos/
            ├── proposal.md    ← 什么 & 为什么。目标、范围、约束。
            ├── design.md      ← 怎么做。策略、关键决策、风险。
            ├── tasks.md       ← 分步清单。每行是一个可验证的操作。
            ├── log.md         ← 执行日志。规划时创建。
            └── runtime/       ← 机器可验证的任务状态 + 检查点。

  同时运行内部审查（确定性检查 + LLM 子代理）
  开始前显示 PASS / WARN / BLOCK。

/task:do organize-photos

  在 Claude Code 原生进度条中注册所有待办任务（◻）。
  循环执行任务，进行中标记为 ◼，完成标记为 ✔。
  每步执行前写入前置检查点。
  对话压缩后自动恢复。
  写入会话结束记录到 log.md（完成或阻塞时）。

/task:log organize-photos

  自动生成结构化检查点：
    → 自上次检查点以来的进度变化
    → 本次会话完成的任务
    → 仍待办的任务
    → 检测到的计划变更
    → 验证状态（来自运行时）
    → 未解决的阻塞问题
  询问是否需要添加备注。

/task:plan organize-photos "把范围缩小到只处理 PDF"

  创建和更新计划用同一命令。进入更新模式：
  显示当前状态，询问要改什么，精确编辑文件。
  保留已完成的复选框和会话历史。

/task:done organize-photos

  追加完成摘要到 proposal.md。
  移动到 task-workflow/tasks/archive/2026-05-29-organize-photos/。

/task:verify organize-photos

  运行验证检查（测试、lint、类型检查、构建）。
  显示每个检查的通过/失败结果。

/task:list

  列出所有活跃任务及其目标、进度和验证状态。
  显示最近归档的 10 个任务及其结果。
```

## 产物

| 文件 | 用途 | 由谁写入 |
|------|------|---------|
| `proposal.md` | 什么 & 为什么。目标、动机、范围、约束。 | `/task:plan` |
| `design.md` | 怎么做。策略、关键决策、风险。 | `/task:plan` |
| `tasks.md` | 清单。每行是一个可验证的操作。 | `/task:plan`（规划）, `/task:do`（勾选） |
| `log.md` | 执行日志。会话、检查点、计划修订、阻塞问题。 | `/task:plan`（创建 + 修订）, `/task:do`（自动）, `/task:log`（手动） |

## 关键设计决策

**禁止猜测。** 如果任务描述模糊，Agent 会停下来询问。这被写入指令中执行，而非留给模型自行判断。

**log.md 是骨架。** 每次会话在执行前写入开始记录，在完成或阻塞时写入结束记录。计划修订即时记录。检查点只捕获增量 —— 自上次检查点以来的变化。

**产物就是 Markdown。** 没有 YAML 配置、没有 JSON schema、没有数据库。用任意文本编辑器即可阅读、编辑或删除。

**结构化审查，而非 LLM 猜测。** Plan 审查 Agent 读取 `task-state.json`（任务图），而非 markdown 文本。确定性检查先运行（零 LLM 成本）。LLM 子代理只能看到结构化图，且被限制为 PASS/WARN/BLOCK —— 不能重写、不能范围蔓延。

**前置检查点。** 检查点在执行前写入，而非之后。这保证即使上下文中途压缩，也不会有工作丢失。恢复时比对检查点数据和 `log.md` 及 `task-state.json` 来确定确切的断点。

## 项目结构

```
claude-task-workflow/
├── install.sh / install.ps1            # 安装脚本
├── README.md
├── LICENSE
├── commands/task/                      # 6 个斜杠命令（独立）
│   ├── plan.md
│   ├── do.md
│   ├── done.md
│   ├── list.md
│   ├── log.md
│   └── verify.md
├── skills/                             # 1 个 skill
│   └── task-do/SKILL.md                # 执行 + 原生 UI + 恢复
└── task-workflow/                      # 运行时 + 任务（安装到 ~/.claude/）
    ├── tasks/                          # 活跃 + 已归档的任务计划
    │   ├── <active-task>/
    │   └── archive/
    ├── workflow-runtime.ts             # DAG、检查点、验证引擎
    ├── package.json
    └── tsconfig.json
```

## 安装

```bash
git clone https://github.com/vvvvirus/claude-task-workflow.git
cd claude-task-workflow

# macOS / Linux
./install.sh

# Windows (PowerShell)
.\install.ps1
```

将 task-do skill 复制到 `~/.claude/skills/`，所有 6 个 command 复制到 `~/.claude/commands/task/`，运行时复制到 `~/.claude/task-workflow/`。在 `~/.claude/task-workflow/` 运行 `npm install` 以预缓存 `tsx` 依赖。重启 Claude Code。无需其他设置。

## 环境要求

- Claude Code
- Node.js >= 18（`tsx` 包通过 `npx` 自动解析；安装时的 `npm install` 会预缓存）

## 安装后

```
~/.claude/
├── skills/task-do/   ← Skill（Claude Code 自动发现）
├── commands/task/    ← Commands（Claude Code 自动发现）
└── task-workflow/    ← 运行时（一个干净的子目录）
    ├── workflow-runtime.ts
    ├── package.json
    ├── tsconfig.json
    └── node_modules/
```

## 归档结构

```
your-project/
└── task-workflow/
    ├── tasks/                            # 活跃
    │   └── organize-photos/
    │       ├── proposal.md
    │       ├── design.md
    │       ├── tasks.md
    │       ├── log.md
    │       └── runtime/
    ├── tasks/archive/                    # 已完成
    │   └── 2026-05-29-organize-photos/
    ├── workflow-runtime.ts
    ├── package.json
    └── tsconfig.json
```
