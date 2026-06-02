# 任务清单：AgentRail 改名
## 前置
- [x] 创建 `commands/rail/` 和 `skills/rail-do/` 目录
## 执行
- [x] 重命名 command 文件：6 个文件从 `commands/task/` 移到 `commands/rail/`，更新 frontmatter name/description 和所有内部 `/task:xxx` → `/railxxx` 引用
- [x] 重命名 skill：`skills/task-do/` → `skills/rail-do/`，更新 SKILL.md 中 name、description、所有 command 引用和 runtime 路径
- [x] 更新 package.json：name "claude-task-workflow" → "agent-rail"，bin 名同步更新
- [x] 更新 cli.ts 和 src/*.ts：帮助文本中的项目名，如有 Claude 特定注释一并改
- [x] 更新安装脚本：install.sh 和 install.ps1 中的目录名、echo 消息
- [x] 重写 README.md 和 README.zh-CN.md：标题、描述、所有段落中的项目名/命令名/Claude 引用
- [x] 全仓库 grep 残留检查：确认无 `/task:plan`、`/task:do`、`Claude Task Workflow`、`task-do`（skill 引用）残留在非归档文件中
## 验证
- [x] `grep -r "Claude Task Workflow" --include="*.md" --include="*.ts" --include="*.json" --include="*.sh" --include="*.ps1" | grep -v archive` 返回空
- [x] `grep -r "/task:" --include="*.md" | grep -v archive` 返回空
- [x] `ls commands/rail/` 有 6 个 .md 文件
- [x] `ls skills/rail-do/` 有 SKILL.md
