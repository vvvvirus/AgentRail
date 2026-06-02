# 设计：AgentRail 改名
## 策略
分 6 步逐层替换，从文件名到文件内容、从核心到外围。每一步完成后验证 git diff 确认改动正确。

**改名映射表：**

| 旧 | 新 |
|----|----|
| `Claude Task Workflow` | `AgentRail` |
| `claude task workflow` | `AgentRail` |
| `CLAUDE TASK WORKFLOW` | `AGENTRAIL` |
| `/task:plan` | `/railplan` |
| `/task:do` | `/raildo` |
| `/task:done` | `/raildone` |
| `/task:list` | `/raillist` |
| `/task:log` | `/raillog` |
| `/task:verify` | `/railverify` |
| `task-do` (skill name) | `rail-do` |
| `Task: Plan` (command title) | `Rail: Plan` |
| `commands/task/` | `commands/rail/` |
| `skills/task-do/` | `skills/rail-do/` |
| `Claude Code` | `your agent` / `the agent`（按上下文） |
| `claude`（泛指 Claude 平台） | `agent` |

**不动的内容：**
- `task-workflow/` 运行时目录名（功能性名称）
- `~/.claude/` 安装路径（文件系统约束）
- `archive/` 下的历史文件
- `workflow-runtime.ts` 文件名（向后兼容 shim）
## 关键决策
- **命令去冒号**：`/raildo` 而非 `/rail:do`——减少输入，且 Claude Code 不需要冒号也能识别 command
- **Skill 目录改名**：`skills/task-do/` → `skills/rail-do/`，skill name 也改，因为 Claude Code 通过目录名和 frontmatter name 双重发现 skill
- **README 用 "agent" 替代 "Claude Code"**：在描述性文字中泛化为 agent，在安装步骤中保留 `~/.claude/` 路径（因为那是实际安装位置）
- **运行时目录保持 `task-workflow/`**：它描述的是功能（任务工作流），不是品牌。改名会级联影响所有路径引用，收益为零
## 风险
- **命令改名后旧命令失效**：用户若已安装旧版，升级后 `/task:plan` 不再可用。缓解：在 README 顶部显著标注 breaking change
- **Skill 改名后 task-do 不可用**：同上，旧 skill 被新 skill 替代
- **遗漏引用**：55 个文件含旧引用，可能漏改。缓解：最后一步全仓库 grep 验证零残留
