# 设计：修复所有已识别的 Bug 和改进点

## 策略
逐个文件修复，以 `workflow-runtime.ts` 为主要目标（12 项），然后修复 skill 文件中的文档和引用问题（3 项），最后清理安装脚本（1 项）。全部使用精准编辑，不改动无关代码。

## 关键决策
- **cmdNext 验证问题**: `cmdNext` 不应该自动设置 `status = "done"`，仅返回 `{ done: true }`，由调用方决定是否调 `complete`。这样 `complete` 的验证逻辑始终生效。
- **cmdComplete 激进关闭**: 改为仅关闭已完成的任务（`in_progress` → `done`），不碰 `pending` 任务。`pending` 任务如果依赖已满足且用户确认则跳转为 `skipped`。
- **重复任务 ID**: 在 `cmdInit` 中添加检测，遇到重复 ID 时追加数字后缀（`do-the-thing` → `do-the-thing-2`）。
- **--passed 参数**: 完全移除，因为它没有任何效果。
- **自定义验证**: 将 `state.checks` 从固定结构改为 `Record<string, boolean>`，保留所有验证命令的结果。
- **混合语言项目验证**: `detectVerifyCommands` 改为检查名称是否已存在，若冲突则跳过或使用项目类型前缀。
- **依赖格式**: 保留现有一格式（保持向后兼容），在 `cmdInit` 中添加越界检查和有意义的错误消息，在 SKILL.md 中标注索引脆弱性并提供最佳实践。
- **超时**: 通过环境变量 `VERIFY_TIMEOUT` 配置，默认保持 120s。

## 风险
- **向后兼容**: `cmdComplete` 行为变更可能影响现有任务流 → 仔细检查所有调用点，确保 skill 不会依赖旧行为
- **checks 结构变更**: `Record<string, boolean>` 替代固定字段 → 检查所有读取 `checks.tests` 等固定字段的代码，更新为动态访问
