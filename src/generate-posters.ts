import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Replicate from "replicate";
import sharp from "sharp";

dotenv.config();

/** Single hosted model — do not change unless you intentionally switch providers. */
const MODEL = "black-forest-labs/flux-kontext-pro";
const MAX_IMAGES = 4;

export interface Config {
  theme: string;
  count: number;
  style: string;
  colors: string;
  composition: string;
  subjects: string[];
  widthInches: number;
  heightInches: number;
  dpi: number;
}

function extractLabeledField(text: string, label: string): string | null {
  const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im");
  const match = text.match(re);
  return match ? match[1].trim().replace(/\.$/, "") : null;
}

/**
 * Parse the natural-language paragraph in config/prompt.txt.
 * Missing fields get defaults and a console warning.
 */
export function parseConfig(text: string): Config {
  const countMatch = text.match(/Generate\s+(\d+)\s+.*?images/i);
  let count = countMatch ? parseInt(countMatch[1], 10) : 1;
  if (!countMatch) {
    console.warn('Warning: could not find "Generate N … images"; defaulting count to 1.');
  }
  if (Number.isNaN(count) || count < 1) {
    console.warn("Warning: invalid count; defaulting to 1.");
    count = 1;
  }

  const themeMatch = text.match(
    /Generate\s+\d+\s+.*?\s+images\s+for\s+(.+?)(?:\.|$)/i
  );
  const theme = themeMatch
    ? themeMatch[1].trim().replace(/\.$/, "")
    : "nursery wall art";
  if (!themeMatch) {
    console.warn('Warning: could not extract theme after "images for"; using default.');
  }

  const style = extractLabeledField(text, "Style") ?? "soft illustrated style";
  if (!extractLabeledField(text, "Style")) {
    console.warn('Warning: missing "Style:" line; using default.');
  }

  const colors = extractLabeledField(text, "Colors") ?? "muted, warm tones";
  if (!extractLabeledField(text, "Colors")) {
    console.warn('Warning: missing "Colors:" line; using default.');
  }

  const composition =
    extractLabeledField(text, "Composition") ??
    "centered composition, clean background, no text, no watermark";
  if (!extractLabeledField(text, "Composition")) {
    console.warn('Warning: missing "Composition:" line; using default.');
  }

  const subjectsRaw = extractLabeledField(text, "Subjects");
  let subjects: string[];
  if (subjectsRaw) {
    subjects = subjectsRaw
      .split(/,|\band\b/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } else {
    console.warn('Warning: missing "Subjects:" line; using a single generic subject.');
    subjects = ["the main subject described in the theme"];
  }
  if (subjects.length === 0) {
    console.warn("Warning: no subjects parsed; using a single generic subject.");
    subjects = ["the main subject described in the theme"];
  }

  const formatLine = extractLabeledField(text, "Format");
  let widthInches = 18;
  let heightInches = 24;
  let dpi = 300;
  if (formatLine) {
    const sizeMatch = formatLine.match(
      /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*inches?/i
    );
    const dpiMatch = formatLine.match(/(\d+)\s*DPI/i);
    if (sizeMatch) {
      widthInches = parseFloat(sizeMatch[1]);
      heightInches = parseFloat(sizeMatch[2]);
    } else {
      console.warn(
        'Warning: could not parse inches from "Format:"; defaulting to 18x24.'
      );
    }
    if (dpiMatch) {
      dpi = parseInt(dpiMatch[1], 10);
    } else {
      console.warn('Warning: could not parse DPI from "Format:"; defaulting to 300.');
    }
  } else {
    console.warn('Warning: missing "Format:" line; defaulting to 18x24 inches at 300 DPI.');
  }

  return {
    theme,
    count,
    style,
    colors,
    composition,
    subjects,
    widthInches,
    heightInches,
    dpi,
  };
}

export function buildPrompt(config: Config, subject: string): string {
  return [
    `Create a vertical poster image for ${config.theme}.`,
    `Style: ${config.style}.`,
    `Colors: ${config.colors}.`,
    `Composition: ${config.composition}.`,
    `This image should feature ${subject}, illustrated in ${config.style}, with gentle watercolor-like textures and slightly faded, nostalgic colors.`,
    `Use a palette of ${config.colors}.`,
    `${config.composition}.`,
    `Format: ${config.widthInches}x${config.heightInches} inches at ${config.dpi} DPI, suitable for nursery wall art.`,
  ].join(" ");
}

/** Map print aspect ratio to the closest value accepted by the model. */
function aspectRatioFor(widthInches: number, heightInches: number): string {
  const ratio = widthInches / heightInches;
  const options: Array<[string, number]> = [
    ["1:1", 1],
    ["4:5", 4 / 5],
    ["3:4", 3 / 4],
    ["2:3", 2 / 3],
    ["9:16", 9 / 16],
    ["3:2", 3 / 2],
    ["4:3", 4 / 3],
    ["5:4", 5 / 4],
    ["16:9", 16 / 9],
  ];
  let best = options[0];
  let bestDiff = Math.abs(ratio - best[1]);
  for (const opt of options) {
    const diff = Math.abs(ratio - opt[1]);
    if (diff < bestDiff) {
      best = opt;
      bestDiff = diff;
    }
  }
  return best[0];
}

function resolveOutputUrl(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }
  if (Array.isArray(output) && output.length > 0) {
    return resolveOutputUrl(output[0]);
  }
  if (output && typeof output === "object") {
    const obj = output as Record<string, unknown>;
    if (typeof obj.url === "function") {
      return String((obj.url as () => unknown)());
    }
    if (typeof obj.url === "string") {
      return obj.url;
    }
    if (typeof obj.href === "string") {
      return obj.href;
    }
  }
  throw new Error(`Unexpected Replicate output shape: ${JSON.stringify(output)}`);
}

