# 任务清单：improve5

## 前置
- [x] 升级 package.json 版本号到 2.5.0

## 执行
- [x] 拆分 runtime 单文件为模块化结构 — src/ (task-graph, checkpoint, verify-runner, validate, knowledge-graph, types) + cli.ts 薄壳
- [x] 为 DAG 调度的 getRunnableTask 和 validate 的 4 项检查添加单元测试 (node:test, 放在 tests/)
- [x] 在 next 命令中实现并行提示 — 输出中追加 parallel_candidates 字段
- [x] KG 自动推断集成到 /task:done — 从 checkpoint artifacts 提取候选服务名，自动调 kg-add
- [x] 添加 bin 入口到 package.json + 精简所有 command 文件中的 npx tsx 调用为 npx task-workflow
- [x] 更新 README.zh-CN.md 和 README.md — 版本号、模块结构、测试说明、并行提示、KG 用法

## 验证
- [ ] 模块拆分后 `npx task-workflow validate improve5` 正常工作
- [ ] `node --test task-workflow/tests/` 全部通过
- [ ] `npx task-workflow next improve5` 输出含 `parallel_candidates` 字段
- [ ] /task:done 归档时能自动识别并记录 KG
