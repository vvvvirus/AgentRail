# 任务清单：CWD 解耦
## 前置
- [x] 阅读 `workflow-runtime.ts` 中所有引用 `PROJECT_ROOT` 的位置
## 执行
- [x] 在 `workflow-runtime.ts` 的 `main()` 中解析 `--project-root=<path>` 参数，赋值给 `PROJECT_ROOT`
- [x] 验证：不传 `--project-root` 时行为不变（fallback `process.cwd()`）
- [x] 修改 task-plan skill 中调用 runtime 的命令，传入 `--project-root`
- [x] 修改 task-do skill 中调用 runtime 的命令，传入 `--project-root`
- [x] 修改 task-log skill 中调用 runtime 的命令，传入 `--project-root`
- [x] 修改 task-done skill 中调用 runtime 的命令，传入 `--project-root`
- [x] 测试：在不同 CWD 下运行 `init`，确认文件写入预期目录
## 验证
- [x] 在 `D:\claude\webvideo` 下执行 `npx tsx workflow-runtime.ts init test --project-root=D:\Projects\s2.cpp`，确认 runtime 文件写入 `D:\Projects\s2.cpp\task-workflow\tasks\test\`
