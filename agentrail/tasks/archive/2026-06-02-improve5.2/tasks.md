# 任务清单：审计问题修复
## 执行
- [x] 修复 #2 shebang：`#!/usr/bin/env npx tsx` → `#!/usr/bin/env -S npx tsx`
- [x] 修复 #3 verify-runner.ts：子目录 Go/Rust 命令路径重复
- [x] 修复 #6 verify.md fallback：$RT 为空时跳过 runtime，用 AskUserQuestion
- [x] 修复 #8 plan.md：自定义 verify 命令的收集 + 写入 task-state.json 说明
- [x] 修复 #13 cli.ts cmdInit：新增 `--blocked-by=` CLI flag
- [x] 修复 #16 install.ps1：支持位置参数
- [x] 修复 #19 cli.ts main()：移除永不会触发的 SyntaxError catch
- [x] 修复 #17 plan.md 模板头：中文 → 英文 + "match user language" 注释
- [x] 修复 #18 list.md：`grep "## 目标"` → `grep -m1 "^## "`
- [x] agentrail/package.json 添加 `test` script
## 验证
- [x] `npx tsx --test agentrail/tests/*.test.ts` 全部通过
- [x] `npx tsx agentrail/cli.ts` 输出 usage
