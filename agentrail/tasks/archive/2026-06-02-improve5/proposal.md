# improve5 — 项目架构夯实

## 目标
不堆功能，修复锐评中暴露的全部可落地缺陷：模块化拆分、测试覆盖、并行提示落地、KG 可用化、接口精简。

## 动机
上轮审查暴露的问题按严重程度排序：
- 700 行单文件不能叫 Runtime — 需要模块化拆分，让名字和内部结构匹配
- 零测试 — 核心调度和校验逻辑没有任何自动化验证
- "并行提示"存在于文案不存在于代码 — 实现它
- Knowledge Graph 虽有 /task:done 调用路径但实际无法被主动填写 — 改成从 artifacts 自动推断
- Runtime ↔ Command 接口是裸 npx tsx 字符串拼凑，每个命令文件重复 ~40 字符的咒语 — 加 bin 入口、删冗余 flag

## 范围

### 包含
- 版本号统一到 2.5.0
- 单文件拆成 src/ 5 模块 + cli.ts 薄壳（task-graph / checkpoint / verify-runner / validate / knowledge-graph）
- node:test 单元测试覆盖 task-graph + validate 纯函数
- next 命令输出 parallel_candidates
- /task:done 从 checkpoint artifacts 自动推断服务名并调用 kg-add
- package.json 添加 bin 入口，command 文件调用精简为 `npx task-workflow <cmd> <name>`
- README 中英文更新

### 不包含
- 事件循环 / 进程池 / 并行执行 — 项目定位就是单机顺序编排，承认边界
- CI/CD
- npx tsx 完全消失 — 开发时仍可用 tsx 直接跑，安装后走 bin

## 约束
- 零新运行依赖，测试用 Node 内置 `node:test`
- 不改变现有 CLI 子命令名称和参数（向后兼容）
---
## Completion Summary
- **Completed:** 2026-06-02
- **Result:** 7/7 tasks done. 704-line monolith split into 6 modules + thin CLI. 25 unit tests cover DAG + validation. Parallel hints and KG auto-detection implemented. All command files cleaned up.
- **Tasks:** 7/7 done
- **Verification:** 25/25 unit tests pass. Validate: WARN (project root has no test/lint scripts — tests live at task-workflow/tests/)
- **Deviations:** None. Parallel hints and bin cleanup tasks overlapped with module split — implemented in the same pass.
