# 修复所有已识别的 Bug 和改进点

## 目标
修复 `claude-task-workflow` 项目中已识别的 17 个 bug 和改进点，覆盖 `workflow-runtime.ts`、skill 文件和安装脚本。

## 动机
代码审查发现多处逻辑错误、边界情况处理缺失和文档不一致，影响工作流工具的可靠性和用户体验。

## 范围

### 包含
- `workflow-runtime.ts` 中的 12 个 bug/改进
- `skills/task-do/SKILL.md` 中的 2 个问题（过时引用 + 矛盾指引）
- `skills/task-plan/SKILL.md` 中的依赖格式文档改进
- `install.sh` 和 `install.ps1` 中的格式问题

### 不包含
- 新功能开发
- 架构重新设计
- 测试用例编写

## 约束
- 保持向后兼容
- 不改变现有 CLI 接口
- 每个文件不超过 400 行

---
<!-- COMPLETION -->

## Completion Summary
- **Completed:** 2026-05-28
- **Result:** All 17 bugs/improvements fixed across workflow-runtime.ts (13 fixes), skill files (3 fixes), and install scripts (1 fix)
- **Tasks completed:** 18/18
- **Verification:** No verify commands configured (not applicable)
- **Deviations from plan:** None
