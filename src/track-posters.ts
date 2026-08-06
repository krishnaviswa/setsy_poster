import fs from "fs";
import path from "path";
import type { GenerationResult } from "./generate-posters";

const TRACKING_PATH = path.join(process.cwd(), "docs", "POSTERS.md");

export function ensurePosterLog(): void {
  fs.mkdirSync(path.dirname(TRACKING_PATH), { recursive: true });
  if (!fs.existsSync(TRACKING_PATH)) {
    fs.writeFileSync(
      TRACKING_PATH,
      [
        "# Poster log",
        "",
        "Tracks every generation run after workflow completion.",
        "",
        "| Run ID | Date (UTC) | Prompt file | Outputs | Requested | OK | Errors |",
        "| --- | --- | --- | --- | ---: | ---: | --- |",
        "",
      ].join("\n"),
      "utf8"
    );
  }
}

export function appendPosterLog(entry: {
  runId: string;
  promptFile: string;
  files: string[];
  count: number;
  errors: string[];
}): void {
  ensurePosterLog();
  const date = new Date().toISOString();
  const outputs = entry.files.length
    ? entry.files.map((f) => `\`${f}\``).join(", ")
    : "—";
  const err =
    entry.errors.length > 0
      ? entry.errors.join("; ").replace(/\|/g, "/")
      : "—";
  const row = `| \`${entry.runId}\` | ${date} | \`${entry.promptFile}\` | ${outputs} | ${entry.count} | ${entry.files.length} | ${err} |`;
  fs.appendFileSync(TRACKING_PATH, `${row}\n`, "utf8");
}

export function trackingPath(): string {
  return TRACKING_PATH;
}

export type { GenerationResult };
