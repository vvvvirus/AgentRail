# 任务清单：修复 workflow-runtime.ts 集成问题

## 执行
- [x] 修复 `detectVerifyCommands()` — 搜索 cwd + 子目录（1 层深），支持 cwd 字段
- [x] 修复 `cmdVerify` — 零检查时返回 `passed: false` + 警告信息
- [x] 修复 task-do SKILL.md — checkpoint 调用前检查 runtime 可用性，失败时记警告不阻塞
- [x] 修复 task-plan SKILL.md — 改进 verify 检测步骤，说明 auto-detect 在 init 时完成
- [x] 更新 `~/.claude/task-workflow/workflow-runtime.ts`
- [x] 安装所有更新到 `~/.claude/`

## 验证
- [x] `detectVerifyCommands()` 扫描子目录正常（找到 task-workflow/package.json，无匹配 scripts）
- [x] `verify` 命令在零配置时返回 `passed: false`
- [x] checkpoint 命令正常写入 4 个 checkpoint（checkpoint-1~4.json）
- [x] task-do step 3 增加了 runtime 可用性预检
