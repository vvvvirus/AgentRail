# Improve Claude Task Workflow

## Goal
基于 Kimi 已推送的 v1.1 修改和 ChatGPT 的架构分析建议，改进 Task Workflow。重点解决：markdown 状态可靠性、任务依赖关系、验证闭环。同时 dogfooding 自身工作流。

## Motivation
- Kimi 已提交 v1.1（12 项修复），需要 review 并确认质量
- ChatGPT 指出核心问题：markdown 模拟状态机不可靠、缺少依赖图、验证不够确定性强
- 首次实际使用 Task Workflow，过程中发现的问题本身也是改进素材

## Scope
- In scope:
  - Review Kimi v1.1 修改，对照 ChatGPT 的批评逐项检查
  - 增强 markdown 状态追踪可靠性（更结构化的标记，仍是 markdown）
  - tasks.md 支持任务依赖声明
  - 加强 verification 闭环
  - 6 个 skill 一致性检查
  - 修复 /task:plan 输出太简略 — plan 完成后必须展示 design.md 策略和 tasks.md 步骤清单，不能只给一行摘要就让用户盲点 /task:do（dogfooding 发现）
- Out of scope:
  - 引入 JSON/YAML/数据库等新格式（坚持 markdown-only）
  - Workflow Runtime / Dependency Graph Engine（属于 v2 愿景）
  - 新增 skill（除非 review 中发现必要）
  - 推送到 GitHub（最后统一确认）

## Constraints
- 不要随意 push 到 GitHub，最后统一确认
- 坚持 markdown-only：不引入 JSON schema、YAML 配置、数据库
- 务实优先：不做 ChatGPT 提到的「未来方向」（DAG engine、semantic memory 等），只做当前可落地、立即可用的改进

---
<!-- COMPLETION -->

## Completion Summary
- **Completed:** 2026-05-27
- **Result:** 5 个文件改进，+67/-24 行。新增依赖声明语法、log 结构化 Status 标记、task-plan 完整输出、修复 task-do 死引用、强化 verification 闭环。Dogfooding 发现并修复 /task:plan UX 问题。
- **Tasks completed:** 13/13
- **Deviations from plan:** None
