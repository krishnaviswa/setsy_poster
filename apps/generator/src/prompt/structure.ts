import type { Config } from "../config/types";

export interface StructuredPromptResult {
  config: Config;
  structuredText: string;
  source: "structured" | "nlp";
}

function extractLabeledField(text: string, label: string): string | null {
  const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im");
  const match = text.match(re);
  return match ? match[1].trim().replace(/\.$/, "") : null;
}

function looksStructured(text: string): boolean {
  const hasGenerate = /Generate\s+\d+\s+.*?images/i.test(text);
  const labeled =
    (extractLabeledField(text, "Style") ? 1 : 0) +
    (extractLabeledField(text, "Subjects") ? 1 : 0) +
    (extractLabeledField(text, "Format") ? 1 : 0) +
    (extractLabeledField(text, "Composition") ? 1 : 0) +
    (extractLabeledField(text, "Colors") ? 1 : 0);
  return hasGenerate || labeled >= 2;
}

function inferCount(text: string): number {
  const patterns = [
    /Generate\s+(\d+)\s+.*?images/i,
    /(\d+)\s+(?:vertical\s+)?poster\s+images?/i,
    /(\d+)\s+posters?\b/i,
    /(\d+)\s+images?\b/i,
    /a\s+set\s+of\s+(\d+)/i,
    /create\s+(\d+)\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n >= 1) return n;
    }
  }
  return 1;
}

function inferFormat(text: string): {
  widthInches: number;
  heightInches: number;
  dpi: number;
} {
  let widthInches = 18;
  let heightInches = 24;
  let dpi = 300;
  const sizeMatch = text.match(
    /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*inches?/i
  );
  const dpiMatch = text.match(/(\d+)\s*DPI/i);
  if (sizeMatch) {
    widthInches = parseFloat(sizeMatch[1]);
    heightInches = parseFloat(sizeMatch[2]);
  }
  if (dpiMatch) {
    dpi = parseInt(dpiMatch[1], 10);
  }
  return { widthInches, heightInches, dpi };
}

function inferStyle(text: string): string {
  const labeled = extractLabeledField(text, "Style");
  if (labeled) return labeled;

  const cues: Array<[RegExp, string]> = [
    [/storybook|nursery|watercolor/i, "soft vintage storybook watercolor style"],
    [/cinematic|photoreal|realistic/i, "high-end cinematic realism"],
    [/temple|devotional|sculpt/i, "devotional temple sculpture with cinematic realism"],
    [/minimal|clean line/i, "clean minimal illustration style"],
    [/vintage|nostalgic|faded/i, "soft vintage illustrated style"],
  ];
  for (const [re, style] of cues) {
    if (re.test(text)) return style;
  }
  return "detailed illustrated poster style";
}

function inferColors(text: string): string {
  const labeled = extractLabeledField(text, "Colors");
  if (labeled) return labeled;

  const found: string[] = [];
  const colorWords = [
    "sage green",
    "cream",
    "rust",
    "warm brown",
    "navy",
    "gold",
    "saffron",
    "red",
    "teal",
    "coral",
    "lavender",
    "seafoam",
    "bronze",
    "maroon",
  ];
  const lower = text.toLowerCase();
  for (const c of colorWords) {
    if (lower.includes(c)) found.push(c);
  }
  if (found.length) return found.slice(0, 5).join(", ");
  return "balanced print-ready color palette";
}

function inferComposition(text: string): string {
  const labeled = extractLabeledField(text, "Composition");
  if (labeled) return labeled;
  if (/centered|centre|center/i.test(text)) {
    return "centered composition, clear silhouette, no text, no watermark";
  }
  return "centered poster composition, clean background, no text, no watermark";
}

function inferTheme(text: string): string {
  const themeMatch = text.match(
    /Generate\s+\d+\s+.*?\s+images\s+for\s+(.+?)(?:\.|$)/i
  );
  if (themeMatch) return themeMatch[1].trim().replace(/\.$/, "");

  const firstLine = text
    .split(/\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return "custom wall art poster";
  const clipped = firstLine.replace(/^Create\s+/i, "").trim();
  return clipped.length > 120 ? `${clipped.slice(0, 117)}...` : clipped;
}

function inferSubjects(text: string, count: number): string[] {
  const subjectsRaw = extractLabeledField(text, "Subjects");
  if (subjectsRaw) {
    return subjectsRaw
      .split(/,|\band\b/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  const bullets = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, "").trim())
    .filter((s) => s.length > 0);
  if (bullets.length) return bullets;

  const single = ["the main subject described in the creative brief"];
  if (count <= 1) return single;
  return single;
}

export function toStructuredText(config: Config, creativeBrief: string): string {
  return [
    `Generate ${config.count} vertical poster images for ${config.theme}.`,
    `Style: ${config.style}.`,
    `Colors: ${config.colors}.`,
    `Composition: ${config.composition}.`,
    `Subjects: ${config.subjects.join(", ")}.`,
    `Format: ${config.widthInches}x${config.heightInches} inches at ${config.dpi} DPI, suitable for wall art.`,
    "",
    "Creative brief:",
    creativeBrief.trim(),
  ].join("\n");
}

/**
 * Convert freeform NLP (or already-structured text) into a Config + structured prompt file body.
 * Does not invent subjects beyond what the text supports.
 */
export function structureFromNlp(nlpText: string): StructuredPromptResult {
  const text = nlpText.trim();
  if (!text) {
    throw new Error("Prompt text is empty.");
  }

  const source: "structured" | "nlp" = looksStructured(text) ? "structured" : "nlp";

  const count = inferCount(text);
  const { widthInches, heightInches, dpi } = inferFormat(text);
  const style = inferStyle(text);
  const colors = inferColors(text);
  const composition = inferComposition(text);
  const theme = inferTheme(text);
  const subjects = inferSubjects(text, count);

  const config: Config = {
    theme,
    count,
    style,
    colors,
    composition,
    subjects,
    widthInches,
    heightInches,
    dpi,
    creativeBrief: text,
  };

  if (source === "nlp") {
    console.log("NLP input detected — building structured prompt from freeform text.");
  } else {
    console.log("Structured-looking input detected — normalizing fields.");
  }

  return {
    config,
    structuredText: toStructuredText(config, text),
    source,
  };
}

export function slugFromTheme(theme: string): string {
  const slug = theme
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "poster";
}

export function uniquePromptBasename(theme: string, date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${stamp}-${slugFromTheme(theme)}`;
}
