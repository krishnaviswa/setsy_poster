# Research pipeline

Python app under `apps/research` that collects Etsy niche references, extracts style features, writes **original** structured prompts compatible with the TypeScript generator, and hands off generation.

## Setup

```bash
# from repo root
python -m pip install -r apps/research/requirements.txt
python -m playwright install chromium
```

Requires root `.env` with `REPLICATE_API_TOKEN` (shared with the generator).

## Commands

From repo root:

```bash
npm run research:collect          # crawl top 3 niches × 5 thumbs
npm run research:analyze          # vision (or heuristic fallback)
npm run research:prompt           # write data/prompts/research-*.txt
npm run research:generate         # npm run dev -- --file …
npm run research:all              # full pipeline

# equivalents
node scripts/research.cjs collect
node scripts/research.cjs analyze --no-vision
node scripts/research.cjs run-all --skip-generate
node scripts/research.cjs collect --from-urls https://example.com/a.jpg https://example.com/b.jpg
```

## Niches (v1)

Defined in `contracts/niches.v1.json`:

1. Soft storybook nursery animals — `nursery animal digital art`
2. Warm-neutral botanical gallery — `botanical gallery wall printable`
3. Japandi / Scandi calm — `japandi printable wall art`

## Contracts

| File | Purpose |
|------|---------|
| `contracts/MODELS.json` | image + vision model IDs, maxImages, print defaults |
| `contracts/niches.v1.json` | niche list |
| `contracts/poster-config.schema.json` | shared PosterConfig |
| `contracts/manifest.schema.json` | crawl manifest |
| `contracts/style-features.schema.json` | vision rollup |

Python emits the **same labeled prompt dialect** the TS parser expects:

```text
Generate N vertical poster images for {theme}.
Style: …
Colors: …
Composition: …
Subjects: …
Format: 18x24 inches at 300 DPI, suitable for wall art.

Creative brief:
…
```

## Legal / originality

Reference thumbs are for **market pattern / style extraction only**. Do not copy seller compositions, titles, tags, or mockups. Prompts instruct original subjects and include niche risk notes from the research brief.

## Crawl limitations

Etsy is JS-heavy and may block automated browsers. If crawl fails, use `--from-urls` with images you already have, then continue `analyze` → `prompt` → `generate`.