export async function generateImage(
  prompt: string,
  widthInches: number,
  heightInches: number
): Promise<Buffer> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token === "your_replicate_api_token_here") {
    throw new Error(
      "REPLICATE_API_TOKEN is missing. Copy .env.example to .env and add your token."
    );
  }

  const replicate = new Replicate({ auth: token });

  const output = await replicate.run(MODEL, {
    input: {
      prompt,
      aspect_ratio: aspectRatioFor(widthInches, heightInches),
      output_format: "png",
    },
  });

  const url = resolveOutputUrl(output);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status}): ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function saveAsPrintReady(
  buffer: Buffer,
  filename: string,
  widthInches: number,
  heightInches: number,
  dpi: number
): Promise<void> {
  const widthPx = Math.round(widthInches * dpi);
  const heightPx = Math.round(heightInches * dpi);
  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);

  await sharp(buffer)
    .resize(widthPx, heightPx, { fit: "cover", position: "centre" })
    .toColorspace("srgb")
    .png()
    .withMetadata({ density: dpi })
    .toFile(outPath);
}

/** Parse `--file <path>` (or `--file=<path>`). Defaults to config/prompt.txt. */
function resolveConfigPath(argv: string[]): string {
  const defaultPath = path.join(process.cwd(), "config", "prompt.txt");
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--file" || arg === "-f") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error('Missing path after --file. Example: --file "customprompt.txt"');
      }
      return path.isAbsolute(value) ? value : path.join(process.cwd(), value);
    }
    if (arg.startsWith("--file=")) {
      const value = arg.slice("--file=".length);
      if (!value) {
        throw new Error('Missing path after --file=. Example: --file="customprompt.txt"');
      }
      return path.isAbsolute(value) ? value : path.join(process.cwd(), value);
    }
  }
  return defaultPath;
}

export interface GenerationResult {
  files: string[];
  errors: string[];
  count: number;
}

/** Parse structured prompt text and generate posters (shared by CLI and UI). */
export async function runGeneration(rawText: string): Promise<GenerationResult> {
  const config = parseConfig(rawText);

  if (config.count > MAX_IMAGES) {
    console.warn(
      `Warning: requested ${config.count} images; hard cap is ${MAX_IMAGES}. Generating ${MAX_IMAGES}.`
    );
    config.count = MAX_IMAGES;
  }

  console.log(
    `Parsed config: count=${config.count}, subjects=${config.subjects.length}, ` +
      `size=${config.widthInches}x${config.heightInches} in @ ${config.dpi} DPI, model=${MODEL}`
  );
  // If fewer subjects than count, cycle through the list (subjects[i % length]).
  // Never invent subjects beyond what the config paragraph lists.

  const files: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < config.count; i++) {
    const subject = config.subjects[i % config.subjects.length];
    const filename = `poster-${String(i + 1).padStart(2, "0")}.png`;
    const prompt = buildPrompt(config, subject);

    console.log(`\n[${i + 1}/${config.count}] Subject: ${subject}`);
    console.log(`Prompt: ${prompt}`);

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

  console.log("\nDone.");
  return { files, errors, count: config.count };
}

async function main(): Promise<void> {
  const configPath = resolveConfigPath(process.argv.slice(2));
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}`);
  }

  console.log(`Using config: ${configPath}`);
  const raw = fs.readFileSync(configPath, "utf8");
  await runGeneration(raw);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
