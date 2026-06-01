import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";

// ── Types ────────────────────────────────────────────────────

interface SubTask {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "done" | "skipped";
  deps?: string[];
  blockedBy?: string[];
}

interface CheckState {
  [key: string]: boolean | string | undefined;
  tests?: boolean;
  lint?: boolean;
  typecheck?: boolean;
  build?: boolean;
  lastRun?: string;
}

interface VerifyCommand {
  name: "tests" | "lint" | "typecheck" | "build" | "custom";
  command: string;
  cwd?: string; // subdirectory relative to PROJECT_ROOT
}

interface TaskState {
  id: string;
  status: "pending" | "in_progress" | "done" | "verified";
  tasks: SubTask[];
  checks?: CheckState;
  verifyCommands?: VerifyCommand[];
  created: string;
  updated: string;
  lastCheckpoint: number;
}

interface Checkpoint {
  task: string;
  step: string;
  index: number;
  timestamp: string;
  files_changed: string[];
  tasks_completed: number;
  total_tasks: number;
  checks: CheckState;
}

interface ServiceNode {
  depends_on: string[];
  used_by: string[];
  description?: string;
  updated: string;
}

interface KnowledgeGraph {
  services: Record<string, ServiceNode>;
  updated: string;
}

// ── Paths ────────────────────────────────────────────────────

function getProjectRoot(): string {
  const arg = process.argv.find((a) => a.startsWith("--project-root="));
  return arg ? arg.slice(15) : process.cwd();
}

const PROJECT_ROOT = getProjectRoot();
const TASKS_DIR = join(PROJECT_ROOT, "task-workflow", "tasks");
const KG_PATH = join(PROJECT_ROOT, "runtime", "knowledge-graph.json");

// ── Helpers ──────────────────────────────────────────────────

function taskDir(name: string) {
  return join(TASKS_DIR, name);
}
function statePath(name: string) {
  return join(TASKS_DIR, name, "runtime", "task-state.json");
}
function checkpointDir(name: string) {
  return join(TASKS_DIR, name, "runtime", "checkpoints");
}
function checkpointPath(name: string, index: number) {
  return join(checkpointDir(name), `checkpoint-${index}.json`);
}

function loadState(name: string): TaskState {
  const p = statePath(name);
  if (!existsSync(p)) {
    die(`Task "${name}" not found or not initialized. Run "init" first.`);
  }
  return JSON.parse(readFileSync(p, "utf-8"));
}

function saveState(name: string, state: TaskState): void {
  state.updated = new Date().toISOString();
  writeFileSync(statePath(name), JSON.stringify(state, null, 2) + "\n");
}

function loadKG(): KnowledgeGraph {
  if (!existsSync(KG_PATH)) {
    return { services: {}, updated: new Date().toISOString() };
  }
  return JSON.parse(readFileSync(KG_PATH, "utf-8"));
}

