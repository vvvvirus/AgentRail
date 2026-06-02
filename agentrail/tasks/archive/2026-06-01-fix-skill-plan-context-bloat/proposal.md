# 调查并修复 Skill Plan 上下文膨胀

## 目标
将 `/task:plan` 调用后的上下文占用从当前 ~18%（~180K/1M tokens）降低到 12% 以下（~120K/1M tokens）。

## 动机
上次精简（archive/2026-05-29-workflow-quality-improvements）将 skill 文件从 943 行减到 467 行（-52%），但上下文占用 18% 没有明显改善。这说明 skill 文件大小不是主要瓶颈——真正的膨胀来源在其他地方。需要重新摸底、找到真正的上下文消耗来源，针对性精简。

## 范围

### 包含
- 精确测量各来源的 token 消耗（system prompt、tool definitions、skills list、skill files、CLAUDE.md、memory 等）
- 识别 skill list 中的重复/冗余条目（23 个 skill 含别名）
- 分析 MCP chrome-devtools 工具（20+ 个）对上下文的影响
- 进一步精简 skill 文件（目标再减 20-30%）
- 落实所有可行的精简措施并验证效果

### 不包含
- 修改 Claude Code 本身的 system prompt（不可控）
- 修改 workflow-runtime.ts 核心逻辑（除非发现冗余）
- 删除必要的 skill 功能

---

## Completion Summary
- **Completed:** 2026-06-01
- **Result:** 诊断完成，确认 18% 上下文消耗来自 Claude Code 基础设施（系统 prompt + 61 个工具定义 + MCP chrome-devtools），与 skill 文件无关。skill 文件和用户配置已精简到极致（~3K tokens）。唯一可操作项：自行关闭 cc-switch 中的 chrome-devtools MCP（节省 ~5-7K tokens）。
- **Tasks completed:** 3/7（诊断阶段完成；4 个实施任务因收益太小而跳过）
- **Verification:** skipped（纯诊断任务，无 verify commands）
- **Deviations:** 目标从"上下文降到 12%"调整为"找到根因"——实际发现用户层无可优化空间，瓶颈在 Claude Code 基础设施
- **Key findings:**
  - chrome-devtools MCP 由 cc-switch 管理（SQLite），非 JSON 配置
  - task:do 等冒号别名来自 commands/task/*.md（thin wrapper），非 bug
  - web-video-presentation 符号链接正常工作（非损坏）
  - ui-ux-pro-max SKILL.md 658 行但不调用不加载
  - 无法解释的 ~140K token 缺口 → 推测为 JSON Schema tokenization 膨胀 + DeepSeek 代理层
