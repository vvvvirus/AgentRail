# 设计：将 tasks/ 并入 task-workflow/

## 策略
纯文件重组。分三步：移动目录 → 全局替换引用 → 清理 + 安装。

## 关键决策

- **目标路径 `task-workflow/tasks/`**：选择放在 `task-workflow/` 下而非保持平行，因为 tasks 在逻辑上从属于 task-workflow 系统。这使 repo 根目录从 3 个顶层目录（skills/commands/task-workflow/+ tasks/）减少到 3 个。
- **只在 repo 层面移动，不改 install 行为**：install 脚本只复制 runtime 文件（workflow-runtime.ts, package.json, tsconfig.json）到 `~/.claude/task-workflow/`，不涉及 tasks 目录。项目中的 tasks 是每个项目独立的。
- **清理 `~/.claude/tasks/`**：该目录目前错误地包含 runtime 文件（workflow-runtime.ts, package.json, tsconfig.json, node_modules），应删除这些文件，让 runtime 回归 `~/.claude/task-workflow/`。

## 风险
- **遗漏引用**：某个 skill 或 command 中的 `tasks/` 没被替换 → 运行时找不到文件。缓解：用 grep 精确列出所有匹配行，逐一替换。
- **~/.claude/tasks/ 中有用户数据**：万一用户在 `~/.claude/tasks/` 下有重要内容。缓解：删除前先检查内容，确认只有 runtime 文件。
