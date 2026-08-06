import fs from "fs";
import path from "path";
import {
  buildPrompt,
  generateImage,
  saveAsPrintReady,
  type Config,
  type GenerationResult,
} from "./generate-posters";
import {
  structureFromNlp,
  uniquePromptBasename,
} from "./structure-prompt";
import { appendPosterLog, trackingPath } from "./track-posters";

const MODEL = "black-forest-labs/flux-kontext-pro";
const MAX_IMAGES = 4;
const PROMPTS_DIR = path.join(process.cwd(), "prompts");

export interface WorkflowResult extends GenerationResult {
  runId: string;
  promptFile: string;
  trackingFile: string;
  source: "structured" | "nlp";
  steps: string[];
}

function capCount(config: Config): void {
  if (config.count > MAX_IMAGES) {
    console.warn(
      `Warning: requested ${config.count} images; hard cap is ${MAX_IMAGES}. Generating ${MAX_IMAGES}.`
    );
    config.count = MAX_IMAGES;
  }
}

function saveStructuredPrompt(runId: string, structuredText: string): string {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  const relative = path.join("prompts", `${runId}.txt`);
  const absolute = path.join(process.cwd(), relative);
  fs.writeFileSync(absolute, structuredText, "utf8");
  return relative.replace(/\\/g, "/");
}

/**
 * Full workflow:
 * 1) Accept NLP
 * 2) Build structured prompt
 * 3) Save to prompts/ with unique name
 * 4) Call Replicate API (one call per slot)
 * 5) Save print-ready PNGs
 * 6) Append run to docs/POSTERS.md
 */
export async function runWorkflow(nlpText: string): Promise<WorkflowResult> {
  const steps: string[] = [];

  // Step 1 — receive NLP
  steps.push("1. Received natural-language prompt");
  console.log("[workflow] Step 1: received NLP prompt");

  // Step 2 — structure
  const structured = structureFromNlp(nlpText);
  const config = structured.config;
  capCount(config);
  steps.push(
    `2. Built structured prompt (${structured.source}); count=${config.count}`
  );
  console.log(
    `[workflow] Step 2: structured (${structured.source}) count=${config.count} theme="${config.theme}"`
  );

  // Step 3 — save unique prompt file
  const runId = uniquePromptBasename(config.theme);
  const promptFile = saveStructuredPrompt(runId, structured.structuredText);
  steps.push(`3. Saved structured prompt to ${promptFile}`);
  console.log(`[workflow] Step 3: saved ${promptFile}`);

  // Steps 4–5 — API + save images
  steps.push("4. Calling Replicate API for each image slot");
  steps.push("5. Saving print-ready PNGs to output/");
  console.log(
    `[workflow] Steps 4–5: generating via ${MODEL} (${config.count} slot(s))`
  );

  const files: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < config.count; i++) {
    const subject = config.subjects[i % config.subjects.length];
    const filename = `${runId}-poster-${String(i + 1).padStart(2, "0")}.png`;
    const prompt = buildPrompt(config, subject);

    console.log(`\n[${i + 1}/${config.count}] Subject: ${subject}`);
    console.log(`Prompt: ${prompt.slice(0, 240)}...`);

    try {
      const buffer = await generateImage(
        prompt,
        config.widthInches,
        config.heightInches
      );
      await saveAsPrintReady(
        buffer,
        filename,
        config.widthInches,
        config.heightInches,
        config.dpi
      );
      files.push(filename);
      console.log(`Generated ${filename} using ${MODEL}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${filename}: ${message}`);
      console.error(`Error generating ${filename}: ${message}`);
      console.error("Skipping this slot (no retry).");
    }
  }

  // Step 6 — tracking MD
  appendPosterLog({
    runId,
    promptFile,
    files,
    count: config.count,
    errors,
  });
  const trackingFile = path
    .relative(process.cwd(), trackingPath())
    .replace(/\\/g, "/");
  steps.push(`6. Appended run to ${trackingFile}`);
  console.log(`[workflow] Step 6: updated ${trackingFile}`);
  console.log("\nDone.");

  return {
    files,
    errors,
    count: config.count,
    runId,
    promptFile,
    trackingFile,
    source: structured.source,
    steps,
  };
}
