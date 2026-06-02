# 合并一次性 Skill 到 Command

## 目标
将 task-plan、task-done、task-log、task-list 四个一次性 skill 的指令合并到对应的 `commands/task/*.md` 中，删除 skill 目录，减少文件数和维护成本。task-do（长循环任务）保留 skill 形式。

## 动机
当前每次调用 `/task:plan` 经历两次文件加载 + 一次 Skill tool 调用（command → skill），而 command 只是 thin wrapper。对于一次性操作（plan/done/log/list），不需要 skill 的 `<system-reminder>` 持久性。合并后每次操作减少一次 tool call 和一次文件读取。

## 范围

### 包含
- 将 task-plan/SKILL.md 的内容合并到 commands/task/plan.md
- 将 task-done/SKILL.md 的内容合并到 commands/task/done.md
- 将 task-log/SKILL.md 的内容合并到 commands/task/log.md
- 将 task-list/SKILL.md 的内容合并到 commands/task/list.md
- 删除 4 个 skill 目录（`~/.claude/skills/task-plan/`, `task-done/`, `task-log/`, `task-list/`）
- 更新 command 中的 Skill tool 引用为直接执行指令
- 更新 README.md（反映合并后架构）+ 新建 README.zh-CN.md（中文版，双向语言切换）
- 更新 install.sh 和 install.ps1（移除已合并为 command 的 4 个 skill，只保留 task-do）
- 审查 .gitignore（确认无需修改）
- 同步所有文件到本机 `~/.claude/`
- Git commit & push to GitHub

### 不包含
- task-do（保留 skill 形式）
- task:verify（已是纯 command）
- 修改 workflow-runtime.ts
- 修改 task-workflow 目录结构
- 批量自动化执行（仍需人工确认高风险删除操作）

## 约束
- Command 文件保持纯英文
- 保留所有现有功能逻辑和 guardrails
- 保留 command 文件的 frontmatter 格式

---

## Completion Summary
- **Completed:** 2026-06-01
- **Result:** All 4 one-shot skills merged into standalone commands, skill dirs deleted, task-do preserved. README updated (EN+CN bilingual), install scripts fixed, pushed to GitHub (4811b83).
- **Tasks:** 14/14 done
- **Verification:** passed (structural — no verify commands configured)
- **Deviations:** None
