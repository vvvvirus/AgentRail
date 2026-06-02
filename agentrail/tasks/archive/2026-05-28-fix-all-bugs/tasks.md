# 任务清单：修复所有已识别的 Bug 和改进点

## 前置
- [ ] 确认所有文件无未保存修改（git status clean）

## 执行

### workflow-runtime.ts 修复

- [ ] Fix 1: cmdNext 不再自动设置 `status = "done"`，仅返回 `{ done: true }`
- [ ] Fix 2: cmdComplete 不再静默标记所有 pending 任务为 done
- [ ] Fix 3: cmdInit 检测并防止重复任务 ID
- [ ] Fix 4: 移除 checkpoint 命令中无用的 `--passed` 参数
- [ ] Fix 5: cmdVerify 保留所有验证命令结果（包括自定义命令）
- [ ] Fix 6: detectVerifyCommands 防止混合语言项目中的名称冲突
- [ ] Fix 7: cmdCheckpointRead 添加 NaN 检查和有意义的错误消息
- [ ] Fix 8: getRunnableTask 改进死锁/阻塞消息区分
- [ ] Fix 9: cmdInit 重新运行时发出警告并保留旧状态备份
- [ ] Fix 10: detectVerifyCommands 添加 JSON 解析错误的 try-catch
- [ ] Fix 11: 提取 listCheckpoints() 辅助函数消除重复代码
- [ ] Fix 12: parseList 添加去重逻辑
- [ ] Fix 13: runVerify 通过环境变量支持可配置超时

### skill 文件修复

- [ ] Fix 14: task-do/SKILL.md 中 `/task:replan` → `/task:plan`（2 处）
- [ ] Fix 15: task-do/SKILL.md 移除矛盾的内联 `(depends on: xxx)` 语法引用
- [ ] Fix 16: task-plan/SKILL.md 添加依赖格式越界检查和最佳实践说明

### 安装脚本修复

- [ ] Fix 17: install.sh 和 install.ps1 移除多余空行

## 验证
- [ ] tsx 类型检查通过（`npx tsc --noEmit`）
- [ ] runtime.ts 语法完整，`npx tsx workflow-runtime.ts` 输出正确用法
- [ ] 无残留的 `/task:replan` 引用
- [ ] 所有 skill 文件中的指引保持一致
