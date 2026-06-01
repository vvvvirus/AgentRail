# 设计：CWD 解耦
## 策略
`PROJECT_ROOT` 从硬编码 `process.cwd()` 改为从 `--project-root` 参数读取，未传时 fallback 到 `process.cwd()`。所有调用 runtime 的 skill 脚本传入项目绝对路径。

## 关键决策
- **参数位置**：放在子命令之后的 args 中解析（如 `init foo --project-root=D:\x`），而非作为全局 flag 放在命令前 —— 与现有 `--tasks=` `--deps=` `--files=` 参数风格一致
- **只改该改的**：只改 `PROJECT_ROOT` 的来源和调用方，不碰 `TASKS_DIR`、`taskDir()`、`statePath()` 等派生逻辑
- **调用方传值**：task-plan 和 task-do 等 skill 在调用 `npx tsx workflow-runtime.ts` 时，通过环境变量或参数传入当前 project 的绝对路径

## 风险
- **风险**：如果某个 skill 忘记传 `--project-root`，行为退化到 CWD 模式，可能再次出现目录不匹配
  - **缓解**：在 `init` 时检查 `task-workflow` 目录是否已经存在于 `PROJECT_ROOT`，如果 proposal.md 等已存在就 warn
- **风险**：`detectVerifyCommands()` 扫描错误的目录，返回空命令列表
  - **缓解**：同一条修复 —— 只要 `PROJECT_ROOT` 指向正确项目，扫描自然正确
