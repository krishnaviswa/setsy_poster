/**
 * Cross-platform launcher: sets PYTHONPATH to apps/research and runs the CLI.
 * Usage: node scripts/research.cjs collect|analyze|prompt|generate|run-all [...args]
 */
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const researchRoot = path.join(root, "apps", "research");
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/research.cjs <command> [...args]");
  process.exit(2);
}

const env = {
  ...process.env,
  PYTHONPATH: researchRoot + (process.env.PYTHONPATH ? path.delimiter + process.env.PYTHONPATH : ""),
};

const result = spawnSync("python", ["-m", "research_pipeline.cli", ...args], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);
