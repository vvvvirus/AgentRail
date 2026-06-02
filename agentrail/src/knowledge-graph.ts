import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { KnowledgeGraph, ServiceNode } from "./types.js";

function parseList(arg?: string): string[] {
  if (!arg || arg === "") return [];
  return [...new Set(arg.split(",").map((s) => s.trim()).filter(Boolean))];
}

export function loadKG(path: string): KnowledgeGraph {
  if (!existsSync(path)) {
    return { services: {}, updated: new Date().toISOString() };
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function saveKG(path: string, kg: KnowledgeGraph): void {
  kg.updated = new Date().toISOString();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(kg, null, 2) + "\n");
}

export function addService(
  path: string,
  service: string,
  dependsOn?: string,
  usedBy?: string,
): ServiceNode {
  const kg = loadKG(path);
  const existing = kg.services[service] || { depends_on: [], used_by: [] };
  kg.services[service] = {
    depends_on: [...new Set([...existing.depends_on, ...parseList(dependsOn)])],
    used_by: [...new Set([...existing.used_by, ...parseList(usedBy)])],
    updated: new Date().toISOString(),
  };
  saveKG(path, kg);
  return kg.services[service];
}

export function queryService(
  path: string,
  service?: string,
): { services?: string[]; count?: number; updated?: string; depends_on?: string[]; used_by?: string[] } | null {
  const kg = loadKG(path);
  if (service) {
    const node = kg.services[service];
    if (!node) return null;
    return { ...node };
  }
  return {
    services: Object.keys(kg.services),
    count: Object.keys(kg.services).length,
    updated: kg.updated,
  };
}
