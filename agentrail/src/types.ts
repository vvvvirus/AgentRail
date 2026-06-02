export interface SubTask {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "done" | "skipped";
  deps?: string[];
  blockedBy?: string[];
  artifacts?: string[];
}

export interface CheckState {
  [key: string]: boolean | string | undefined;
  tests?: boolean;
  lint?: boolean;
  typecheck?: boolean;
  build?: boolean;
  lastRun?: string;
}

export interface VerifyCommand {
  name: "tests" | "lint" | "typecheck" | "build" | "custom";
  command: string;
  cwd?: string;
}

export interface TaskState {
  id: string;
  status: "pending" | "in_progress" | "done" | "verified";
  tasks: SubTask[];
  checks?: CheckState;
  verifyCommands?: VerifyCommand[];
  created: string;
  updated: string;
  lastCheckpoint: number;
}

export interface Checkpoint {
  task: string;
  step: string;
  index: number;
  timestamp: string;
  files_changed: string[];
  tasks_completed: number;
  total_tasks: number;
  checks: CheckState;
  artifacts?: string[];
}

export interface ServiceNode {
  depends_on: string[];
  used_by: string[];
  description?: string;
  updated: string;
}

export interface KnowledgeGraph {
  services: Record<string, ServiceNode>;
  updated: string;
}

export interface ValidationResult {
  overall: "PASS" | "WARN" | "BLOCK";
  checks: {
    task_count: { pass: boolean; message: string };
    deps_valid: { pass: boolean; message: string };
    verify_coverage: { pass: boolean; message: string };
    granularity: { pass: boolean; message: string };
  };
}
