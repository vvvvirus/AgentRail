import type { TaskState, SubTask } from "./types.js";

export interface RunnableResult {
  task: SubTask;
  index: number;
}

function isComplete(t: SubTask): boolean {
  return t.status === "done" || t.status === "skipped";
}

export function getRunnableTask(
  state: TaskState,
): RunnableResult | { done: true } | null {
  const doneIds = new Set(
    state.tasks.filter(isComplete).map((t) => t.id),
  );

  for (let i = 0; i < state.tasks.length; i++) {
    const task = state.tasks[i];
    if (task.status !== "pending") continue;

    const unmetDeps = (task.deps || []).filter((d) => !doneIds.has(d));
    if (unmetDeps.length > 0) continue;

    const blocking = (task.blockedBy || []).filter((b) => !doneIds.has(b));
    if (blocking.length > 0) continue;

    return { task, index: i };
  }

  const allDone = state.tasks.every((t) => isComplete(t));
  if (allDone) return { done: true };

  return null;
}

export function getParallelCandidates(state: TaskState, currentIndex: number): SubTask[] {
  const doneIds = new Set(
    state.tasks.filter(isComplete).map((t) => t.id),
  );

  const candidates: SubTask[] = [];
  for (let i = 0; i < state.tasks.length; i++) {
    if (i === currentIndex) continue;
    const task = state.tasks[i];
    if (task.status !== "pending") continue;

    const unmetDeps = (task.deps || []).filter((d) => !doneIds.has(d));
    if (unmetDeps.length > 0) continue;

    const blocking = (task.blockedBy || []).filter((b) => !doneIds.has(b));
    if (blocking.length > 0) continue;

    candidates.push(task);
  }

  return candidates;
}

export function getDeadlockDetails(state: TaskState): { inProgress: string[]; blocked: string[] } {
  const inProgress = state.tasks
    .filter((t) => t.status === "in_progress")
    .map((t) => t.id);
  const blocked = state.tasks
    .filter((t) => t.status === "pending" && ((t.deps && t.deps.length > 0) || (t.blockedBy && t.blockedBy.length > 0)))
    .map((t) => t.id);
  return { inProgress, blocked };
}
