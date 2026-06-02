#!/usr/bin/env -S npx tsx
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { TaskState } from "./src/types.js";
import { getRunnableTask, getParallelCandidates, getDeadlockDetails } from "./src/task-graph.js";
import { validatePlan } from "./src/validate.js";
import { createCheckpoint, writeCheckpointFile, loadCheckpoint, listCheckpoints, getLatestCheckpoint } from "./src/checkpoint.js";
import { detectVerifyCommands, runVerify } from "./src/verify-runner.js";
import { addService, queryService } from "./src/knowledge-graph.js";

function getProjectRoot(): string {
  const arg = process.argv.find((a) => a.startsWith("--project-root="));
  return arg ? arg.slice(15) : process.cwd();
}

const PROJECT_ROOT = getProjectRoot();
const TASKS_DIR = join(PROJECT_ROOT, "agentrail", "tasks");
const KG_PATH = join(PROJECT_ROOT, "runtime", "knowledge-graph.json");

function taskDir(name: string) { return join(TASKS_DIR, name); }
function statePath(name: string) { return join(TASKS_DIR, name, "runtime", "task-state.json"); }
function checkpointDir(name: string) { return join(TASKS_DIR, name, "runtime", "checkpoints"); }

function loadState(name: string): TaskState {
  const p = statePath(name);
  if (!existsSync(p)) die(`Task "${name}" not found or not initialized. Run "init" first.`);
  return JSON.parse(readFileSync(p, "utf-8"));
}

function saveState(name: string, state: TaskState): void {
  state.updated = new Date().toISOString();
  writeFileSync(statePath(name), JSON.stringify(state, null, 2) + "\n");
}

function die(msg: string): never {
  console.error(JSON.stringify({ error: msg }));
  process.exit(1);
}

function ok(data: Record<string, unknown>): void {
  console.log(JSON.stringify(data));
  process.exit(0);
}

function parseList(arg?: string): string[] {
  if (!arg || arg === "") return [];
  return [...new Set(arg.split(",").map((s) => s.trim()).filter(Boolean))];
}

function requireArg(args: string[], index: number, name: string): string {
  const val = args[index];
  if (!val) die(`Missing required argument: ${name}`);
  return val;
}

function cmdInit(name: string, taskList?: string, deps?: string, blockedBy?: string): void {
  const dir = taskDir(name);
  const cpDir = checkpointDir(name);
  const existingStatePath = statePath(name);

  if (existsSync(existingStatePath)) {
    const bakPath = existingStatePath + ".bak";
    writeFileSync(bakPath, readFileSync(existingStatePath, "utf-8"));
    console.error(JSON.stringify({ warning: `Reinitializing task "${name}" — existing state backed up to ${bakPath}` }));
  }

  mkdirSync(dir, { recursive: true });
  mkdirSync(cpDir, { recursive: true });

  const taskDescriptions = parseList(taskList);

  const depsMap: Record<number, number[]> = {};
  if (deps) {
    for (const entry of deps.split(" ")) {
      const colon = entry.indexOf(":");
      if (colon === -1) continue;
      const idx = parseInt(entry.slice(0, colon).trim());
      const depStr = entry.slice(colon + 1).trim();
      if (isNaN(idx)) continue;
      const parsedDeps = depStr.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
      if (idx < 0 || idx >= taskDescriptions.length) {
        console.error(JSON.stringify({ warning: `Dependency entry "${entry}" references out-of-range task index ${idx}, skipped.` }));
      } else if (parsedDeps.some((n) => n < 0 || n >= taskDescriptions.length)) {
        const bad = parsedDeps.filter((n) => n < 0 || n >= taskDescriptions.length);
        console.error(JSON.stringify({ warning: `Dependency entry "${entry}" references out-of-range dependency indices: ${bad.join(",")}, skipping bad deps.` }));
        depsMap[idx] = parsedDeps.filter((n) => n >= 0 && n < taskDescriptions.length);
      } else {
        depsMap[idx] = parsedDeps;
      }
    }
  }

  const blockedByMap: Record<number, number[]> = {};
  if (blockedBy) {
    for (const entry of blockedBy.split(" ")) {
      const colon = entry.indexOf(":");
      if (colon === -1) continue;
      const idx = parseInt(entry.slice(0, colon).trim());
      const byStr = entry.slice(colon + 1).trim();
      if (isNaN(idx)) continue;
      const parsedBy = byStr.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
      if (idx < 0 || idx >= taskDescriptions.length) {
        console.error(JSON.stringify({ warning: `Blocked-by entry "${entry}" references out-of-range task index ${idx}, skipped.` }));
      } else if (parsedBy.some((n) => n < 0 || n >= taskDescriptions.length)) {
        const bad = parsedBy.filter((n) => n < 0 || n >= taskDescriptions.length);
        console.error(JSON.stringify({ warning: `Blocked-by entry "${entry}" references out-of-range indices: ${bad.join(",")}, skipping bad entries.` }));
        blockedByMap[idx] = parsedBy.filter((n) => n >= 0 && n < taskDescriptions.length);
      } else {
        blockedByMap[idx] = parsedBy;
      }
    }
  }

  const seenIds = new Set<string>();
  const tasks = taskDescriptions.map((desc, i) => {
    let id = desc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/^-|-$/g, "") || `task-${i}`;
    if (seenIds.has(id)) {
      let suffix = 2;
      while (seenIds.has(`${id}-${suffix}`)) suffix++;
      id = `${id}-${suffix}`;
    }
    seenIds.add(id);
    const depIndices = depsMap[i] || [];
    const depIds = depIndices.map((di) => {
      const depDesc = taskDescriptions[di];
      const depId = depDesc ? depDesc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "";
      return depId || `task-${di}`;
    });
    const byIndices = blockedByMap[i] || [];
    const byIds = byIndices.map((bi) => {
      const byDesc = taskDescriptions[bi];
      const byId = byDesc ? byDesc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "";
      return byId || `task-${bi}`;
    });
    return { id, description: desc, status: "pending" as const, deps: depIds, blockedBy: byIds.length > 0 ? byIds : undefined };
  });

  const state: TaskState = {
    id: name,
    status: "pending",
    tasks,
    verifyCommands: detectVerifyCommands(PROJECT_ROOT),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    lastCheckpoint: 0,
  };

  writeFileSync(statePath(name), JSON.stringify(state, null, 2) + "\n");
  ok({ status: "created", task: name, tasks_count: tasks.length });
}