function saveKG(kg: KnowledgeGraph): void {
  kg.updated = new Date().toISOString();
  mkdirSync(dirname(KG_PATH), { recursive: true });
  writeFileSync(KG_PATH, JSON.stringify(kg, null, 2) + "\n");
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

function detectVerifyCommands(): VerifyCommand[] {
  const cwd = PROJECT_ROOT;
  const cmds: VerifyCommand[] = [];
  const seen = new Set<string>();

  function add(name: string, command: string, subdir?: string): void {
    if (seen.has(name)) return; // first project type wins
    seen.add(name);
    cmds.push({ name, command, cwd: subdir });
  }

  function scan(dir: string, subdir?: string): boolean {
    let found = false;

    if (existsSync(join(dir, "package.json"))) {
      found = true;
      try {
        const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
        const scripts = pkg.scripts || {};
        if (scripts.test) add("tests", "npm test", subdir);
        if (scripts.lint) add("lint", "npm run lint", subdir);
        if (scripts.typecheck || scripts.tsc) {
          add("typecheck", `npm run ${scripts.typecheck ? "typecheck" : "tsc"}`, subdir);
        }
        if (scripts.build) add("build", "npm run build", subdir);
      } catch {
        console.error(JSON.stringify({ warning: "Failed to parse package.json, skipping JS/TS verify commands" }));
      }
    }

    if (existsSync(join(dir, "Cargo.toml"))) {
      found = true;
      add("tests", subdir ? `cargo test --manifest-path ${subdir}/Cargo.toml` : "cargo test", subdir);
      add("lint", subdir ? `cargo clippy --manifest-path ${subdir}/Cargo.toml` : "cargo clippy", subdir);
      add("typecheck", subdir ? `cargo check --manifest-path ${subdir}/Cargo.toml` : "cargo check", subdir);
    }

    if (existsSync(join(dir, "pyproject.toml")) || existsSync(join(dir, "setup.py"))) {
      found = true;
      add("tests", "pytest", subdir);
      if (existsSync(join(dir, "pyproject.toml"))) {
        add("lint", "ruff check .", subdir);
      }
    }

    if (existsSync(join(dir, "go.mod"))) {
      found = true;
      add("tests", subdir ? `cd ${subdir} && go test ./...` : "go test ./...", subdir);
      add("lint", subdir ? `cd ${subdir} && golangci-lint run` : "golangci-lint run", subdir);
      add("typecheck", subdir ? `cd ${subdir} && go vet ./...` : "go vet ./...", subdir);
    }

    return found;
  }

  // Scan cwd first
  scan(cwd);

  // Then scan immediate subdirectories (1 level deep)
  try {
    const entries = readdirSync(cwd, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;
      if (entry.name === "node_modules") continue;
      scan(join(cwd, entry.name), entry.name);
    }
  } catch {
    // Permission errors — ignore
  }

  return cmds;
}

function runVerify(cmd: VerifyCommand): { passed: boolean; output: string } {
  const timeout = parseInt(process.env.VERIFY_TIMEOUT || "0") || 120_000;
  const workDir = cmd.cwd ? join(PROJECT_ROOT, cmd.cwd) : PROJECT_ROOT;
  try {
    const output = execSync(cmd.command, {
      cwd: workDir,
      timeout,
      encoding: "utf-8",
      stdio: "pipe",
    });
    return { passed: true, output: output.trim() };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return { passed: false, output: (err.stdout || "") + (err.stderr || err.message || "") };
  }
}

// ── DAG logic ────────────────────────────────────────────────

function getRunnableTask(state: TaskState): { task: SubTask; index: number } | { done: true } | null {
  const doneIds = new Set(
    state.tasks.filter((t) => t.status === "done" || t.status === "skipped").map((t) => t.id),
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

  const allDone = state.tasks.every((t) => t.status === "done" || t.status === "skipped");
  if (allDone) return { done: true };

  return null;
}

// ── Commands ─────────────────────────────────────────────────

function cmdInit(name: string, taskList?: string, deps?: string): void {
  const dir = taskDir(name);
  const rtDir = join(dir, "runtime");
  const cpDir = join(rtDir, "checkpoints");

  const existingStatePath = statePath(name);
  if (existsSync(existingStatePath)) {
    const bakPath = existingStatePath + ".bak";
    writeFileSync(bakPath, readFileSync(existingStatePath, "utf-8"));
    console.error(JSON.stringify({ warning: `Reinitializing task "${name}" — existing state backed up to ${bakPath}` }));
  }

  mkdirSync(dir, { recursive: true });
  mkdirSync(cpDir, { recursive: true });

  const taskDescriptions = parseList(taskList);

  // Parse dependency map. Format: "1:0 2:0,1"
  // Each entry is "task-index:dep-index[,dep-index]" (0-based).
  const depsMap: Record<number, number[]> = {};
  if (deps) {
    for (const entry of deps.split(" ")) {
      const colon = entry.indexOf(":");
      if (colon === -1) continue;
      const idx = parseInt(entry.slice(0, colon).trim());
      const depStr = entry.slice(colon + 1).trim();
      if (!isNaN(idx)) {
        const parsedDeps = depStr.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
        if (idx < 0 || idx >= taskDescriptions.length) {
          console.error(JSON.stringify({ warning: `Dependency entry "${entry}" references out-of-range task index ${idx} (valid: 0-${taskDescriptions.length - 1}), skipped.` }));
        } else if (parsedDeps.some((n) => n < 0 || n >= taskDescriptions.length)) {
          const bad = parsedDeps.filter((n) => n < 0 || n >= taskDescriptions.length);
          console.error(JSON.stringify({ warning: `Dependency entry "${entry}" references out-of-range dependency indices: ${bad.join(",")} (valid: 0-${taskDescriptions.length - 1}), skipping bad deps.` }));
          depsMap[idx] = parsedDeps.filter((n) => n >= 0 && n < taskDescriptions.length);
        } else {
          depsMap[idx] = parsedDeps;
        }
      }
    }
  }

  const seenIds = new Set<string>();
  const tasks: SubTask[] = taskDescriptions.map((desc, i) => {
    let id = desc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // Deduplicate: append suffix for colliding IDs
    if (seenIds.has(id)) {
      let suffix = 2;
      while (seenIds.has(`${id}-${suffix}`)) suffix++;
      id = `${id}-${suffix}`;
    }
    seenIds.add(id);
    const depIndices = depsMap[i] || [];
    const depIds = depIndices.map((di) => {
      const depDesc = taskDescriptions[di];
      return depDesc
        ? depDesc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : `task-${di}`;
    });
    return {
      id,
      description: desc,
      status: "pending" as const,
      deps: depIds,
    };
  });

  const state: TaskState = {
    id: name,
    status: "pending",
    tasks,
    verifyCommands: detectVerifyCommands(),
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
    const inProgress = state.tasks.filter((t) => t.status === "in_progress");
    const pendingWithDeps = state.tasks.filter((t) => t.status === "pending" && ((t.deps && t.deps.length > 0) || (t.blockedBy && t.blockedBy.length > 0)));
    if (inProgress.length > 0 && pendingWithDeps.length > 0) {
      die(`No runnable tasks. ${inProgress.length} task(s) in progress: ${inProgress.map((t) => t.id).join(", ")}. Complete them first.`);
    }
    die("No runnable tasks found. Possible deadlock — check dependencies.");
  }

  if ("done" in result) {
    ok({ done: true, message: "All tasks complete" });
  } else {
    ok({ task: result.task, index: result.index });
  }
}

function cmdStepDone(name: string, stepIndex: number): void {
  const state = loadState(name);
  if (stepIndex < 0 || stepIndex >= state.tasks.length) {
    die(`Step index ${stepIndex} out of range (0-${state.tasks.length - 1}).`);
  }
  state.tasks[stepIndex].status = "done";
  saveState(name, state);
  ok({ step: state.tasks[stepIndex].id, index: stepIndex, status: "done" });
}

function cmdComplete(name: string): void {
  const state = loadState(name);

  state.status = state.checks && Object.entries(state.checks)
    .filter(([k]) => k !== "lastRun")
    .every(([, v]) => v === true)
    ? "verified"
    : "done";

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
    ok({ passed: false, checks: {}, message: "No verify commands configured — run /task:plan to add them" });
    return;
  }

  const checks: Record<string, boolean> = {};
  let allPassed = true;

  for (const cmd of cmds) {
    const result = runVerify(cmd);
    checks[cmd.name] = result.passed;
    if (!result.passed) allPassed = false;

    console.error(
      JSON.stringify({
        check: cmd.name,
        command: cmd.command,
        passed: result.passed,
        output: result.output.slice(0, 500),
      }),
    );
  }

  state.checks = {
    ...checks,
    lastRun: new Date().toISOString(),
  };
  saveState(name, state);

  ok({ passed: allPassed, checks: state.checks });
}

function cmdCheckpoint(
  name: string,
  step: string,
  files?: string,
): void {
  const state = loadState(name);
  const index = state.lastCheckpoint + 1;

  const cpDir = checkpointDir(name);
  mkdirSync(cpDir, { recursive: true });

  const completed = state.tasks.filter(
    (t) => t.status === "done" || t.status === "skipped",
  ).length;

  const checkpoint: Checkpoint = {
    task: name,
    step,
    index,
    timestamp: new Date().toISOString(),
    files_changed: parseList(files),
    tasks_completed: completed,
    total_tasks: state.tasks.length,
    checks: state.checks || {},
  };

  writeFileSync(checkpointPath(name, index), JSON.stringify(checkpoint, null, 2) + "\n");

  state.lastCheckpoint = index;
  saveState(name, state);

  ok({ checkpoint: `checkpoint-${index}.json`, index });
}

function listCheckpoints(name: string): string[] {
  const cpDir = checkpointDir(name);
  if (!existsSync(cpDir)) return [];
  return readdirSync(cpDir)
    .filter((f) => f.startsWith("checkpoint-") && f.endsWith(".json"))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)![0]);
      const nb = parseInt(b.match(/\d+/)![0]);
      return nb - na;
    });
}

