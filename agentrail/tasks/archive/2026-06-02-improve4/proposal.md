# 根据社区反馈优化项目 — 轻量级增强
## 目标
在不增加复杂度负担的前提下，为项目添加两个最被社区认可的轻量改进：产物追踪（Artifact Tracking）和结构化校验输出（Validate Command）。
## 动机
两份外部建议文件（基于社区对 Superpowers/OpenSpec 等项目的反馈）指出了当前项目可以增强的方向。核心原则是：**保持轻量、状态结构化、逻辑让 Claude 驱动**。项目已有的基础（task-state.json、DAG 依赖、Review Subagent、checkpoint、verify）已经覆盖了大部分建议。可选审查模式经判断不需要添加 — 当前审查机制已足够轻量且有效。
## 范围
### 包含
- SubTask 和 Checkpoint 接口增加 `artifacts` 字段，checkpoint 和 step-done 命令支持 `--artifacts=` 参数
- Runtime 新增 `validate` 命令，将 4 项确定性检查输出为结构化 JSON，标准 exit code
- 更新 task-plan command 和 task-do skill
- 更新 README.md（合并 What's New）
- 同步到本地 `~/.claude/` 并推送到 GitHub

### 不包含
- 可选审查模式（当前 full review 已足够轻量，增加模式选择反而增加复杂度）
- YAML 替代 JSON（JSON 对机器更友好，无实际收益）
- Task Fingerprint（任务名即唯一标识，无重复创建场景）
- 重写 Reviewer 或 Planner（已有约束足够）
- Slash command 重命名或增减（当前 6 个命令已合理）
## 约束
- 所有改动向后兼容，不破坏现有 task-state.json 格式
- 新增字段均为可选（optional），旧数据无需迁移

---
## Completion Summary
- **Completed:** 2026-06-02
- **Result:** Added artifact tracking (SubTask.artifacts + Checkpoint.artifacts via --artifacts= flag) and validate command (4 deterministic checks, structured JSON, exit codes 0/1/2)
- **Tasks:** 6/6 done
- **Verification:** skipped (no test suite configured)
- **Deviations:** Removed --review flag per user decision; 8→6 tasks
- **Artifacts:** workflow-runtime.ts, commands/task/plan.md, skills/task-do/SKILL.md, README.md, README.zh-CN.md