function cmdNext(name: string): void {
  const state = loadState(name);
  const result = getRunnableTask(state);

  if (!result) {
    const { inProgress, blocked } = getDeadlockDetails(state);
    if (inProgress.length > 0 && blocked.length > 0) {
      die(`No runnable tasks. ${inProgress.length} task(s) in progress: ${inProgress.join(", ")}. Complete them first.`);
    }
    die("No runnable tasks found. Possible deadlock — check dependencies.");
  }

  if ("done" in result) {
    ok({ done: true, message: "All tasks complete" });
  } else {
    const candidates = getParallelCandidates(state, result.index);
    ok({ task: result.task, index: result.index, parallel_candidates: candidates });
  }
}

function cmdStepDone(name: string, stepIndex: number, artifacts?: string): void {
  const state = loadState(name);
  if (stepIndex < 0 || stepIndex >= state.tasks.length) {
    die(`Step index ${stepIndex} out of range (0-${state.tasks.length - 1}).`);
  }
  state.tasks[stepIndex].status = "done";
  if (artifacts) state.tasks[stepIndex].artifacts = parseList(artifacts);
  saveState(name, state);
  ok({ step: state.tasks[stepIndex].id, index: stepIndex, status: "done" });
}

function cmdComplete(name: string): void {
  const state = loadState(name);
  state.status = state.checks && Object.entries(state.checks)
    .filter(([k]) => k !== "lastRun")
    .every(([, v]) => v === true)
    ? "verified" : "done";
  for (const t of state.tasks) {
    if (t.status === "in_progress") t.status = "done";
  }
  saveState(name, state);
  ok({ status: state.status, checks: state.checks || {} });
}

function cmdStatus(name: string): void {
  const state = loadState(name);
  const runnable = getRunnableTask(state);
  ok({ ...state, _runnable: runnable });
}

function cmdVerify(name: string): void {
  const state = loadState(name);
  const cmds = state.verifyCommands || [];
  if (cmds.length === 0) {
    ok({ passed: false, checks: {}, message: "No verify commands configured — run /railplan to add them" });
    return;
  }
  const checks: Record<string, boolean> = {};
  let allPassed = true;
  for (const cmd of cmds) {
    const result = runVerify(cmd, PROJECT_ROOT);
    checks[cmd.name] = result.passed;
    if (!result.passed) allPassed = false;
    console.error(JSON.stringify({ check: cmd.name, command: cmd.command, passed: result.passed, output: result.output.slice(0, 500) }));
  }
  state.checks = { ...checks, lastRun: new Date().toISOString() };
  saveState(name, state);
  ok({ passed: allPassed, checks: state.checks });
}

