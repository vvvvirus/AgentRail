import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { VerifyCommand } from "./types.js";

export function detectVerifyCommands(projectRoot: string): VerifyCommand[] {
  const cmds: VerifyCommand[] = [];
  const seen = new Set<string>();

  function add(
    name: "tests" | "lint" | "typecheck" | "build" | "custom",
    command: string,
    subdir?: string,
  ): void {
    if (seen.has(name)) return;
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
      add("tests", "cargo test", subdir);
      add("lint", "cargo clippy", subdir);
      add("typecheck", "cargo check", subdir);
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
      add("tests", "go test ./...", subdir);
      add("lint", "golangci-lint run", subdir);
      add("typecheck", "go vet ./...", subdir);
    }

    return found;
  }

  scan(projectRoot);

  try {
    const entries = readdirSync(projectRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;
      if (entry.name === "node_modules") continue;
      scan(join(projectRoot, entry.name), entry.name);
    }
  } catch {
    // Permission errors — ignore
  }

  return cmds;
}

export function runVerify(
  cmd: VerifyCommand,
  projectRoot: string,
  timeoutMs?: number,
): { passed: boolean; output: string } {
  const timeout = timeoutMs || 120_000;
  const workDir = cmd.cwd ? join(projectRoot, cmd.cwd) : projectRoot;
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
