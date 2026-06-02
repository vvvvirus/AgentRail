# 修复安装脚本：运行时文件安装 + 目录整洁

## 目标
install 脚本安装全部必要文件到本机，使 task-workflow 在任意目录均可使用，同时保持 `~/.claude/` 整洁。

## 动机
当前 install.ps1 / install.sh 只复制 skills 和 commands，遗忘了 workflow-runtime.ts、package.json、tsconfig.json。skills 中写 `npx tsx workflow-runtime.ts`（相对路径），非 repo 目录下找不到 runtime 文件，整个 workflow 无法工作。

## 范围

### 包含
- 将 workflow-runtime.ts、package.json、tsconfig.json 安装到 `~/.claude/task-workflow/`
- 更新 install.ps1 和 install.sh，覆盖运行时文件复制
- 更新全部 5 个 skill 文件中的 runtime 路径为 `~/.claude/task-workflow/workflow-runtime.ts`
- 安装后在 `~/.claude/task-workflow/` 执行 `npm install` 缓存 tsx 依赖
- 保证 GitHub 用户 clone 后直接运行 install 脚本可用

### 不包含
- 改变 skills/ 和 commands/ 的安装位置（Claude Code 强制要求）
- 全局 npm 包安装
- 修改 workflow-runtime.ts 本身
- 处理 Windows PowerShell 以外的终端（依赖 bash，与项目设定一致）

## 约束
- skills 和 commands 路径不可变（Claude Code 硬性要求）
- runtime 必须通过 bash 的 `~` 路径访问（Claude Code shell = bash）
- 安装后 `~/.claude/` 结构须清晰，新增内容仅在 `task-workflow/` 子目录

---

<!-- COMPLETION -->

## Completion Summary
- **Completed:** 2026-05-29
- **Result:** 运行时文件安装到 `~/.claude/task-workflow/`，5 个 skill 全部改为绝对路径，install.ps1/sh 均包含 npm install 步骤。GitHub 用户 clone 后一键安装即可在任何目录使用 task-workflow。
- **Tasks:** 5/5 done
- **Verification:** all checks passed (no verify commands configured)
- **Deviations:** None
