import type { Config } from "./types";
import {
  DEFAULT_COLORS,
  DEFAULT_COMPOSITION,
  DEFAULT_DPI,
  DEFAULT_HEIGHT_INCHES,
  DEFAULT_STYLE,
  DEFAULT_SUBJECT,
  DEFAULT_THEME,
  DEFAULT_WIDTH_INCHES,
} from "./defaults";

function extractLabeledField(text: string, label: string): string | null {
  const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im");
  const match = text.match(re);
  return match ? match[1].trim().replace(/\.$/, "") : null;
}

/**
 * Parse labeled / natural-language prompt text into PosterConfig.
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
    : DEFAULT_THEME;
  if (!themeMatch) {
    console.warn('Warning: could not extract theme after "images for"; using default.');
  }

  const style = extractLabeledField(text, "Style") ?? DEFAULT_STYLE;
  if (!extractLabeledField(text, "Style")) {
    console.warn('Warning: missing "Style:" line; using default.');
  }

  const colors = extractLabeledField(text, "Colors") ?? DEFAULT_COLORS;
  if (!extractLabeledField(text, "Colors")) {
    console.warn('Warning: missing "Colors:" line; using default.');
  }

  const composition =
    extractLabeledField(text, "Composition") ?? DEFAULT_COMPOSITION;
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
    subjects = [DEFAULT_SUBJECT];
  }
  if (subjects.length === 0) {
    console.warn("Warning: no subjects parsed; using a single generic subject.");
    subjects = [DEFAULT_SUBJECT];
  }

  const formatLine = extractLabeledField(text, "Format");
  let widthInches = DEFAULT_WIDTH_INCHES;
  let heightInches = DEFAULT_HEIGHT_INCHES;
  let dpi = DEFAULT_DPI;
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
    creativeBrief: text,
  };
}
