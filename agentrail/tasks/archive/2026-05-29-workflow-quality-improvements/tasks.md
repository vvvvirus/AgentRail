# 任务清单：Workflow 质量改进

## 前置
- [ ] 确认 workflow-runtime.ts 正常运行（`npx tsx workflow-runtime.ts` 输出 usage）

## 执行
- [x] 分析当前 5 个 skill 文件的上下文占用，逐文件标记可删除/精简的冗余内容（重复 guardrails、过长示例、冗余说明、跨文件重复描述）
- [x] 精简所有 skill 文件：task-plan（311→188 行）、task-do（259→101 行）、task-done（136→59 行）、task-log（133→60 行）、task-list（104→48 行），总计 943→456 行（-52%），超出目标
- [x] 在 task-plan SKILL.md 中集成 review agent：步骤 9.5（artifact 验证后、summary 前）加入两层审查——第一层 deterministic checks（task 数量 3-15、dep 引用合法性、verify command 覆盖、单 task 粒度检查），第二层用 Agent 工具 spawn 受限 subagent（结构化 task-state.json 输入、PASS/WARN/BLOCK 输出、prompt 硬约束不重写不扩展 scope）
- [x] 更新 task-do SKILL.md：执行循环中输出 markdown checkbox 格式触发原生 UI（`- [ ]` pending / `- [x]` done），每步执行前写 pre-task checkpoint（记录"即将执行 task X"而非"已完成 task X"）
- [x] 在 task-do SKILL.md 中加入 compact 恢复逻辑：启动时读取最近 checkpoint，检测 status=`in_progress` 的任务，对比 log.md 和 task-state.json 判断中断点，自动从断点继续
- [x] 端到端测试：创建临时 sample task，走 plan（含内嵌 review）→ do 全流程，验证 review PASS/WARN/BLOCK 输出、checkbox UI 展示、compact 恢复路径

## 验证
- [x] 所有 skill 文件总行数 ≤ 750（从 943 减少 ≥ 20%）— 实际 456 行
- [x] `npx tsx workflow-runtime.ts` 所有命令正常运行
- [x] task-plan 对 sample task 输出带 review 结果的 summary（PASS/WARN/BLOCK + 具体建议）
- [x] do 执行时 checkbox 格式稳定展示