function cmdCheckpointList(name: string): void {
  const files = listCheckpoints(name);
  ok({ checkpoints: files, latest: files[0] || null });
}

function cmdCheckpointRead(name: string, index: number): void {
  if (isNaN(index)) die("Checkpoint index must be a valid number.");
  const p = checkpointPath(name, index);
  if (!existsSync(p)) {
    die(`Checkpoint ${index} not found for task "${name}".`);
  }
  const cp = JSON.parse(readFileSync(p, "utf-8"));
  ok(cp);
}

function cmdKgAdd(service: string, dependsOn?: string, usedBy?: string): void {
  const kg = loadKG();

  const existing = kg.services[service] || { depends_on: [], used_by: [] };
  kg.services[service] = {
    depends_on: [
      ...new Set([...existing.depends_on, ...parseList(dependsOn)]),
    ],
    used_by: [...new Set([...existing.used_by, ...parseList(usedBy)])],
    updated: new Date().toISOString(),
  };

  saveKG(kg);
  ok({ service, added: kg.services[service] });
}

function cmdKgQuery(service?: string): void {
  const kg = loadKG();

  if (service) {
    const node = kg.services[service];
    if (!node) {
      die(`Service "${service}" not found in knowledge graph.`);
    }
    ok({ service, ...node });
  } else {
    ok({ services: Object.keys(kg.services), count: Object.keys(kg.services).length, updated: kg.updated });
  }
}

