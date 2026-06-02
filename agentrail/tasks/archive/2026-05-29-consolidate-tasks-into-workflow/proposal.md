# 将 tasks/ 并入 task-workflow/

## 目标
将 repo 中的 `tasks/` 目录移至 `task-workflow/tasks/`，更新所有引用路径，确保 install 到 `~/.claude/` 后结构整洁、无冲突。

## 动机
当前 `tasks/` 与 `task-workflow/` 是平行的两个目录，但逻辑上都属于 task-workflow 系统。同时 `~/.claude/tasks/` 被错误地写入了 runtime 文件，造成了混乱。统一归入 `task-workflow/` 后：
- repo 根目录更干净
- 所有 workflow 相关文件在一个目录下，逻辑清晰
- 避免与 `~/.claude/tasks/` 的命名歧义

## 范围

### 包含
- 将 repo 中 `tasks/` 移入 `task-workflow/tasks/`
- 更新 5 个 skill 文件中所有 `tasks/` 路径引用
- 更新 3 个 command 文件中所有 `tasks/` 路径引用
- 更新 README.md 的目录结构示例
- 更新 .gitignore
- 清理 `~/.claude/tasks/` 中的错误文件（runtime 被错误放置）
- 重新 install 到 `~/.claude/`

### 不包含
- 修改 runtime TypeScript 代码逻辑
- 修改 workflow-runtime.ts 中任何功能行为

## 约束
- 所有 `tasks/` → `task-workflow/tasks/` 替换必须精确，不能漏改或多改
- `~/.claude/task-workflow/` 是 runtime 安装位置，`task-workflow/tasks/` 是项目任务目录，两者不冲突
- install 脚本本身不需要改（它们只复制 runtime 文件，不涉及 tasks）

---
## Completion Summary
- **Completed:** 2026-05-29
- **Result:** `tasks/` 并入 `task-workflow/tasks/`，所有路径引用已更新，runtime 指向新路径，.gitignore 精确匹配
- **Tasks:** 12/12 done
- **Verification:** passed — 无残留 tasks/ 引用，~/.claude/ 结构正确，git status 符合预期
- **Deviations:** `~/.claude/tasks/` 实际包含 Claude 会话转录（UUID 目录），非 runtime 文件，无需清理
