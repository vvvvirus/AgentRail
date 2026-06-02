# 设计：修复安装脚本

## 策略

**目标目录结构：**
```
~/.claude/
  skills/                    ← Claude Code 发现 skill（不可移动）
    task-plan/SKILL.md
    task-do/SKILL.md
    task-done/SKILL.md
    task-log/SKILL.md
    task-list/SKILL.md
  commands/                  ← Claude Code 发现命令（不可移动）
    task/*.md
  task-workflow/             ← 新增：运行时文件集中于此
    workflow-runtime.ts
    package.json
    tsconfig.json
    node_modules/            ← npm install 后生成
```

skill 文件中所有 runtime 调用从 `npx tsx workflow-runtime.ts` 改为 `npx tsx ~/.claude/task-workflow/workflow-runtime.ts`。

## 关键决策

- **运行时集中到 `~/.claude/task-workflow/` 而非 scatter**：只有一个子目录，清爽。卸载只需 `rm -rf ~/.claude/task-workflow/`。与 skills/commands 平级但不互相污染。
- **使用 `~` 而非 `$HOME` 或环境变量**：bash 中 `~` 始终展开为用户 home。Claude Code 的 shell 是 bash（见 CLAUDE.md），跨平台一致。
- **`npx tsx` 而非全局安装 tsx**：npx 自动解析 tsx 包（优先本地 node_modules，其次 npm registry）。install 后跑 `npm install` 在 `~/.claude/task-workflow/` 会缓存 tsx，后续调用零下载。
- **复制 package.json 用于依赖管理**：package.json 声明 tsx 的 devDependency 和 Node >= 18 的 engine 约束。用户可手动 `npm install` 更新依赖，不依赖 install 脚本。
- **tsconfig.json 也复制**：tsx 会读取 tsconfig.json 来配置 TypeScript 编译选项。现在的 tsconfig.json 很简单，但有备无患。

## 风险

- **`~` 在某些 CI 环境不展开**：CI 中 `$HOME` 更可靠，但本项目面向本地 Claude Code 使用，非 CI 场景。风险极低。
- **Windows Git Bash 中 `~` 指向不同路径**：Git Bash 的 `~` 映射到 `%USERPROFILE%`，与 Linux/macOS 行为一致。已验证。
- **skill 文件路径硬编码 `~`**：如果未来需要支持非 home 目录安装会麻烦。缓解：YAGNI——当前不需要。
