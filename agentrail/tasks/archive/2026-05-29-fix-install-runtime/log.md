# 执行日志：fix-install-runtime

## 概述
Task created on 2026-05-29.

---

## Session: 2026-05-29 20:58
**Starting progress:** 0/5  **Status:** ACTIVE
**Pending:** install.ps1, install.sh, 5 skill files path update, install test, non-repo test

---

## Session end: 2026-05-29 21:03
**Result:** Completed  **Status:** COMPLETE
**Tasks this session:** 5  **Progress:** 5/5
**Verification:** all checks passed manually (no verify commands configured)

**Completed:**
- [x] install.ps1 + install.sh: 创建 task-workflow 目录、复制 runtime、npm install
- [x] 5 个 skill 全部改为绝对路径 `~/.claude/task-workflow/workflow-runtime.ts`
- [x] 全新安装测试通过：所有文件到位，`~/.claude/task-workflow/node_modules/tsx` 存在
- [x] 非 repo 目录测试通过：从 HOME 运行 runtime 输出 usage 正常
