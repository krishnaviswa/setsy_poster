import path from "path";
import dotenv from "dotenv";
import Replicate from "replicate";
import { getImageModel } from "../config/load-models";
import { findRepoRoot } from "../paths";

dotenv.config({ path: path.join(findRepoRoot(), ".env") });

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
  const model = getImageModel() as `${string}/${string}`;

  const output = await replicate.run(model, {
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
