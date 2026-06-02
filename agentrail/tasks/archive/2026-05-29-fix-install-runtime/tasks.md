# 任务清单：修复安装脚本

## 前置
- [ ] 确认 Node.js >= 18 和 npm 可用

## 执行
- [x] 更新 install.ps1：新增 `~/.claude/task-workflow/` 目录，复制 workflow-runtime.ts、package.json、tsconfig.json，执行 `npm install`
- [x] 更新 install.sh：同上，bash 语法适配 Linux/macOS/Git Bash
- [x] 更新全部 5 个 skill 文件（task-plan/task-do/task-done/task-log/task-list）：`workflow-runtime.ts` → `~/.claude/task-workflow/workflow-runtime.ts`
- [x] 删除旧安装残留，执行全新安装，验证所有文件到位且 `npm install` 成功
- [x] 从非 repo 目录（如 `$HOME`）测试 `npx tsx ~/.claude/task-workflow/workflow-runtime.ts` 能正常运行

## 验证
- [x] `~/.claude/task-workflow/workflow-runtime.ts` 存在
- [x] `~/.claude/task-workflow/node_modules/tsx` 存在（npm install 成功）
- [x] `npx tsx ~/.claude/task-workflow/workflow-runtime.ts` 在任何目录输出 usage
- [x] install.sh 和 install.ps1 均能在各自平台干净安装
