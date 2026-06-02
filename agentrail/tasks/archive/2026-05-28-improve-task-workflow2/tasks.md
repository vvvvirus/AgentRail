# Tasks: Improve Task Workflow v2

## Prerequisites
- [x] 确认 Node.js >= 18 可用（`node --version`）

## Execution
- [x] 1. 创建 TypeScript 项目骨架
  - `package.json` — name, scripts, devDependencies: tsx
  - `tsconfig.json` — target ES2022, module ESNext, strict
  - `npm install`

- [x] 2. 创建 `runtime/task-state.schema.json`
  定义 task 状态结构：id, status(pending|in_progress|done|verified), deps[], blockedBy[], verifyCommands[], checks{tests, lint, typecheck}, created, updated

- [x] 3. 创建 `runtime/knowledge-graph.schema.json`
  定义服务依赖图：services: {name: {depends_on[], used_by[], description}}

- [x] 4. 实现 `workflow-runtime.ts` CLI (depends on: 1, 2, 3)
  核心命令：
  - `init` — 创建 tasks/<name>/runtime/task-state.json（含 tasks 列表、deps、verifyCommands）
  - `next` — 解析 DAG，返回第一个所有 deps 已满足且 status 为 pending 的任务
  - `verify` — 检测项目类型，运行验证命令，写回 checks
  - `checkpoint` — 写入 checkpoint JSON（step, files_changed, checks 状态）
  - `complete` — 标记 status=completed
  - `status` — 输出完整 state JSON
  - `kg-add` / `kg-query` — 读写 knowledge-graph.json

- [x] 5. 升级 `skills/task-plan/SKILL.md` (depends on: 4)
  - 创建 proposal/design/tasks.md 后调用 `npx tsx workflow-runtime.ts init <name>`
  - 询问用户验证命令配置（检测项目类型给出默认值）
  - 不再在 tasks.md 中写 `(depends on: xxx)` 内联语法——改为写入 task-state.json 的 deps

- [x] 6. 升级 `skills/task-do/SKILL.md` (depends on: 4)
  - 依赖检查改为调用 `npx tsx workflow-runtime.ts next <name>` 获取下一个可执行任务
  - 每完成一步调用 `npx tsx workflow-runtime.ts checkpoint <name> <step>` 写断点
  - Verification 阶段调用 `npx tsx workflow-runtime.ts verify <name>`
  - 全部完成后调用 `npx tsx workflow-runtime.ts complete <name>`
  - 同步更新 tasks.md 的 checkbox

- [x] 7. 升级 `skills/task-done/SKILL.md` (depends on: 4)
  - 归档前调用 `npx tsx workflow-runtime.ts status <name>` 检查 checks 全绿
  - 询问用户是否记录 service 依赖，调用 `kg-add` 写入
  - checks 未全绿时警告并确认后才允许归档

- [x] 8. 升级 `skills/task-replan/SKILL.md` (depends on: 4)
  - 修改 tasks.md 后，同步更新 task-state.json 的 task 列表和 deps
  - 记录 replan checkpoint

- [x] 9. 创建 `commands/task/verify.md` (depends on: 4)
  - 调用 `npx tsx workflow-runtime.ts verify <name>`
  - 显示验证结果摘要

- [x] 10. 更新 `README.md` (depends on: 5, 6, 7, 8, 9)
  - 新增四层架构图
  - 新增 runtime 层说明
  - 新增 `/task:verify` 文档
  - 更新 Requirements 加入 Node.js >= 18
  - 更新 Design decisions 说明分层设计

## Verification
- [x] 11. 端到端测试
  - 用 `/task:plan` 创建测试 task，确认 `runtime/task-state.json` 已生成
  - 用 `/task:do` 执行，确认 `next` 正确解析 DAG 依赖顺序
  - 用 `/task:do` 执行，确认每步后 checkpoint 已写入
  - 用 `/task:verify` 运行验证，确认结果写回 task-state.json
  - 用 `/task:done` 归档，确认 checks 检查被触发、kg 可记录
  - 模拟中断恢复：删除 runtime/ 以外的进度标记，用 `/task:do` 恢复，确认从 checkpoint 继续
