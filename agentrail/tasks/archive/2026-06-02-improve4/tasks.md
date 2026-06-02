# 任务清单：轻量级增强
## 前置
- [ ] 阅读两份建议文件，确认改动范围
## 执行
- [x] 在 workflow-runtime.ts 中：SubTask 和 Checkpoint 接口加 `artifacts?: string[]`；checkpoint 命令解析 `--artifacts=` 参数并写入；step-done 支持 `--artifacts=` 写入对应 SubTask
- [x] 在 workflow-runtime.ts 中：实现 `validate` 命令 — 4 项确定性检查（task_count/deps_valid/verify_coverage/granularity），输出结构化 JSON，exit 0=PASS / 1=WARN / 2=BLOCK
- [x] 更新 task-plan command（plan.md）：Step 5 checkpoint 加 `--artifacts=`；review 层引用 validate 命令
- [x] 更新 task-do skill（SKILL.md）：Step 7d checkpoint 加 `--artifacts=`；Step 7e step-done 加 `--artifacts=`
- [x] 更新 README.md：合并两个 What's New 为一个 v2.4.0，描述 artifact tracking + validate
- [x] 复制 workflow-runtime.ts 到 `~/.claude/task-workflow/`；复制 plan.md/do.md 到 `~/.claude/commands/task/`；推送到 GitHub
## 验证
- [ ] `npx tsx workflow-runtime.ts validate improve4 --project-root=.` 返回结构化 JSON 且 exit code 正确
- [ ] 现有 archived tasks 的 task-state.json 不受影响（向后兼容）
