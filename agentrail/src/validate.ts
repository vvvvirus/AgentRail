import type { TaskState, ValidationResult } from "./types.js";

const ACTION_VERBS =
  /\b(add|create|remove|delete|update|modify|fix|implement|install|configure|set|run|build|test|deploy|refactor|extract|rename|move|copy|sync|merge|split|check|verify|validate|write|read|generate|convert|optimize|clean|replace|upgrade|downgrade|migrate|init|setup|teardown|audit|review|document|archive|restore|bump|release|lint|format|compress|encrypt|decrypt|hash|sign|parse|serialize|normalize|patch)\b/i;

export function validatePlan(state: TaskState): ValidationResult {
  const result: ValidationResult = {
    overall: "PASS",
    checks: {
      task_count: { pass: true, message: "" },
      deps_valid: { pass: true, message: "" },
      verify_coverage: { pass: true, message: "" },
      granularity: { pass: true, message: "" },
    },
  };

  const n = state.tasks.length;

  // 1. task_count
  if (n < 3) {
    result.checks.task_count = {
      pass: false,
      message: `Only ${n} tasks (minimum 3). May be under-planned.`,
    };
  } else if (n > 15) {
    result.checks.task_count = {
      pass: false,
      message: `${n} tasks (maximum 15). Consider grouping.`,
    };
  } else {
    result.checks.task_count = {
      pass: true,
      message: `${n} tasks in range [3-15].`,
    };
  }

  // 2. deps_valid
  const validIds = new Set(state.tasks.map((t) => t.id));
  const brokenDeps: string[] = [];
  for (const t of state.tasks) {
    for (const d of t.deps || []) {
      if (!validIds.has(d)) brokenDeps.push(`${t.id} → ${d}`);
    }
    for (const b of t.blockedBy || []) {
      if (!validIds.has(b)) brokenDeps.push(`${t.id} blockedBy ${b}`);
    }
  }
  if (brokenDeps.length > 0) {
    result.checks.deps_valid = {
      pass: false,
      message: `Broken references: ${brokenDeps.join(", ")}`,
    };
  } else {
    result.checks.deps_valid = {
      pass: true,
      message: "All dependency references valid.",
    };
  }

  // 3. verify_coverage
  const hasVerify = (state.verifyCommands || []).length > 0;
  if (!hasVerify) {
    result.checks.verify_coverage = {
      pass: false,
      message: "No verify commands configured. Add tests, lint, or typecheck.",
    };
  } else {
    const names = (state.verifyCommands || []).map((c) => c.name).join(", ");
    result.checks.verify_coverage = {
      pass: true,
      message: `Verify commands: ${names}`,
    };
  }

  // 4. granularity
  const vagueDescriptions: string[] = [];
  for (const t of state.tasks) {
    if (t.description.length > 50 && !ACTION_VERBS.test(t.description)) {
      vagueDescriptions.push(t.id);
    }
  }
  if (vagueDescriptions.length > 0) {
    result.checks.granularity = {
      pass: false,
      message: `Vague descriptions (no action verb): ${vagueDescriptions.join(", ")}`,
    };
  } else {
    result.checks.granularity = {
      pass: true,
      message: "All task descriptions clear and actionable.",
    };
  }

  // Determine overall verdict
  const hasBlock = !result.checks.deps_valid.pass;
  const hasWarn =
    !result.checks.task_count.pass ||
    !result.checks.verify_coverage.pass ||
    !result.checks.granularity.pass;
  if (hasBlock) result.overall = "BLOCK";
  else if (hasWarn) result.overall = "WARN";

  return result;
}
