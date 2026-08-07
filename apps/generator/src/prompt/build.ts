import type { Config } from "../config/types";

export function buildPrompt(config: Config, subject: string): string {
  const brief = (config.creativeBrief ?? "").trim();
  const parts = [
    `Create a vertical poster image for ${config.theme}.`,
    `Focus this image on: ${subject}.`,
    `Style: ${config.style}.`,
    `Colors: ${config.colors}.`,
    `Composition: ${config.composition}.`,
  ];
  if (brief) {
    parts.push(`Creative brief: ${brief}`);
  } else {
    parts.push(
      `This image should feature ${subject}, illustrated in ${config.style}, with gentle watercolor-like textures and slightly faded, nostalgic colors.`
    );
  }
  parts.push(`Use a palette of ${config.colors}.`);
  parts.push(`${config.composition}.`);
  parts.push(
    `Format: ${config.widthInches}x${config.heightInches} inches at ${config.dpi} DPI, suitable for wall art. No text, no watermark.`
  );
  return parts.join(" ");
}
