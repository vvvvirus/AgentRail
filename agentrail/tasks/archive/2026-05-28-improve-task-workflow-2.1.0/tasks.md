# 任务清单：v2.1.0

## 前置
- [x] 0. 创建本 task 的 `log.md`，记录计划从 v1 到 v2.1.0 的 4 次修订历史

## 执行
- [x] 1. 创建项目级 `CLAUDE.md`
  - 放在项目根目录
  - 内容：项目定位 + 语言规范（公共文件英文，计划文件中文）+ 代码规范（400 行/4 层嵌套）+ skill/command 模式说明
  - 用英文写

- [x] 2. 删除冗余的 JSON Schema 文件
  - 删除 `runtime/task-state.schema.json`
  - 删除 `runtime/knowledge-graph.schema.json`
  - 检查 README 和 skill 中是否有引用，有则更新（注意 README 用英文写）

- [x] 3. 删除 `skills/task-replan/` 和 `commands/task/replan.md`
  - tasks.md 中不再提及这两个文件
  - 后续 task-plan 升级将包含原 replan 逻辑

- [x] 4. 删除 `skills/task-verify/SKILL.md`，重写 `commands/task/verify.md`
  - command 直接描述执行步骤，不通过 Skill tool 跳转（用英文写）
  - 逻辑：调 runtime verify → 解析 JSON → 表格展示结果

- [x] 5. 升级 `skills/task-plan/SKILL.md`——合并更新模式（用英文写）
  - 新增"更新模式"分支：task 存在时展示当前状态、询问修改内容、精准编辑、同步 runtime state
  - **强制规则：每次修改 proposal/design/tasks 后，立即追加 log.md。** 不依赖 session 结束，编辑完马上写。这是本次计划修订无日志的教训。
  - 保留"不猜测"原则
  - 不再区分小改和大改

- [x] 6. 升级 `skills/task-list/SKILL.md` 到 v2.0（用英文写）
  - 读取 runtime state，显示 verification 状态
  - 列标记：全部通过 / 有失败 / 未运行
  - 无 runtime 时 fallback

- [x] 7. 升级 `skills/task-log/SKILL.md` 到 v2.0（用英文写）
  - 读取 runtime checkpoints 辅助 delta 检测
  - checkpoint 中包含 runtime checks 状态
  - 无 runtime 时 fallback

- [x] 8. 更新 `README.md`（用英文写）
  - 移除 schema、task-replan、task-verify skill 引用
  - 更新命令列表：7→6 commands，7→5 skills
  - 更新版本号到 v2.1.0
  - 说明 `/task:plan` 同时支持创建和更新

## 验证
- [x] 9. 验证所有改动
  - 新 CLAUDE.md 内容正确，语言为英文
  - `/task:plan <新名>` 创建模式正常
  - `/task:plan <已有名> "add step"` 更新模式正常，log.md 有记录
  - `/task:list` 显示 verification 状态
  - `/task:verify <name>` 无 skill 情况下正常工作
  - `/task:replan` 已删除，无残留引用
  - `runtime/` 下无 schema 文件
  - 所有公共文件（README、CLAUDE.md、skills、commands、runtime.ts）用英文
  - 所有计划文件（proposal、design、tasks、log）用中文
