# 设计：修复 workflow-runtime.ts 集成问题

## 策略
两处代码修改 + 两处 skill 修改，最小改动解决两个根本问题。

## 关键决策

- **Checkpoint 错误处理**：不在 runtime 中改（`cmdCheckpoint` 本身正确），而是在 task-do SKILL.md 中去掉 `2>/dev/null || echo` 模式。让 npx 的 stderr 直接输出，Agent 能看到真实的错误信息。同时改为先检测 runtime 文件是否存在再调用。
- **verifyCommands 检测范围**：改为逐级向上搜索 package.json（从 cwd 开始，最多往上 3 层），而非只检查 cwd。这样在 `task-workflow/` 子目录中也能找到。
- **零检查返回值**：`cmdVerify` 当前返回 `passed: true` 是误导性的。改为返回 `passed: false` + `message: "No verify commands configured"`，让 skill 能区分"验证通过"和"没配置验证"。

## 风险
- **checkpoint 调用失败导致 task-do 中断**：去掉 `|| echo` 后，失败的 checkpoint 命令会导致 bash 返回非零。但 task-do 不应该因 checkpoint 失败而阻塞执行。缓解：task-do 在调用 checkpoint 前先检查 runtime 是否可用；如果 npx 失败，记录警告但继续执行。
- **detectVerifyCommands 误匹配**：在子目录找到不相关的 package.json。缓解：限制搜索深度为 3 层。
