# 改进 Task Workflow v2.1.0 —— 合并 Replan + 精简去重 + 语言规范 + 日志纪律

## 目标
合并 `/task:replan` 到 `/task:plan`，删除 5 个冗余文件，升级 2 个遗留 skill，创建项目级 `CLAUDE.md` 确立中英文规范，修复计划修订不写日志的问题。

## 动机

v2.0 执行中和本轮讨论暴露的问题：

1. **replan 是多余的** — "修改计划"不需要独立命令。`/task:plan` 检测到已有 task 直接进入更新模式即可。git 已经做版本管理。小改和大改用同一个流程：直接编辑文件 + 记录 log.md。
2. **冗余文件** — 2 个 JSON Schema 从未被任何验证器加载过（TypeScript interfaces 是真源头），task-verify 是单步操作不需要独立 skill，task-replan skill+command 将在合并后删除。
3. **task-list 和 task-log 仍是 v1.1** — 不读 runtime state，属于遗留代码。
4. **语言混用** — 公共文件（README、skills、commands、runtime.ts）和计划文件（proposal、design、tasks、log）中英文混在同一句里，规范缺失。
5. **计划修订无日志** — 本轮计划从臃肿版到终版经历 4 轮讨论和重写，全程无 log.md 记录。原因：`/task:plan` 不创建 log.md，更新时直接覆盖原文件。解法：plan 时即创建 log.md，更新时编辑完立即追加，不等到 session 结束。

## 范围

### 包含
- 创建项目级 `CLAUDE.md`（英文），确立语言规范：公共文件写英文，计划文件写中文
- 合并 `/task:replan` 逻辑到 `/task:plan`——task 存在时进入更新模式
- `/task:plan` 创建 task 时同时初始化 `log.md`
- 更新模式下每次修改后立即追加 log.md（不等 session 结束）
- 删除 `skills/task-replan/SKILL.md` 和 `commands/task/replan.md`
- 删除 `runtime/task-state.schema.json` 和 `runtime/knowledge-graph.schema.json`
- 删除 `skills/task-verify/SKILL.md`，逻辑并入 `commands/task/verify.md`
- 升级 `skills/task-list/SKILL.md` 到 v2.0
- 升级 `skills/task-log/SKILL.md` 到 v2.0
- 更新 README

### 不包含
- 改变 runtime.ts 行为
- `revisions/` 版本化目录（git 已做此事）

## 约束
- 公共文件（README、skills、commands、runtime.ts、CLAUDE.md）用英文
- 计划文件（proposal、design、tasks、log）用中文
- plan 创建即写 log.md，更新后立即追加
- plan 更新模式保持"只编辑变了的部分，不重写整个文件"
- 向后兼容：无 runtime state 的旧 task 可 fallback 到纯 markdown 模式

---

<!-- COMPLETION -->

## Completion Summary
- **Completed:** 2026-05-28
- **Result:** v2.1.0 交付——合并 replan 到 plan、删除 5 个冗余文件、升级 3 个 skill 到 v2.0、创建 CLAUDE.md 确立中英文规范、修复计划修订不写日志的问题
- **Tasks completed:** 10/10
- **Verification:** skipped（meta-task，无 runtime state）
- **Deviations from plan:** install 脚本从 git 恢复并更新（原已被删除）
