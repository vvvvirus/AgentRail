# 设计：轻量级增强
## 策略
两个改动都是**增量式、可选、向后兼容**的。核心思路：给现有的 JSON schema 加字段，给 runtime 加一个独立命令。不改现有流程。
## 关键决策
- **Artifacts 用 `string[]` 而非复杂对象**：只存文件路径列表，足够让 Reviewer 和后续任务定位产物。不需要 hash/timestamps — 那是 Git 的职责。
- **Checkpoint artifacts 与 SubTask artifacts 分开**：SubTask.artifacts 在执行时通过 `step-done --artifacts=` 写入（实际产出），Checkpoint.artifacts 在 checkpoint 时通过 `--artifacts=` 写入（当前快照）。
- **`validate` 作为独立命令而非 plan 子步骤**：任何时候都能跑，不依赖 plan 流程。输出结构化 JSON + 标准 exit code（0=PASS / 1=WARN / 2=BLOCK），可被脚本调用。
- **4 项检查固定不变**：task_count（3-15）、deps_valid（所有依赖引用存在）、verify_coverage（至少一个 verify command 或验证步骤）、granularity（无模糊描述）。
## 风险
- **字段膨胀**：每加一个字段就多一点维护成本。缓解：所有新字段都是 optional，`[]` 默认值，不影响旧代码路径。
