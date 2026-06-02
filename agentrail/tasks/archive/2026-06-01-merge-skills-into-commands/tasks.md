# 任务清单：合并一次性 Skill 到 Command

## 前置
- [x] 确认 workflow-runtime.ts 正常运行

## 执行
- [x] 备份 4 个 skill 目录到 `~/.claude/skill-backups/`
- [x] 合并 task-plan SKILL.md → commands/task/plan.md（移除 Skill tool 转发，保留所有步骤和 guardrails）
- [x] 合并 task-done SKILL.md → commands/task/done.md
- [x] 合并 task-log SKILL.md → commands/task/log.md
- [x] 合并 task-list SKILL.md → commands/task/list.md
- [x] 删除 4 个 skill 目录
- [x] 端到端测试：依次执行 `/task:plan`（创建临时任务）→ `/task:log`（记录 checkpoint）→ `/task:list`（列出任务）→ `/task:done`（归档），确认全流程正常
- [x] 更新 README.md —— 修正架构描述（5 skill → 1 skill），更新项目结构树和安装说明，在顶部添加语言切换链接 `[English](README.md) | [中文](README.zh-CN.md)`
- [x] 新建 README.zh-CN.md —— 基于更新后的 README.md 完整中文翻译，顶部语言切换链接指回英文，保持相同章节顺序和代码块
- [x] 更新 install.sh —— 移除 task-plan/task-done/task-log/task-list 的 4 行 `cp -r`，只保留 task-do，更新注释中的数量描述
- [x] 更新 install.ps1 —— 同 install.sh，移除 4 行 `Copy-Item -Recurse -Force`，只保留 task-do
- [x] 审查 .gitignore —— 合并后确认是否需要更新（预期无变更，无需修改）
- [x] 同步文件到本机 `~/.claude/` —— cp skills/task-do, commands/task/*.md, task-workflow/*.ts
- [x] Git commit & push to GitHub

## 验证
- [x] 4 个 skill 目录已删除
- [x] `commands/task/` 下 6 个文件内容完整
- [x] 所有 6 个命令（plan/do/done/log/list/verify）功能正常
- [x] 无残留的 Skill tool 引用（除 task-do 外）
- [x] README 顶部有语言切换链接，中英双向跳转正常
- [x] install.sh 仅复制 task-do 一个 skill
- [x] install.ps1 仅复制 task-do 一个 skill
- [x] ~/.claude/skills/ 下只有 task-do 目录
- [x] GitHub 仓库页面显示更新后的 README，语言切换可用
