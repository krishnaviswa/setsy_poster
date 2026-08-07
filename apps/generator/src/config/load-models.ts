import fs from "fs";
import { repoPath } from "../paths";

export interface ModelsConfig {
  imageModel: string;
  visionModel: string;
  maxImages: number;
  defaultWidthInches: number;
  defaultHeightInches: number;
  defaultDpi: number;
}

let cached: ModelsConfig | null = null;

export function loadModelsConfig(): ModelsConfig {
  if (cached) return cached;
  const file = repoPath("contracts", "MODELS.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as ModelsConfig;
  cached = raw;
  return raw;
}

export function getImageModel(): string {
  return loadModelsConfig().imageModel;
}

export function getMaxImages(): number {
  return loadModelsConfig().maxImages;
}
