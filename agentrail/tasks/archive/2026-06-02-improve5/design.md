# 设计：improve5

## 策略
先拆单文件为模块（不改变行为），再在模块上叠加新功能（并行提示、KG 自动推断），最后加 bin 入口、测试、文档。

## 关键决策

### 1. 模块拆分
```
task-workflow/
├── src/
│   ├── task-graph.ts       ← getRunnableTask, 死锁检测, 并行候选
│   ├── checkpoint.ts        ← 检查点读写 + 列举
│   ├── verify-runner.ts     ← 验证命令执行 + detectVerifyCommands
│   ├── validate.ts          ← 4 项确定性校验
│   ├── knowledge-graph.ts   ← KG 增删查
│   └── types.ts             ← 共享 type/interface 定义
├── cli.ts                   ← 参数解析 + 路由到各模块, ~60 行
├── tests/
│   ├── task-graph.test.ts   ← DAG 调度 + 并行候选
│   └── validate.test.ts     ← 校验逻辑
├── package.json             ← 新增 "bin" 字段
└── tsconfig.json
```
模块间依赖：
- types.ts 无依赖
- 所有 src/* 依赖 types.ts
- 模块之间互不引用（除 knowledge-graph 无调用方，checkpoint 被 cli 引用）
- cli.ts 依赖所有模块

### 2. Bin 入口
`package.json` 加 `"bin": { "task-workflow": "./cli.ts" }`。
安装后用户执行 `npx task-workflow validate <name>`，等价于 `npx tsx cli.ts validate <name>`。
command 文件从 `npx tsx ~/.claude/task-workflow/workflow-runtime.ts validate <name> --project-root=<PROJECT_ROOT>` 精简为 `npx task-workflow validate <name>`。

### 3. 测试方式
`task-graph.ts` 导出纯函数 `getRunnableTask(state: TaskState): ...`，
`validate.ts` 导出 `validatePlan(state: TaskState): ValidationResult`。
测试文件 import 后直接调用，传 mock `TaskState`。不走子进程。

### 4. 并行提示
`getRunnableTask` 不改变返回值，新增导出函数 `getParallelCandidates(state: TaskState): SubTask[]`。
cli `next` 命令在结果中追加 `parallel_candidates` 数组。
向后兼容：旧调用方忽略新字段。

### 5. KG 自动推断
`/task:done` 步骤 3 改为：
- 读取最新 checkpoint 的 `artifacts` + `files_changed`
- 提取文件路径中的顶级目录名作为候选 service（如 `src/auth/handler.ts` → `src`，去掉 `.` 开头和 `node_modules`）
- 列出候选 → 用户 y/n 确认 → 自动调 `kg-add --depends-on`（depends-on 手动选或留空）
- 不需要用户手打服务名

## 风险
- 拆分时改出 bug → 跑一遍 validate + 手动检查各命令能运行
- bin 入口路径问题 → 验证 `npx task-workflow validate improve5` 能跑
- node:test 兼容性 → 只测纯函数，不依赖 Node 版本差异
