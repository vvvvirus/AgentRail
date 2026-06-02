import { mkdirSync, readdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import type { TaskState, Checkpoint } from "./types.js";

export function createCheckpoint(
  name: string,
  step: string,
  state: TaskState,
  filesChanged: string[],
  artifacts?: string[],
): Checkpoint {
  const completed = state.tasks.filter(
    (t) => t.status === "done" || t.status === "skipped",
  ).length;

  return {
    task: name,
    step,
    index: state.lastCheckpoint + 1,
    timestamp: new Date().toISOString(),
    files_changed: filesChanged,
    tasks_completed: completed,
    total_tasks: state.tasks.length,
    checks: state.checks || {},
    artifacts: artifacts?.length ? artifacts : undefined,
  };
}

export function writeCheckpointFile(
  cpDir: string,
  checkpoint: Checkpoint,
): void {
  mkdirSync(cpDir, { recursive: true });
  const path = `${cpDir}/checkpoint-${checkpoint.index}.json`;
  writeFileSync(path, JSON.stringify(checkpoint, null, 2) + "\n");
}

export function loadCheckpoint(cpDir: string, index: number): Checkpoint {
  const path = `${cpDir}/checkpoint-${index}.json`;
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function listCheckpoints(cpDir: string): string[] {
  if (!existsSync(cpDir)) return [];
  return readdirSync(cpDir)
    .filter((f) => f.startsWith("checkpoint-") && f.endsWith(".json"))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)![0]);
      const nb = parseInt(b.match(/\d+/)![0]);
      return nb - na;
    });
}

export function getLatestCheckpoint(cpDir: string): { file: string; data: Checkpoint } | null {
  const files = listCheckpoints(cpDir);
  if (files.length === 0) return null;
  const data = loadCheckpoint(cpDir, parseInt(files[0].match(/\d+/)![0]));
  return { file: files[0], data };
}
