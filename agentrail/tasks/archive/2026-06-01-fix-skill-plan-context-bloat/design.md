# 设计：Skill Plan 上下文膨胀修复

## 策略

分两层推进：

**第一层 — 测量与诊断**：不再猜测，逐来源测量 token 消耗。利用 Claude Code 自身的 context 指示器 + 计算各文件的 token 估算值，找出真正的膨胀源。

**第二层 — 针对性精简**：根据诊断结果，按优先级处理：
1. 如果 MCP 工具是主因 → 考虑禁用不用的 chrome-devtools 工具或按需加载
2. 如果 skill list 重复条目贡献显著 → 调查能否去掉 task:do/task:plan 等冒号别名
3. 如果 skill 文件本身还可压缩 → 去掉模板示例中的重复代码块，用更紧凑的描述替代
4. 如果是 Claude Code 本身 overhead → 接受现状，确认无法进一步优化

## 关键决策

- **测量优先于优化**：上次直接在 skill 文件上做减法（943→467 行），没有先测量各部分占比，导致减错了方向。这次必须先测量再动手。
- **Token 估算方法**：英文文本 ~0.75 token/word, 代码 ~1.2 token/word。可以用 `wc -w` 估算各文件的 token 数，加上 system prompt 和 tool definitions 的估算值。
- **Skill 文件模板是最可压缩的部分**：SKILL.md 中的 markdown 模板（proposal.md/design.md/tasks.md 的结构示例）占据约 40 行，可以精简为单行引用。
- **MCP 工具可能是最大的可控变量**：chrome-devtools 插件提供 20+ 个工具（click, fill, screenshot, evaluate_script, performance_*, lighthouse_* 等），每个都有详细的 JSON Schema 参数描述。如果这些工具在当前项目不需要，禁用插件可大幅减少上下文。

## 风险

- **进一步精简 skill 文件可能影响 AI 执行质量**：skill 文件越短，指令越模糊，AI 可能做出错误判断。缓解：只精简模板/示例，保留所有 guardrails 和关键逻辑。
- **禁用 MCP 工具可能影响其他项目**：settings.json 是全局的。缓解：只在项目级 .claude/settings.json 中禁用，或改为按需手动启用。
- **测量不精确**：Claude Code 的 context 百分比是估算值，tokenizer 差异可能导致偏差。缓解：用多种方法交叉验证（百分比 + word count 估算 + 对比开关前后）。
