# 设计：合并一次性 Skill 到 Command

## 策略

逐个合并 4 个 skill 到对应 command，每个合并遵循同一模式：
1. 备份原始 skill 目录到临时位置
2. 将 SKILL.md 的步骤指令合并到 command 的 `**Steps**` 部分
3. 移除 "Use the Skill tool to invoke ..." 的转发语句
4. 保留 command 的 frontmatter（name/description）不变
5. 确认内容完整后删除 skill 目录
6. 全量合并完成后端到端测试
7. 更新 README.md 反映合并后架构（1 个 skill、6 个 command），在顶部添加语言切换链接
8. 新建 README.zh-CN.md（完整中文翻译，镜像英文结构）
9. 更新 install.sh：移除 4 个已合并 skill 的 cp 行，只保留 task-do
10. 更新 install.ps1：同上
11. 审查 .gitignore（预期无变更：现有规则均为 runtime 产物，不涉及 skills/）
12. 同步 workspace → `~/.claude/`（skills/task-do/, commands/task/*.md, task-workflow/*.ts）
13. Git commit & push to GitHub

## 关键决策

- **SKILL.md 中的 frontmatter 丢弃，保留 command 的 frontmatter**：command 的 name/description 是用户可见的入口描述，skill 的 metadata（version、compatibility）对 command 无意义。
- **Guardrails 合并到 command 末尾**：每个 skill 都有 `**Guardrails**` 部分，这些是 AI 行为约束，必须保留。
- **保留 `--project-root=<PROJECT_ROOT>` 模式**：所有 workflow-runtime.ts 调用继续使用 `--project-root` 参数。
- **task-do 不动**：合并后 `~/.claude/skills/` 下只剩 task-do 和 cc-switch 管理的 skill。task-do 需要的 system-reminder 持久性保持不变。

## 风险

- **合并后指令丢失导致功能退化**：缓解——逐文件对比 SKILL.md 和 command 的合并结果，确保每个步骤和 guardrail 都有对应内容。
- **README 双语切换用纯 Markdown 链接**：`[English](README.md) | [中文](README.zh-CN.md)` 放在两个 README 顶部第一行。不依赖 shields.io 等外部服务，纯文本即可。
- **install.sh/install.ps1 只保留 task-do**：合并后只剩 task-do 是 skill，安装脚本必须从 5 个 cp 减到 1 个。README 中 "five skills" → "one skill"。
- **.gitignore 不需要修改**：当前规则（`task-workflow/tasks/*`、`runtime/`）均与 skills/ 无关。被删除的 4 个 skill 目录是跟踪文件，通过 git rm 处理即可。
- **同步策略**：先改 workspace 文件，再用 cp 同步到 `~/.claude/` 对应路径。README/.gitignore/install.* 不同步到 `~/.claude/`（它们属于仓库）。
- **Delete 操作不可逆**：缓解——先备份到 `~/.claude/skill-backups/` 再删除。
- **Claude Code 可能需要重启才生效**：skill 目录删除后可能被缓存。缓解——测试前检查 skill 列表确认旧条目已消失。
