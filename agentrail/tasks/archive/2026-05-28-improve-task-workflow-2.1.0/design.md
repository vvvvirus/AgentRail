# 设计：v2.1.0

## 策略

这次改进的核心思想：**删比改多**，**定规范**。五个独立改动：创建 CLAUDE.md、合并 replan、删除 5 个文件、升级 2 个 skill、更新 README。外加一个从本轮教训中得出的改进：**计划修改即时记录**。

### 0. 计划修改必须即时记录（本轮教训）

本轮计划经历了 4 次修订（臃肿版→slim→合并replan→加CLAUDE.md），全程没有 log.md。如果有后来者看到这个 task，只能看到终态，不知道中间讨论了什么、推翻了什么。

**改进方案**：`/task:plan` 创建 task 时同时创建 `log.md`（之前只有 `/task:do` 时才创建）。更新模式下，每次编辑 proposal/design/tasks 后**立即**追加 log.md，不在 session 结束时补写。log.md 记录每轮 revision 的原因和改动。

### 1. 项目级 CLAUDE.md——中英文规范

创建 `D:/claude/claude-task-workflow/CLAUDE.md`，内容（英文）：

- 标记项目本质：Claude Code 的 task workflow 工具包
- 语言规则：公共文件写英文，计划文件写中文
- 代码规范：文件不超过 400 行，嵌套不超过 4 层，优先编辑而非重写
- 现有 skill/command 模式说明

### 2. 合并 replan 到 plan

`/task:plan` 一个命令，两个模式：

- task 不存在 → 创建模式（当前行为）
- task 存在 → 更新模式（原 replan 行为）
  - 展示当前状态
  - 询问本次改什么
  - 只编辑变了的部分
  - 保留已完成 checkbox
  - 同步 runtime state
  - **立即追加 log.md**（编辑完马上写，不等到 session 结束）

不再区分小改和大改——都是编辑文件 + 记录日志。需要回退时用 git。

删除 `skills/task-replan/SKILL.md` 和 `commands/task/replan.md`。

### 3. 删除 5 个冗余文件

| 文件 | 原因 |
|------|------|
| `runtime/task-state.schema.json` | TypeScript `TaskState` interface 是真源头，Schema 从未被加载验证 |
| `runtime/knowledge-graph.schema.json` | 同上，`KnowledgeGraph` interface |
| `skills/task-replan/SKILL.md` | 逻辑已合并到 task-plan |
| `commands/task/replan.md` | 命令已合并到 `/task:plan` |
| `skills/task-verify/SKILL.md` | verify 是单步操作（调 runtime → 展示结果），不需要独立 skill |

### 4. 升级 task-list 和 task-log

**task-list v2.0**：
- 读取 runtime state 获取 verification 状态
- 进度列显示 verification 标记
- 无 runtime → fallback 纯 markdown

**task-log v2.0**：
- 读取 runtime checkpoints 辅助 delta 检测
- checkpoint 中包含 runtime checks 状态
- 无 runtime → fallback 纯 markdown

### 5. 精简后的文件结构

```
claude-task-workflow/
├── CLAUDE.md                        ← 新增：项目规范
├── workflow-runtime.ts              ← 不变
├── package.json / tsconfig.json     ← 不变
├── README.md                        ← 更新
├── commands/task/                   ← 7→6
│   ├── plan.md                      ← 合并 replan
│   ├── do.md
│   ├── done.md
│   ├── list.md
│   ├── log.md
│   └── verify.md                    ← 重写：不依赖 skill
├── skills/                          ← 7→5
│   ├── task-plan/SKILL.md           ← 增加更新模式 + 即时写 log
│   ├── task-do/SKILL.md
│   ├── task-done/SKILL.md
│   ├── task-list/SKILL.md           ← 升级 v2.0
│   └── task-log/SKILL.md            ← 升级 v2.0
└── runtime/                         ← 仅 knowledge-graph.json（用户项目运行时生成）
```

## 关键决策

- **plan 时即创建 log.md**——之前 `/task:plan` 不写 log，`/task:do` 才写。改后 plan 创建 task 时同时初始化 log.md，确保修订历史不丢失。
- **更新模式下编辑完立即写 log，不等到 session 结束**——本次计划修订无日志的教训。
- **不搞 revisions/ 目录**——git 负责版本管理，log.md 负责解释变更原因。
- **verify 去掉 skill 保留 command**——verify 不需要 Claude reasoning，就是跑命令展示结果。但 `/task:verify` 入口保留。
- **task-replan 完全删除，不保留兼容别名**——`/task:plan <name> <changes>` 直接替代。

## 风险

- **用户习惯 `/task:replan`**——README 明确说明。版本号 2.1.0 标记为 minor breaking。
- **task-plan 文件变长**——当前 208 行，合并后约 280 行。仍在 400 行限制内。
- **删除 schema 后新贡献者不理解数据结构**——`workflow-runtime.ts` 里的 TypeScript interfaces 就是最好的文档。
- **语言规则依靠人工遵守**——CLAUDE.md 中的指令约束 Claude 行为，人工写文件和 code review 时自检。
