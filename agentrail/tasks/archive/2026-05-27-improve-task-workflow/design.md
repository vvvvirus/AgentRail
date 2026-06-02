# Design: Improve Claude Task Workflow

## Strategy
Dogfooding + 渐进改进。先 review Kimi v1.1 对照 ChatGPT 批评，再逐项落地 4 个可落地方向。每个改进只改涉及的 skill，不做全量重写。

## Steps Overview
1. Review Kimi v1.1 — 逐文件 diff，对照 ChatGPT 的 5 个问题检查是否已解决
2. 增强状态标记 — 在 log.md 和 tasks.md 中使用更结构化的标记，减少 LLM 误读
3. 任务依赖声明 — tasks.md 支持 `(depends on: xxx)` 语法
4. 加强验证闭环 — verification 步骤增加具体检查项
5. 一致性检查 — 6 个 skill 之间的命名、参数传递、log 格式是否一致
6. 修复 /task:plan 输出 — Step 8 展示结构化概要（策略 + 步骤清单），不让用户盲点
7. 更新 install 脚本和 README

## Key Decisions
- Markdown-only 红线：不用 JSON/YAML，在 markdown 内用约定语法增强结构化（如 `depends on:` 标记）
- 不做 DAG engine：ChatGPT 建议的 Dependency Graph 是 v2 愿景，当前只需简单的依赖声明即可
- 先 review 再改：避免重复 Kimi 的工作，也避免覆盖好的修改
- 最后统一 push：所有修改本地确认后再推
- Plan 输出必须展示关键内容：plan 和 do 之间的信息断层是真实 UX 问题，用户不该被迫点开文件才知道要干什么

## Risks & Mitigations
- Kimi 修改可能引入新问题：逐文件 diff review
- 增强标记可能增加复杂度：保持向后兼容，旧格式仍可读
- Dogfooding 中发现 workflow bug：立即记入 log.md，严重的先修

## Resources Needed
- 当前 repo 所有 skill/command 文件
- `git diff HEAD~2..HEAD` 查看 Kimi 修改
- ChatGPT 建议全文（已收到）