function cmdNextCheckpoint(name: string): void {
  const files = listCheckpoints(name);

  if (files.length === 0) {
    ok({ checkpoint: null, message: "No checkpoints found" });
  } else {
    const latestPath = join(checkpointDir(name), files[0]);
    const cp = JSON.parse(readFileSync(latestPath, "utf-8"));
    ok({ checkpoint: files[0], data: cp });
  }
}

// ── Main ─────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd) {
    die("Usage: workflow-runtime.ts <command> [args...]\nCommands: init, next, step-done, verify, checkpoint, complete, status, checkpoints, checkpoint-read, next-checkpoint, kg-add, kg-query");
  }

  try {
    switch (cmd) {
      case "init": {
        const name = args[1];
        if (!name) die("init requires <task-name>");
        const taskList = args.find((a) => a.startsWith("--tasks="))?.slice(8);
        const deps = args.find((a) => a.startsWith("--deps="))?.slice(7);
        cmdInit(name, taskList, deps);
        break;
      }
      case "next":
        cmdNext(requireArg(args, 1, "task-name"));
        break;
      case "verify":
        cmdVerify(requireArg(args, 1, "task-name"));
        break;
      case "checkpoint": {
        const name = requireArg(args, 1, "task-name");
        const step = requireArg(args, 2, "step-name");
        const files = args.find((a) => a.startsWith("--files="))?.slice(8);
        cmdCheckpoint(name, step, files);
        break;
      }
      case "checkpoints":
        cmdCheckpointList(requireArg(args, 1, "task-name"));
        break;
      case "checkpoint-read":
        cmdCheckpointRead(requireArg(args, 1, "task-name"), parseInt(requireArg(args, 2, "checkpoint-index")));
        break;
      case "next-checkpoint":
        cmdNextCheckpoint(requireArg(args, 1, "task-name"));
        break;
      case "step-done":
        cmdStepDone(requireArg(args, 1, "task-name"), parseInt(requireArg(args, 2, "step-index")));
        break;
      case "complete":
        cmdComplete(requireArg(args, 1, "task-name"));
        break;
      case "status":
        cmdStatus(requireArg(args, 1, "task-name"));
        break;
      case "kg-add": {
        const svc = requireArg(args, 1, "service-name");
        const dependsOn = args.find((a) => a.startsWith("--depends-on="))?.slice(13);
        const usedBy = args.find((a) => a.startsWith("--used-by="))?.slice(10);
        cmdKgAdd(svc, dependsOn, usedBy);
        break;
      }
      case "kg-query":
        cmdKgQuery(args[1]);
        break;
      default:
        die(`Unknown command: ${cmd}\nCommands: init, next, step-done, verify, checkpoint, complete, status, checkpoints, checkpoint-read, next-checkpoint, kg-add, kg-query`);
    }
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      die(`JSON parse error: ${e.message}`);
    }
    throw e;
  }
}

function requireArg(args: string[], index: number, name: string): string {
  const val = args[index];
  if (!val) die(`Missing required argument: ${name}`);
  return val;
}

main();
