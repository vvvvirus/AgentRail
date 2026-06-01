# 修复 workflow-runtime.ts 的 CWD 依赖问题
## 目标
`workflow-runtime.ts` 不再盲从 `process.cwd()`，改为优先接受外部传入的项目根目录路径。
## 动机
当前 `PROJECT_ROOT = process.cwd()`（第 66 行）。Claude Code 在会话 CWD（如 `D:\claude\webvideo`）下调用 `npx tsx workflow-runtime.ts init` 时，runtime 会把 `task-state.json`、checkpoints 等写入 `D:\claude\webvideo\task-workflow\...`，而 plan 阶段写入 proposal/design/tasks 的绝对路径在 `D:\Projects\s2.cpp\task-workflow\...`。两边不同目录，`loadState()` 找不到文件 → runtime 实际无法工作。
## 范围
### 包含
- 为 `workflow-runtime.ts` 增加 `--project-root=<path>` 参数，覆盖 `process.cwd()`
- 所有使用 `PROJECT_ROOT` 的路径逻辑保持不变，只改来源
- 各 skill 脚本调用 runtime 时显式传入 `--project-root`
### 不包含
- 不改变 `TASKS_DIR` 的目录结构约定
- 不改动 Claude Code 的 CWD 行为（不可控）
## 约束
- `init`、`next`、`step-done`、`verify`、`checkpoint`、`complete`、`status` 等所有命令都必须支持 `--project-root`
- 向后兼容：不传 `--project-root` 时行为与现在完全一致

---
## Completion Summary
- **Completed:** 2026-06-01
- **Result:** `--project-root=<path>` parameter added to workflow-runtime.ts; all 4 skills updated to pass it. Different-CWD end-to-end test passed.
- **Tasks:** 8/8 done
- **Verification:** Skipped (no auto-verify commands). Manual e2e test confirmed correct behavior.
- **Deviations:** None
