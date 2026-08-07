import type { Config } from "./types";

export const DEFAULT_THEME = "nursery wall art";
export const DEFAULT_STYLE = "soft illustrated style";
export const DEFAULT_COLORS = "muted, warm tones";
export const DEFAULT_COMPOSITION =
  "centered composition, clean background, no text, no watermark";
export const DEFAULT_SUBJECT = "the main subject described in the theme";

export const DEFAULT_WIDTH_INCHES = 18;
export const DEFAULT_HEIGHT_INCHES = 24;
export const DEFAULT_DPI = 300;

export function defaultFormat(): Pick<
  Config,
  "widthInches" | "heightInches" | "dpi"
> {
  return {
    widthInches: DEFAULT_WIDTH_INCHES,
    heightInches: DEFAULT_HEIGHT_INCHES,
    dpi: DEFAULT_DPI,
  };
}
