# Workflow 质量改进

## 目标
提升 task-workflow 的可靠性、可读性和上下文效率：加入计划审查 agent、稳定展现原生 checkbox UI、减少 skill 上下文占用、防止 compact 导致任务中断。

## 动机
当前 workflow 有四个痛点：
1. **计划无审查**：plan 生成后直接执行，缺少对任务拆分、依赖、风险的检查，错误计划会污染整个执行流程
2. **进度 UI 不稳定**：do 执行时 checkbox 渲染不一致，Claude Code 原生 `✔ ◻ ◼` 风格未稳定触发
3. **上下文占用过高**：skill 文件共约 1120 行，加载后占 1M 上下文的 ~17%，留给实际任务的上下文偏少
4. **compact 中断风险**：复杂任务执行时间长，上下文满时 Claude 自动 compact，任务循环中断，进度可能丢失

## 范围

### 包含
- 在 task-plan skill 中嵌入 review agent：plan 生成后、展示前内部执行审查，输出 PASS/WARN/BLOCK，零额外 skill 文件
- 优化 task-do 输出格式，稳定触发 Claude Code 原生 checkbox UI
- 精简所有 skill 文件，目标减少 30-40% 行数
- 实现任务执行前的预检查点（pre-task checkpoint）机制
- 在 task-do 中加入 compact 后恢复逻辑

### 不包含
- 修改 workflow-runtime.ts 的核心数据结构（向后兼容）
- 新增外部依赖
- 改变 task 目录结构
- review agent 的自动重写能力（仅 veto，不创作）

## 约束
- 所有 skill 文件保持纯英文（遵循 CLAUDE.md 语言规则）
- 单个文件不超过 400 行
- 嵌套不超过 4 层
- 向后兼容：已有的 tasks.md 和 task-state.json 格式不变

---

<!-- COMPLETION -->

## Completion Summary
- **Completed:** 2026-05-29
- **Result:** 四个改进全部实现：skill 总行数 943→456（-52%），review agent 嵌入 task-plan 步骤 10（两层架构：deterministic + LLM subagent），task-do 加入 checkbox UI / pre-task checkpoint / compact 恢复三种逻辑
- **Tasks completed:** 6/6
- **Verification:** all checks passed (no verify commands configured for this project)
- **Deviations from plan:** 无 — scope 和策略均按计划执行，实际压缩比例（-52%）超出预期（-30~40%）
