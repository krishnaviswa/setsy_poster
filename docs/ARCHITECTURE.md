# Architecture

## Goal

Accept a **natural-language** idea, structure it on the backend, save a unique prompt file, generate **N** print-ready poster PNGs, and append a row to `docs/POSTERS.md`. No Etsy listing, mockup, or SEO logic.

## Model

Exactly one hosted model:

- `black-forest-labs/flux-kontext-pro` on [Replicate](https://replicate.com/black-forest-labs/flux-kontext-pro)

There is no model list, no fallback model, and no local GPU inference.

## Flow

See [WORKFLOW.md](WORKFLOW.md) for the six steps. Summary:

1. Receive NLP (UI or `--file`).
2. Structure into labeled fields + creative brief (`src/structure-prompt.ts`).
3. Save `prompts/<timestamp>-<slug>.txt`.
4. For each slot: build final prompt → one Replicate call.
5. Save print-ready PNG via `sharp` to `output/<runId>-poster-XX.png`.
6. Append run metadata to `docs/POSTERS.md`.

## Boundary conditions

| Rule | Behavior |
|------|----------|
| Max images | Hard cap in code (`MAX_IMAGES`) |
| API calls | Exactly one call per slot → total calls = N |
| Retries | None |
| Fallback models | None |
| Subject invention | Forbidden — only subjects supported by the input |
| Extra features | No listings, mockups, SEO, or alternate sizes |

## Cost behavior

- Each run costs **N** Replicate predictions (where N ≤ hard cap).
- You control N via the natural-language prompt (with a hard cap).
- Failed slots are not retried (no surprise extra calls).

## Key modules

- `src/structure-prompt.ts` — NLP → structured prompt text + `Config`
- `src/workflow.ts` — orchestrates the six steps
- `src/generate-posters.ts` — Replicate call + `sharp` print prep + CLI entry
- `src/track-posters.ts` — append to `docs/POSTERS.md`
- `src/server.ts` + `public/index.html` — local paste & submit UI
