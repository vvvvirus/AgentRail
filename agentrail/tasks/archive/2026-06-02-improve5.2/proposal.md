# 修复审计报告的 16 项问题
## 目标
逐项分析并修复 AgentRail 审计报告中的 16 项问题（已在 improve5.1 中修复 4 项的实际修复 + 其余 16 项的方案）。
## 动机
blind audit 发现了 20 项问题。4 项已在上一个任务中修复，剩余 16 项需要明确的处理决策：哪些修、怎么修、哪些不修。
## 范围
### 包含
- 16 项问题逐一判定：修复 / 有意设计 / 暂缓
- 对判定"修复"的项目实施修改
- 修复后跑测试验证
### 不包含
- 已修复的 4 项（tsconfig.json、SKILL.md version、README 命名说明、install.ps1 tilde）
- 新功能开发
- 大规模重构
## 约束
- 修复不得引入新 bug
- 测试必须全部通过
- 保持 agent 无关性

---
## Completion Summary
- **Completed:** 2026-06-02
- **Result:** Fixed 10 of 16 audit issues. Shebang, verify-runner path bug, verify.md fallback, plan.md verify instructions, --blocked-by CLI, install.ps1 positional args, dead catch removed, plan.md English templates, list.md language-agnostic H2, package.json test script. 25/25 tests pass, verify detects test command.
- **Tasks:** 10/10 done
- **Verification:** passed (tests 25/25, verify PASS)
- **Deviations:** None
