# 任务清单：将 tasks/ 并入 task-workflow/

## 前置
- [x] 确认 `~/.claude/tasks/` 内容，确认可以安全清理

## 执行
- [x] 将 repo 中 `tasks/` 移至 `task-workflow/tasks/`
- [x] 更新 task-plan/SKILL.md 中所有 `tasks/` → `task-workflow/tasks/`
- [x] 更新 task-do/SKILL.md 中所有 `tasks/` → `task-workflow/tasks/`
- [x] 更新 task-done/SKILL.md 中所有 `tasks/` → `task-workflow/tasks/`
- [x] 更新 task-log/SKILL.md 中所有 `tasks/` → `task-workflow/tasks/`
- [x] 更新 task-list/SKILL.md 中所有 `tasks/` → `task-workflow/tasks/`
- [x] 更新 commands/task/*.md 中所有 `tasks/` → `task-workflow/tasks/`
- [x] 更新 README.md 中所有 `tasks/` → `task-workflow/tasks/`
- [x] 更新 .gitignore 中 `tasks/` → `task-workflow/tasks/`
- [x] 清理 `~/.claude/tasks/` 中的错误 runtime 文件（无需清理）
- [x] 运行 install.ps1 安装最新文件到 `~/.claude/`

## 验证
- [x] 验证路径引用无残留
- [x] 验证 ~/.claude/ 结构正确
- [x] 验证 git status
