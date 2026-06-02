import { describe, it } from "node:test";
import assert from "node:assert";
import { getRunnableTask, getParallelCandidates, getDeadlockDetails } from "../src/task-graph.js";
import type { TaskState, SubTask } from "../src/types.js";

function makeTask(id: string, desc: string, status: SubTask["status"] = "pending", deps?: string[], blockedBy?: string[]): SubTask {
  return { id, description: desc, status, deps, blockedBy };
}

function makeState(tasks: SubTask[]): TaskState {
  return {
    id: "test",
    status: "pending",
    tasks,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    lastCheckpoint: 0,
  };
}

describe("getRunnableTask", () => {
  it("returns the first pending task with no deps", () => {
    const state = makeState([
      makeTask("a", "Task A"),
      makeTask("b", "Task B"),
    ]);
    const result = getRunnableTask(state);
    assert.ok(result && "task" in result);
    assert.strictEqual(result.task.id, "a");
    assert.strictEqual(result.index, 0);
  });

  it("returns done:true when all tasks complete", () => {
    const state = makeState([
      makeTask("a", "Task A", "done"),
      makeTask("b", "Task B", "skipped"),
    ]);
    const result = getRunnableTask(state);
    assert.ok(result && "done" in result);
  });

  it("skips task with unmet dependency", () => {
    const state = makeState([
      makeTask("a", "Task A", "pending"),
      makeTask("b", "Task B", "pending", ["a"]),
    ]);
    const result = getRunnableTask(state);
    assert.ok(result && "task" in result);
    assert.strictEqual(result.task.id, "a");
  });

  it("returns blocked task after dep completes", () => {
    const state = makeState([
      makeTask("a", "Task A", "done"),
      makeTask("b", "Task B", "pending", ["a"]),
    ]);
    const result = getRunnableTask(state);
    assert.ok(result && "task" in result);
    assert.strictEqual(result.task.id, "b");
  });

  it("returns null on deadlock (all pending but deps circular)", () => {
    const state = makeState([
      makeTask("a", "Task A", "pending", ["b"]),
      makeTask("b", "Task B", "pending", ["a"]),
    ]);
    const result = getRunnableTask(state);
    assert.strictEqual(result, null);
  });

  it("respects blockedBy", () => {
    const state = makeState([
      makeTask("a", "Task A", "pending"),
      makeTask("b", "Task B", "pending", [], ["a"]),
    ]);
    const result = getRunnableTask(state);
    assert.ok(result && "task" in result);
    assert.strictEqual(result.task.id, "a");
  });

  it("skips in_progress tasks", () => {
    const state = makeState([
      makeTask("a", "Task A", "in_progress"),
      makeTask("b", "Task B", "pending"),
    ]);
    const result = getRunnableTask(state);
    assert.ok(result && "task" in result);
    assert.strictEqual(result.task.id, "b");
  });

  it("handles skipped tasks as complete", () => {
    const state = makeState([
      makeTask("a", "Task A", "skipped"),
      makeTask("b", "Task B", "pending", ["a"]),
    ]);
    const result = getRunnableTask(state);
    assert.ok(result && "task" in result);
    assert.strictEqual(result.task.id, "b");
  });
});

describe("getParallelCandidates", () => {
  it("lists other unblocked pending tasks", () => {
    const state = makeState([
      makeTask("a", "Task A", "pending"),
      makeTask("b", "Task B", "pending"),
      makeTask("c", "Task C", "pending"),
    ]);
    const candidates = getParallelCandidates(state, 0);
    assert.strictEqual(candidates.length, 2);
    assert.strictEqual(candidates[0].id, "b");
    assert.strictEqual(candidates[1].id, "c");
  });

  it("excludes tasks blocked by the current one", () => {
    const state = makeState([
      makeTask("a", "Task A", "pending"),
      makeTask("b", "Task B", "pending", ["a"]),
      makeTask("c", "Task C", "pending", ["a", "b"]),
    ]);
    const candidates = getParallelCandidates(state, 0);
    assert.strictEqual(candidates.length, 0); // b and c both depend on a
  });

  it("excludes done tasks", () => {
    const state = makeState([
      makeTask("a", "Task A", "pending"),
      makeTask("b", "Task B", "done"),
      makeTask("c", "Task C", "pending"),
    ]);
    const candidates = getParallelCandidates(state, 0);
    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].id, "c");
  });
});

describe("getDeadlockDetails", () => {
  it("identifies in-progress and blocked tasks", () => {
    const state = makeState([
      makeTask("a", "Task A", "in_progress"),
      makeTask("b", "Task B", "pending", ["a"]),
    ]);
    const details = getDeadlockDetails(state);
    assert.deepStrictEqual(details.inProgress, ["a"]);
    assert.deepStrictEqual(details.blocked, ["b"]);
  });
});
