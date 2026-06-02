---
name: "Rail: Do"
description: Execute tasks from a planned task - reads artifacts and works through the checklist
category: Workflow
tags: [workflow, rail]
---

Execute tasks from a planned task.

**Input**: Optionally specify a task name (e.g., `/raildo organize-photos`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available tasks.

**Steps**

Use the **Skill tool** to invoke `rail-do` with the task name as context.

The skill will:
1. Read proposal.md, design.md, tasks.md, and log.md
2. Show current progress and last session summary
3. Write session start entry to log.md
4. Loop through pending tasks, executing each one
5. Mark tasks complete as they're done
6. Write session end to log.md on completion or blocker
7. Suggest `/raillog` to checkpoint for other pauses
8. Suggest archive when all tasks are complete
