import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { findRepoRoot, repoPath } from "./paths";
import { runWorkflow } from "./workflow/run";

dotenv.config({ path: path.join(findRepoRoot(), ".env") });

/** Parse `--file <path>` (or `--file=<path>`). Defaults to data/config/prompt.txt. */
function resolveConfigPath(argv: string[]): string {
  const defaultPath = repoPath("data", "config", "prompt.txt");
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--file" || arg === "-f") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error('Missing path after --file. Example: --file "data/config/Ganesha.txt"');
      }
      return path.isAbsolute(value) ? value : path.join(findRepoRoot(), value);
    }
    if (arg.startsWith("--file=")) {
      const value = arg.slice("--file=".length);
      if (!value) {
        throw new Error('Missing path after --file=. Example: --file="data/config/Ganesha.txt"');
      }
      return path.isAbsolute(value) ? value : path.join(findRepoRoot(), value);
    }
  }
  return defaultPath;
}

async function main(): Promise<void> {
  const configPath = resolveConfigPath(process.argv.slice(2));
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}`);
  }

  console.log(`Using config: ${configPath}`);
  const raw = fs.readFileSync(configPath, "utf8");
  await runWorkflow(raw);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
