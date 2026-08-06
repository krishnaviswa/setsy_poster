# Architecture

## Goal

Generate **N** print-ready poster PNG images from a single natural-language paragraph in `config/prompt.txt`. No Etsy listing, mockup, or SEO logic.

## Model

Exactly one hosted model:

- `black-forest-labs/flux-kontext-pro` on [Replicate](https://replicate.com/black-forest-labs/flux-kontext-pro)

There is no model list, no fallback model, and no local GPU inference.

## Flow

1. Read `.env` for `REPLICATE_API_TOKEN`.
2. Read `config/prompt.txt` as plain text.
3. Parse:
   - `count` from `Generate N … images`
   - `theme` from the text after `images for`
   - `style`, `colors`, `composition`, `subjects`, `format` from labeled lines
4. Cap `count` at **10** (log a warning if capped).
5. For `i = 0 .. count - 1`:
   - Pick subject `subjects[i % subjects.length]` (cycle if fewer subjects than count; never invent subjects).
   - Build one prompt with `buildPrompt`.
   - Call the model **once** via `generateImage`.
   - On success, resize/convert with `sharp` and save `output/poster-XX.png`.
   - On failure, log the error and continue to the next slot (no retry).

## Boundary conditions

| Rule | Behavior |
|------|----------|
| Max images | Hard cap `N ≤ 10` |
| API calls | Exactly one call per slot → total calls = N |
| Retries | None |
| Fallback models | None |
| Subject invention | Forbidden — only subjects listed in the config |
| Extra features | No listings, mockups, SEO, or alternate sizes |

## Cost behavior

- Each run costs **N** Replicate predictions (where N ≤ 10).
- You control N by editing the `Generate N … images` line in `config/prompt.txt`.
- Failed slots still count as attempted work for that run but are not retried, so you do not get surprise extra calls.

## Key modules

All logic lives in `src/generate-posters.ts`:

- `parseConfig` — NLP-style field extraction with defaults
- `buildPrompt` — per-subject prompt assembly
- `generateImage` — single Replicate call → image `Buffer`
- `saveAsPrintReady` — `sharp` resize to `widthInches * dpi` × `heightInches * dpi`, sRGB PNG