function cmdCheckpoint(name: string, step: string, files?: string, artifacts?: string): void {
  const state = loadState(name);
  const checkpoint = createCheckpoint(name, step, state, parseList(files), artifacts ? parseList(artifacts) : undefined);
  writeCheckpointFile(checkpointDir(name), checkpoint);
  state.lastCheckpoint = checkpoint.index;
  saveState(name, state);
  ok({ checkpoint: `checkpoint-${checkpoint.index}.json`, index: checkpoint.index });
}

function cmdCheckpointList(name: string): void {
  const files = listCheckpoints(checkpointDir(name));
  ok({ checkpoints: files, latest: files[0] || null });
}

function cmdCheckpointRead(name: string, index: number): void {
  if (isNaN(index)) die("Checkpoint index must be a valid number.");
  if (!existsSync(`${checkpointDir(name)}/checkpoint-${index}.json`)) {
    die(`Checkpoint ${index} not found for task "${name}".`);
  }
  const cp = loadCheckpoint(checkpointDir(name), index);
  ok(cp);
}

function cmdNextCheckpoint(name: string): void {
  const latest = getLatestCheckpoint(checkpointDir(name));
  if (!latest) {
    ok({ checkpoint: null, message: "No checkpoints found" });
  } else {
    ok({ checkpoint: latest.file, data: latest.data });
  }
}

function cmdValidate(name: string): void {
  const state = loadState(name);
  const result = validatePlan(state);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.overall === "PASS" ? 0 : result.overall === "WARN" ? 1 : 2);
}

function cmdKgAdd(service: string, dependsOn?: string, usedBy?: string): void {
  const added = addService(KG_PATH, service, dependsOn, usedBy);
  ok({ service, added });
}

function cmdKgQuery(service?: string): void {
  const result = queryService(KG_PATH, service);
  if (!result) die(`Service "${service}" not found in knowledge graph.`);
  ok(service ? { service, ...result } : { ...result });
}

function main(): void {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd) {
    die("Usage: agent-rail <command> [args...]\nCommands: init, next, step-done, verify, validate, checkpoint, complete, status, checkpoints, checkpoint-read, next-checkpoint, kg-add, kg-query");
  }
  try {
    switch (cmd) {
      case "init": {
        const name = requireArg(args, 1, "task-name");
        cmdInit(name,
          args.find((a) => a.startsWith("--tasks="))?.slice(8),
          args.find((a) => a.startsWith("--deps="))?.slice(7),
          args.find((a) => a.startsWith("--blocked-by="))?.slice(13));
        break;
      }
      case "next": cmdNext(requireArg(args, 1, "task-name")); break;
      case "verify": cmdVerify(requireArg(args, 1, "task-name")); break;
      case "checkpoint": {
        const name = requireArg(args, 1, "task-name");
        cmdCheckpoint(name, requireArg(args, 2, "step-name"),
          args.find((a) => a.startsWith("--files="))?.slice(8),
          args.find((a) => a.startsWith("--artifacts="))?.slice(12));
        break;
      }
      case "checkpoints": cmdCheckpointList(requireArg(args, 1, "task-name")); break;
      case "checkpoint-read":
        cmdCheckpointRead(requireArg(args, 1, "task-name"), parseInt(requireArg(args, 2, "checkpoint-index")));
        break;
      case "next-checkpoint": cmdNextCheckpoint(requireArg(args, 1, "task-name")); break;
      case "validate": cmdValidate(requireArg(args, 1, "task-name")); break;
      case "step-done":
        cmdStepDone(requireArg(args, 1, "task-name"), parseInt(requireArg(args, 2, "step-index")),
          args.find((a) => a.startsWith("--artifacts="))?.slice(12));
        break;
      case "complete": cmdComplete(requireArg(args, 1, "task-name")); break;
      case "status": cmdStatus(requireArg(args, 1, "task-name")); break;
      case "kg-add": {
        cmdKgAdd(requireArg(args, 1, "service-name"),
          args.find((a) => a.startsWith("--depends-on="))?.slice(13),
          args.find((a) => a.startsWith("--used-by="))?.slice(10));
        break;
      }
      case "kg-query": cmdKgQuery(args[1]); break;
      default:
        die(`Unknown command: ${cmd}\nCommands: init, next, step-done, verify, validate, checkpoint, complete, status, checkpoints, checkpoint-read, next-checkpoint, kg-add, kg-query`);
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    die(err.message || String(e));
  }
}

main();
