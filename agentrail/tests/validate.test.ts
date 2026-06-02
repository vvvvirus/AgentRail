import { describe, it } from "node:test";
import assert from "node:assert";
import { validatePlan } from "../src/validate.js";
import type { TaskState, SubTask } from "../src/types.js";

function makeTask(id: string, desc: string): SubTask {
  return { id, description: desc, status: "pending" };
}

function makeState(tasks: SubTask[], verifyCommands?: TaskState["verifyCommands"]): TaskState {
  return {
    id: "test",
    status: "pending",
    tasks,
    verifyCommands,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    lastCheckpoint: 0,
  };
}

describe("validatePlan — task_count", () => {
  it("flags < 3 tasks as under-planned", () => {
    const state = makeState([
      makeTask("a", "Do thing A"),
      makeTask("b", "Do thing B"),
    ]);
    const result = validatePlan(state);
    assert.strictEqual(result.overall, "WARN");
    assert.strictEqual(result.checks.task_count.pass, false);
  });

  it("flags > 15 tasks as over-planned", () => {
    const tasks = Array.from({ length: 16 }, (_, i) =>
      makeTask(`t${i}`, `Do task ${i}`));
    const state = makeState(tasks);
    const result = validatePlan(state);
    assert.strictEqual(result.checks.task_count.pass, false);
  });

  it("passes 5 tasks", () => {
    const tasks = Array.from({ length: 5 }, (_, i) =>
      makeTask(`t${i}`, `Do task ${i}`));
    const state = makeState(tasks);
    const result = validatePlan(state);
    assert.strictEqual(result.checks.task_count.pass, true);
  });
});

describe("validatePlan — deps_valid", () => {
  it("flags broken dependency references", () => {
    const tasks: SubTask[] = [
      { id: "a", description: "Task A", status: "pending", deps: ["nonexistent"] },
    ];
    const state = makeState(tasks);
    const result = validatePlan(state);
    assert.strictEqual(result.overall, "BLOCK");
    assert.strictEqual(result.checks.deps_valid.pass, false);
  });

  it("flags broken blockedBy references", () => {
    const tasks: SubTask[] = [
      { id: "a", description: "Task A", status: "pending", blockedBy: ["ghost"] },
    ];
    const state = makeState(tasks);
    const result = validatePlan(state);
    assert.strictEqual(result.overall, "BLOCK");
  });

  it("passes with valid deps", () => {
    const state = makeState([
      makeTask("a", "Task A"),
      makeTask("b", "Task B"),
    ]);
    const result = validatePlan(state);
    assert.strictEqual(result.checks.deps_valid.pass, true);
  });
});

describe("validatePlan — verify_coverage", () => {
  it("flags missing verify commands", () => {
    const tasks = Array.from({ length: 5 }, (_, i) =>
      makeTask(`t${i}`, `Do task ${i}`));
    const state = makeState(tasks);
    const result = validatePlan(state);
    assert.strictEqual(result.overall, "WARN");
    assert.strictEqual(result.checks.verify_coverage.pass, false);
  });

  it("passes when verify commands present", () => {
    const tasks = Array.from({ length: 5 }, (_, i) =>
      makeTask(`t${i}`, `Do task ${i}`));
    const state = makeState(tasks, [{ name: "tests", command: "npm test" }]);
    const result = validatePlan(state);
    assert.strictEqual(result.checks.verify_coverage.pass, true);
  });
});

describe("validatePlan — granularity", () => {
  it("flags descriptions over 50 chars without action verb", () => {
    const tasks: SubTask[] = [{
      id: "big-thing",
      description: "这是一个纯粹描述性的文本内容它只是用来解释某件事情的前因后果以及来龙去脉而不包含任何具体的可执行的动作词汇所以长度超过五十个字符",
      status: "pending",
    }];
    const state = makeState(tasks);
    const result = validatePlan(state);
    assert.strictEqual(result.checks.granularity.pass, false);
  });

  it("passes short descriptions", () => {
    const state = makeState([
      makeTask("a", "Fix the login bug"),
    ]);
    const result = validatePlan(state);
    assert.strictEqual(result.checks.granularity.pass, true);
  });

  it("passes long descriptions with action verb", () => {
    const state = makeState([
      makeTask("a", "Implement the new authentication middleware for all API routes with JWT validation"),
    ]);
    const result = validatePlan(state);
    assert.strictEqual(result.checks.granularity.pass, true); // "Implement" is a verb
  });
});

describe("validatePlan — overall verdict", () => {
  it("returns PASS when all checks pass", () => {
    const tasks = Array.from({ length: 5 }, (_, i) =>
      makeTask(`t${i}`, `Fix thing ${i}`));
    const state = makeState(tasks, [{ name: "tests", command: "npm test" }]);
    const result = validatePlan(state);
    assert.strictEqual(result.overall, "PASS");
  });

  it("BLOCK takes priority over WARN", () => {
    const tasks: SubTask[] = [
      { id: "a", description: "Task A", status: "pending", deps: ["bad-ref"] },
      { id: "b", description: "Task B", status: "pending" },
    ];
    const state = makeState(tasks);
    const result = validatePlan(state);
    assert.strictEqual(result.overall, "BLOCK");
  });
});
