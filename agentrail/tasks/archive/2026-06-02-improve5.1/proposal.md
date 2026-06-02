# AgentRail — 项目改名与去 Claude 化
## 目标
将项目从 "Claude Task Workflow" 重命名为 "AgentRail"，命令从 `/task:xxx` 重命名为 `/railxxx`，移除所有 Claude/Claude Code 特定表述，使项目在概念上面向所有 agent 可用。
## 动机
- **品牌锁定**：当前项目名 "Claude Task Workflow" 和命令名 `/task:do`、`/task:plan` 将项目绑定在 Claude 生态中，其他 agent 用户第一眼就会认为不可用
- **输入繁琐**：`/task:plan` 中的冒号增加输入成本，`/railplan` 更短更快
- **认知定位**："task workflow" 是泛化描述而非品牌名，AgentRail 有辨识度且暗示"在 agent 铁轨上跑任务"
## 范围
### 包含
- 项目名 "Claude Task Workflow" → "AgentRail"（README、package.json、CLI 帮助文本等所有位置）
- 命令文件：`commands/task/` → `commands/rail/`，内部 `/task:xxx` → `/railxxx`
- Skill：`skills/task-do/` → `skills/rail-do/`，skill name `task-do` → `rail-do`
- Claude 特定表述 → agent 通用表述（"Claude Code" → "your agent"、"~/.claude/" 保留但说明为 agent 配置目录）
- 安装脚本：文件名和消息更新
- 所有非归档文件中的旧引用全局替换
### 不包含
- 运行时目录 `task-workflow/` 内部路径不改名（功能性目录，非品牌）
- 归档任务（archive/）中的历史文件不改（历史记录）
- 不实现多 agent 平台的实际适配（本次只做命名层面去 Claude 化）
- 安装目标路径 `~/.claude/` 不变（Claude Code 文件系统约束）

---
## Completion Summary
- **Completed:** 2026-06-02
- **Result:** Full rebrand from "Claude Task Workflow" to AgentRail. Commands renamed /task:xxx → /railxxx. Runtime directory task-workflow/ → agentrail/. Install scripts + commands + skill made agent-agnostic with auto-detection. RT discovery uses `find "$HOME"` — no hardcoded agent names. 25/25 tests pass. Zero old references in active files.
- **Tasks:** 8/8 done
- **Verification:** passed (grep sweeps clean, tests 25/25, runtime CLI works)
- **Deviations:**
  - Directory rename: `task-workflow/` → `agentrail/` (user requested, superseded original scope)
  - Agent-agnostic install: auto-detect + `--target` flag (user requested for Codex/Gemini support)
  - RT discovery: `find "$HOME"` instead of hardcoded agent list (user requested cleaner approach)
  - Fixed Chinese ID generation bug in cli.ts (found during review)
  - Fixed tsconfig.json include path, SKILL.md version, install.ps1 tilde (found during audit)
## 约束
- 所有命令文件、skill 文件必须在 Claude Code 重启后正常被发现和运行
- 安装脚本必须继续正常工作
- 不破环现有安装（旧路径的 workflow-runtime.ts shim 保留）
- README 必须同时更新英文和中文版本
