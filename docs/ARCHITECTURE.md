# Architecture

## Goal

Accept a **natural-language** idea, structure it on the backend, save a unique prompt file, generate **N** print-ready poster PNGs, and append a row to `docs/POSTERS.md`. A separate Python research app can crawl niche refs and emit compatible structured prompts into the same pipeline.

## Monorepo layout

```text
contracts/           # shared schemas + MODELS.json + niches (TS + Python)
apps/generator/      # TypeScript poster pipeline + UI
apps/research/       # Python crawl → analyze → prompt → handoff
data/                # config, prompts, output, research refs
docs/
```

Cross-language boundary: **`contracts/`**. Field names for `PosterConfig` must match in both runtimes. Model IDs and `maxImages` live in `contracts/MODELS.json`.

## Model

Image generation (TypeScript only):

- `black-forest-labs/flux-kontext-pro` (from `contracts/MODELS.json` → `imageModel`)

Vision analysis (Python research):

- `yorickvp/llava-13b` (from `contracts/MODELS.json` → `visionModel`)

There is no second image-generation stack in Python.

## Generator flow

See [WORKFLOW.md](WORKFLOW.md). Summary:

1. Receive NLP (UI or `--file`).
2. Structure into labeled fields + creative brief (`apps/generator/src/prompt/structure.ts`).
3. Save `data/prompts/<timestamp>-<slug>.txt`.
4. For each slot: build final prompt → one Replicate call.
5. Save print-ready PNG via `sharp` to `data/output/<runId>-poster-XX.png`.
6. Append run metadata to `docs/POSTERS.md`.

## Research flow

See [RESEARCH_PIPELINE.md](RESEARCH_PIPELINE.md). Summary:

1. Load niches from `contracts/niches.v1.json` (top 3 × 5 refs).
2. Crawl Etsy (or `--from-urls`) → `data/research/refs/` + manifests.
3. Vision/heuristic style features → `*.style.json`.
4. Emit structured prompts matching the TS labeled dialect → `data/prompts/research-*.txt`.
5. Hand off via `npm run dev -- --file …` (or HTTP `/api/generate`).

## Boundary conditions

| Rule | Behavior |
|------|----------|
| Max images | `contracts/MODELS.json` → `maxImages` (default 4) |
| API calls | Exactly one image call per slot → total = N |
| Retries | None |
| Fallback image models | None |
| Subject invention | Forbidden — only subjects supported by the input |
| Extra features | No listings, mockups, SEO, or alternate sizes |

## Cost behavior

- Each generator run costs **N** Replicate image predictions (N ≤ hard cap).
- Research vision adds one vision call per reference image when enabled.
- Failed slots are not retried.

## Key modules

### TypeScript (`apps/generator`)

| Module | Role |
|--------|------|
| `src/config/` | `PosterConfig` types, defaults, parse, load MODELS |
| `src/prompt/` | NLP → structured text; build model prompt |
| `src/generate/` | Replicate + sharp print prep |
| `src/workflow/run.ts` | Six-step orchestrator |
| `src/track/posters.ts` | Append `docs/POSTERS.md` |
| `src/cli.ts` / `src/server.ts` | CLI + local UI |

### Python (`apps/research`)

| Module | Role |
|--------|------|
| `research_pipeline/models.py` | Pydantic ↔ contracts |
| `crawl/etsy.py` | Playwright collect |
| `analyze/vision.py` | Style features |
| `prompt/build.py` | Structured prompt writer |
| `handoff/to_generator.py` | npm / HTTP handoff |
| `cli.py` | `collect \| analyze \| prompt \| generate \| run-all` |
