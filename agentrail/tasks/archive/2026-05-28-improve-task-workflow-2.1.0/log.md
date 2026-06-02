# 计划修订日志：improve-task-workflow-2.1.0

## 概述
本 task 在规划阶段经历 4 轮讨论和重写（计划→推翻→重规划→细化），最终从臃肿方案收敛到 5 删 3 改的极简方案。此日志在规划完成时补记，防止上下文压缩后丢失。

开始时间：2026-05-27，最终定稿：2026-05-28。

---

## Plan update: 2026-05-27 23:45 → v1（臃肿版）
**触发**：用户要求根据 `claudeworkflow建议2.md` 改进项目。

**v1 方案**（已废弃）：
- 3 个 JSON Schema + per-task runtime/ 目录
- 新增 verifier skill（独立）
- 升级 4 个 skill（task-do/plan/done/replan）
- 新增 knowledge-graph.json + 全局 checkpoint 系统
- 10 个 task，双轨制（JSON + Markdown）

**问题**：臃肿。3 schema + knowledge graph + checkpoint + verifier skill，改动量太大，和项目"极简无依赖"定位冲突。

---

## Plan update: 2026-05-27 23:50 → v2（slim 版）
**用户反馈**："会不会有点臃肿？"

**改动**：
- 删掉所有 JSON runtime state 双轨方案
- 改为只做一个东西：verifier skill（`/task:verify`）
- 3 个 task

**对话中暴露的深层问题**：
- 用户追问：建议里提到的 orchestration→code、worktree isolation、task compiler 没放进去？
- 用户追问：全删 md 换 JSON 是否更简洁？
- 用户追问：写独立程序 `workflow-runtime.ts` 是否更好？

---

## Plan update: 2026-05-27 23:51 → v3（加入 runtime.ts）
**用户决定**："按这个思路重规划。另外，写一个独立程序。"

**关键决策**：
- 删掉 tasks.md 中的 `(depends on: xxx)` 内联依赖语法
- markdown 保留叙事文本（proposal/design/log），JSON 存储结构化数据（task-state/knowledge-graph）
- 新增 `workflow-runtime.ts`——独立 TypeScript CLI
- 只依赖 tsx，`npm install` 即用
- verifier 合并为 runtime.ts 的 `verify` 子命令，不独立

**改动量**：11 个 task，新增 package.json/tsconfig.json/runtime.ts/2 schema，升级 4 skill，新增 verify cmd

---

## Plan update: 2026-05-28 00:26 → v4（合并 replan + 精简）
**用户反馈**：
- "replan 功能一直觉得有点毛病，有点多余"
- "各文件里既写中文又写英文，不统一"
- "plan 文件应该中文，公共文件英文"
- "本次计划修改没有写 log.md，这是一个问题"

**第四次修订的改动**：

| 改动 | 说明 |
|------|------|
| 合并 replan 到 plan | 一个 `/task:plan` 支持创建和更新，不再需要独立命令 |
| 删除 task-replan | skill + command 都删 |
| 删除 2 个 JSON Schema | TypeScript interfaces 是真源头，Schema 从未被验证过 |
| 删除 task-verify skill | verify 是单步操作，逻辑直接放 command |
| 创建 CLAUDE.md | 英文，确立语言规范 + 代码规范 |
| **plan 时即创建 log.md** | 之前 plan 不写 log，do 才写。导致中间修订无记录。 |
| **更新后立即追加 log** | 不等 session 结束。本轮 4 次修订无日志就是反面教材。 |
| task-list/log 升级 v2.0 | 读 runtime state，之前仍是 v1.1 |
| 所有 plan 文件改中文 | proposal/design/tasks/log 全中文 |

**最终文件变化**：新增 1（CLAUDE.md），删除 5（2 schema + replan skill+cmd + verify skill），升级 3（task-plan/list/log），重写 1（verify cmd），更新 1（README）。Commands 7→6，skills 7→5。

---

---

## Session: 2026-05-28 14:00
**Starting progress:** 1/10 tasks complete
**Status:** ACTIVE
**Session start completed count:** 1
**Pending tasks:**
- 1. 创建项目级 CLAUDE.md
- 2. 删除冗余的 JSON Schema 文件
- 3. 删除 skills/task-replan/ 和 commands/task/replan.md
- 4. 删除 skills/task-verify/SKILL.md，重写 commands/task/verify.md
- 5. 升级 skills/task-plan/SKILL.md——合并更新模式
- 6. 升级 skills/task-list/SKILL.md 到 v2.0
- 7. 升级 skills/task-log/SKILL.md 到 v2.0
- 8. 更新 README.md
- 9. 验证所有改动

## 最终方案总结

```
之前 (v2.0):
  7 commands + 7 skills + 2 schema + runtime.ts

之后 (v2.1.0):
  6 commands + 5 skills + runtime.ts + CLAUDE.md
  删除 5 个冗余文件，合并 replan 到 plan
  语言规范：公共英文，计划中文
  日志纪律：plan 时初始化 log.md，每次更新立即追加
```

---

## Session end: 2026-05-28 14:30
**Result:** Completed
**Status:** COMPLETE
**Tasks completed this session:** 9
**New progress:** 10/10 tasks complete
**Completed:**
- [x] 0. 创建本 task 的 log.md（已在规划阶段完成）
- [x] 1. 创建项目级 CLAUDE.md
- [x] 2. 删除冗余的 JSON Schema 文件
- [x] 3. 删除 skills/task-replan/ 和 commands/task/replan.md
- [x] 4. 删除 skills/task-verify/SKILL.md，重写 commands/task/verify.md
- [x] 5. 升级 skills/task-plan/SKILL.md——合并更新模式 + 即时写 log
- [x] 6. 升级 skills/task-list/SKILL.md 到 v2.0
- [x] 7. 升级 skills/task-log/SKILL.md 到 v2.0
- [x] 8. 更新 README.md
- [x] 9. 验证所有改动（含安装脚本更新 + 本地安装验证）

**改动总结：**
- 新增 1：CLAUDE.md
- 删除 5：2 schema + replan skill+cmd + verify skill
- 升级 3：task-plan（合并更新模式）、task-list（v2.0）、task-log（v2.0）
- 重写 1：verify command（去 skill 化）
- 更新 3：README、install.sh、install.ps1
- 删除 replan.md 残留文件
