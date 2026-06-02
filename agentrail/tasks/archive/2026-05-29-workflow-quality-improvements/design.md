# 设计：Workflow 质量改进

## 策略

四个改进点分两条线并行推进：

**A 线 — Plan 质量（review agent）**：在 task-plan skill 末尾（artifact 生成后、summary 展示前）嵌入 review 步骤。不创建独立 skill 文件，不增加 skill 数量。Review 分两层：第一层纯代码 deterministic checks（直接在工作流中执行，不消耗 LLM 调用），第二层用 Agent 工具 spawn 受限 review subagent。输入是 `task-state.json`（结构化 task graph，非 markdown 文本），输出 PASS/WARN/BLOCK。WARN 不阻塞执行，BLOCK 才阻塞。Reviewer 只有 veto 权，不能重写计划。

**B 线 — Do 质量（UI + 上下文 + compact）**：三件事共享同一批 skill 文件的改动：
1. 精简 skill 文本，去掉冗余说明和重复指令
2. 在 task-do 输出中嵌入 markdown checkbox 格式触发原生 UI
3. 每次执行任务前写 checkpoint，compact 后从 checkpoint 恢复

## 关键决策

- **Review agent 嵌入 task-plan 而非独立 skill**：不增加 skill 数量（保持 5 个），review 在 plan 内部自动执行，用户无需额外操作。review 逻辑写在 task-plan SKILL.md 的步骤 9.5（在 artifact 验证后、summary 展示前）。review 失败的 plan 不会阻塞展示，但 WARN/BLOCK 会附在 summary 中。
- **Review 两层架构：deterministic checks + LLM review**：第一层是纯规则检查（task 数量范围、dep 引用合法性、verify command 覆盖、单 task 粒度），在 task-plan 内直接执行，零 LLM 成本。第二层用 Agent 工具 spawn 受限 subagent，只读 task-state.json，只输出 PASS/WARN/BLOCK + 具体建议，prompt 中硬约束"不得建议重写、不得扩展 scope、不得执行任何操作"。两层都通过后才 PASS。
- **Review 输入用 task-state.json（结构化）而非 tasks.md（文本）**：结构化 task graph 减少 LLM 误读。subagent 不读 proposal.md/design.md，只看 task graph 结构本身（节点、依赖、状态），避免被自然语言的模糊性污染。
- **上下文精简策略：命令文件保持薄包装、skill 文件去冗余**：命令文件（~30行）本身很薄不需改动。skill 文件去掉重复的 guardrails、合并相似步骤描述、把冗长的示例替换为简短引用。
- **Pre-task checkpoint 而非 post-task checkpoint**：当前是先执行后写 checkpoint，如果执行中 compact，checkpoint 丢失。改为执行前写 checkpoint（记录"即将执行 task X"），执行后写 done。这样 compact 后可以从"哪个 task 正在执行"恢复。
- **Compact 恢复：log.md + task-state.json 双重来源**：log.md 记录人类可读的进度，task-state.json 记录机器状态。恢复时对比两者，取较新的一方。

## 风险

- **Review subagent 不稳定（LLM 非确定性）**：同一天对同一 plan 可能产生不同结果。缓解：deterministic checks 层无歧义，LLM review 层限制为仅检查 4 类问题（完整性、依赖、粒度、风险），且 subagent prompt 中固定检查清单，减少自由发挥空间。
- **Review 延长 plan 生成时间**：spawn subagent 需要额外 API 调用。缓解：deterministic checks 先过滤掉大部分问题，只有通过第一层的 plan 才触发 LLM review；简单 task（≤3 步）跳过 LLM review。
- **精简 skill 后功能遗漏**：可能删掉了一些边缘情况的处理。缓解：对比精简前后的 guardrails 列表，确保每条都有对应处理（在 runtime 或 skill 中）。
- **Compact 恢复逻辑本身可能失败**：如果 checkpoint 写入也失败则无法恢复。缓解：checkpoint 写入是同步 fs 操作，极小概率失败；失败时 log.md 作为兜底。
- **原生 checkbox UI 依赖 Claude Code 内部渲染**：Claude Code 的 checkbox 渲染行为未公开文档化，无法 100% 保证稳定。缓解：用 markdown 的 `- [ ]` / `- [x]` 格式，这是最广泛支持的触发方式。
