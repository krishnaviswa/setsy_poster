import fs from "fs";
import path from "path";

/** Walk up from cwd / this file until contracts/MODELS.json is found. */
export function findRepoRoot(startDir = process.cwd()): string {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, "contracts", "MODELS.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: apps/generator/src/paths.ts → repo root is ../../..
  const fromModule = path.resolve(__dirname, "../../..");
  if (fs.existsSync(path.join(fromModule, "contracts", "MODELS.json"))) {
    return fromModule;
  }
  throw new Error(
    "Could not find repo root (expected contracts/MODELS.json). Run from the monorepo root."
  );
}

export function repoPath(...segments: string[]): string {
  return path.join(findRepoRoot(), ...segments);
}
