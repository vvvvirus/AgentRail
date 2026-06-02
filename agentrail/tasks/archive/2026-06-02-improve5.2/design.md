# 设计：审计问题修复

## 策略
逐项判定 severity × effort，只修复高价值低成本的项。CRITICAL/HIGH 且 effort 低的优先修；有意设计的记录原因。

## 16+1 项判定

### 修复（11 项）

| # | 问题 | 方案 |
|---|------|------|
| 2 | shebang `#!/usr/bin/env npx tsx` 无效 | 改为 `#!/usr/bin/env -S npx tsx`。实际调用始终 `npx tsx cli.ts`，shebang 仅作文档用途。 |
| 3 | verify-runner.ts 子目录 Go/Rust 路径重复 | 当 subdir 非空时 cwd 已设到子目录，命令本身不再带子目录前缀：`cargo test` / `go test ./...`。 |
| 6 | verify.md fallback 用空 `$RT` 执行无效命令 | 改为：`$RT` 为空时跳过 runtime，用 AskUserQuestion 收集验证命令后直接执行。 |
| 8 | plan.md 提自定义 verify 但无 CLI 命令 | 用 AskUserQuestion 收集命令后，手动写入 task-state.json 的 verifyCommands 数组。plan.md 步骤 3 补充具体操作说明。 |
| 13 | `blockedBy` 类型存在但 CLI 无入口 | `cmdInit` 新增 `--blocked-by=` flag，格式同 `--deps=`。 |
| 16 | install.sh 接受位置参数，install.ps1 不接受 | install.ps1 增加位置参数支持。 |
| 19 | cli.ts main() 中 `catch (e: unknown)` 检查 SyntaxError — 永不会触发 | 移除无用的 SyntaxError 检查，简化为通用错误日志。 |
| 17 | plan.md 模板头硬编码中文（`## 目标`、`## 动机`…） | 模板头改为英文，加注 "match headers to the user's language"。Agent 根据用户语言自动翻译。 |
| 18 | list.md 硬编码 `grep "## 目标"` | 改为 `grep -m1 "^## "` 取第一个 H2 标题，与语言无关。 |
| — | package.json 缺 test 脚本，verify-runner 检测不到 | `agentrail/package.json` 添加 `"test": "npx tsx --test tests/task-graph.test.ts tests/validate.test.ts"`。 |

### 有意设计 / 不修（5 项）

| # | 问题 | 原因 |
|---|------|------|
| 7 | do.md 是 thin wrapper | 分层设计：command 提供入口，skill 持有执行逻辑。 |
| 9 | KG 路径未在 README 结构图中 | 运行时产物，非项目源文件。 |
| 10 | package-lock.json gitignored | 有意：不锁 tsx 版本。 |
| 12 | 未提交状态 | 用户自行决定。 |
| 14 | find "$HOME" 方案 | 用户选方案 A，零 agent 枚举优于完美确定性。 |
| 20 | archive 下开发任务 | 用户历史记录。 |

## 风险
- **#3 verify-runner 修改未经测试覆盖**：手动验证命令生成逻辑。
- **#13 blockedBy flag**：确保与 `--deps` 格式一致，避免歧义。
