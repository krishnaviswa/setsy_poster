import fs from "fs";
import path from "path";
import type { Config } from "../config/types";
import { getImageModel, getMaxImages } from "../config/load-models";
import { buildPrompt } from "../prompt/build";
import {
  structureFromNlp,
  uniquePromptBasename,
} from "../prompt/structure";
import { generateImage } from "../generate/replicate";
import { saveAsPrintReady } from "../generate/print";
import type { GenerationResult } from "../generate/types";
import { appendPosterLog, trackingPath } from "../track/posters";
import { findRepoRoot, repoPath } from "../paths";

export interface WorkflowResult extends GenerationResult {
  runId: string;
  promptFile: string;
  trackingFile: string;
  source: "structured" | "nlp";
  steps: string[];
}

function capCount(config: Config): void {
  const maxImages = getMaxImages();
  if (config.count > maxImages) {
    console.warn(
      `Warning: requested ${config.count} images; hard cap is ${maxImages}. Generating ${maxImages}.`
    );
    config.count = maxImages;
  }
}

function saveStructuredPrompt(runId: string, structuredText: string): string {
  const promptsDir = repoPath("data", "prompts");
  fs.mkdirSync(promptsDir, { recursive: true });
  const absolute = path.join(promptsDir, `${runId}.txt`);
  fs.writeFileSync(absolute, structuredText, "utf8");
  return path
    .relative(findRepoRoot(), absolute)
    .replace(/\\/g, "/");
}

/**
 * Full workflow:
 * 1) Accept NLP
 * 2) Build structured prompt
 * 3) Save to data/prompts/ with unique name
 * 4) Call Replicate API (one call per slot)
 * 5) Save print-ready PNGs to data/output/
 * 6) Append run to docs/POSTERS.md
 */
export async function runWorkflow(nlpText: string): Promise<WorkflowResult> {
  const steps: string[] = [];
  const model = getImageModel();

  steps.push("1. Received natural-language prompt");
  console.log("[workflow] Step 1: received NLP prompt");

  const structured = structureFromNlp(nlpText);
  const config = structured.config;
  capCount(config);
  steps.push(
    `2. Built structured prompt (${structured.source}); count=${config.count}`
  );
  console.log(
    `[workflow] Step 2: structured (${structured.source}) count=${config.count} theme="${config.theme}"`
  );

  const runId = uniquePromptBasename(config.theme);
  const promptFile = saveStructuredPrompt(runId, structured.structuredText);
  steps.push(`3. Saved structured prompt to ${promptFile}`);
  console.log(`[workflow] Step 3: saved ${promptFile}`);

  steps.push("4. Calling Replicate API for each image slot");
  steps.push("5. Saving print-ready PNGs to data/output/");
  console.log(
    `[workflow] Steps 4–5: generating via ${model} (${config.count} slot(s))`
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
      console.log(`Generated ${filename} using ${model}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${filename}: ${message}`);
      console.error(`Error generating ${filename}: ${message}`);
      console.error("Skipping this slot (no retry).");
    }
  }

  appendPosterLog({
    runId,
    promptFile,
    files,
    count: config.count,
    errors,
  });
  const trackingFile = path
    .relative(findRepoRoot(), trackingPath())
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
