# 修复 workflow-runtime.ts 集成问题

## 目标
修复两个导致 runtime 核心功能未被实际使用的问题：checkpoint 静默失败 + verifyCommands 始终为空。

## 动机
上一轮 `consolidate-tasks-into-workflow` 执行中，runtime 的 DAG 排序 (`next`)、checkpoint、verify 三个核心功能都没生效。如果 context compact，没有 checkpoint 就无法恢复进度。verify 始终返回 `passed: true` 但实际什么都没检查。这使 runtime 退化为纯文本状态追踪器，失去了确定性保障的意义。

## 范围

### 包含
- 修复 task-do SKILL.md 中 checkpoint 调用的错误抑制模式（`2>/dev/null || echo`）
- 修复 `detectVerifyCommands()` 使其能搜索子目录
- 修复 `cmdVerify` 在零检查时返回 `passed: false` 而非 `passed: true`
- task-plan SKILL.md 改进 verify 命令检测逻辑
- 重新 install 到 `~/.claude/`

### 不包含
- 修改 DAG 排序逻辑（`getRunnableTask` / `next` 本身没问题）
- 添加新的 runtime 命令

## 约束
- 不改变 runtime CLI 的参数签名
- 不破坏已有的 checkpoint 文件格式

---
## Completion Summary
- **Completed:** 2026-05-30
- **Result:** detectVerifyCommands 扫描子目录，cmdVerify 零检查返回 false，task-do 去错误抑制，4 个 checkpoint 成功写入
- **Tasks:** 6/6 done
- **Verification:** passed — checkpoint 正常写入，verify 返回 passed:false（预期），DAG 排序正确
- **Deviations:** 搜索方向从"向上 3 层"改为"cwd + 子目录 1 层"，因为本项目的 package.json 在子目录而非父目录
