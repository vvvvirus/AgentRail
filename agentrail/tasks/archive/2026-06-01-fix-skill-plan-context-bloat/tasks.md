# 任务清单：Skill Plan 上下文膨胀修复

## 前置
- [ ] 确认 workflow-runtime.ts 正常运行

## 执行
- [ ] 建立上下文基准：在新会话中记录 `/task:plan` 调用前后的 context 百分比，估算各来源的 token 占用（system prompt ≈60K, tool definitions ≈80K, skills list, skill files, CLAUDE.md, memory）
- [ ] 用 `wc -w` 统计所有 skill 文件的 token 估算值，列出具体各文件的贡献；检查 skill list 中的重复别名（task:do/task-do 等 5 对）是否实际加载了两次
- [ ] 检查 MCP chrome-devtools 工具的上下文贡献——统计工具数量（20+）和各工具 schema 复杂度，评估禁用后的节省空间
- [ ] 进一步精简 skill 文件：去掉模板代码块（proposal/design/tasks 的 markdown 示例），改用紧凑描述；合并重复 guardrails；目标再减 20-30%（467→~350 行）
- [ ] 落实可行的精简措施：精简 skill 文件、清理不必要的上下文来源、如合适则配置项目级 settings 减少工具加载
- [ ] 回归验证：确保所有 task-* 命令（plan/do/done/log/list）功能正常，上下文百分比降到目标值以下

## 验证
- [ ] 新会话中 `/task:plan` 后上下文占用 ≤ 12%（从 ~18% 降低）
- [ ] 所有 5 个 skill 功能正常（plan/do/done/log/list）
- [ ] `npx tsx workflow-runtime.ts` 所有命令正常运行
