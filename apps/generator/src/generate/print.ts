import fs from "fs";
import path from "path";
import sharp from "sharp";
import { repoPath } from "../paths";

export async function saveAsPrintReady(
  buffer: Buffer,
  filename: string,
  widthInches: number,
  heightInches: number,
  dpi: number
): Promise<string> {
  const widthPx = Math.round(widthInches * dpi);
  const heightPx = Math.round(heightInches * dpi);
  const outDir = repoPath("data", "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);

  await sharp(buffer)
    .resize(widthPx, heightPx, { fit: "cover", position: "centre" })
    .toColorspace("srgb")
    .png()
    .withMetadata({ density: dpi })
    .toFile(outPath);

  return outPath;
}
