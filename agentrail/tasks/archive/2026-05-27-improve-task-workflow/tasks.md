# Tasks: Improve Claude Task Workflow

## Prerequisites
- [x] 等待 ChatGPT 的建议到达

## Execution
- [x] Review Kimi v1.1 修改 — 逐文件 diff，对照 ChatGPT 的 5 个问题检查是否已解决或部分解决
- [x] 增强 log.md 结构化程度 — 统一 checkpoint 格式、状态标记（BLOCKED/IN_PROGRESS/DONE）、减少 LLM 误读
- [x] tasks.md 支持简单依赖声明 — 支持 `- [ ] task (depends on: other-task)` 语法，task-do 执行前检查依赖是否完成
- [x] 加强 verification 闭环 — 每个 skill 的 verification 步骤增加具体可验证的检查项（非模糊的"确认完成"）
- [x] 检查 6 个 skill 之间一致性 — task-do 引用 task-plan 的 artifact 格式是否正确、log 格式是否统一、参数传递是否一致
- [x] 检查 install.sh / install.ps1 是否包含所有 6 个 skill
- [x] 修复 task-plan SKILL.md Step 8 — plan 完成后展示 design.md 策略 + tasks.md 完整步骤清单，不能只给一行摘要
- [x] 更新 README.md — 如有新增功能或语法变更

## Verification
- [x] 确认所有 6 个 SKILL.md 格式正确（frontmatter + content）
- [x] 确认 commands/task/ 下 6 个命令都存在且委托正确
- [x] 用 /task:list 验证能正常列出任务
- [x] 跑一次完整流程：/task:plan → /task:do → /task:log → /task:done，确认无报错
