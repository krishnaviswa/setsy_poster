# Etsy Posters

Monorepo that turns a natural-language idea into print-ready poster PNGs via Replicate (`flux-schnell`), plus a Python research pipeline that studies Etsy niche patterns and emits compatible prompts.

## Layout

```text
contracts/          shared schemas + MODELS.json + niches
apps/generator/     TypeScript poster pipeline + UI
apps/research/      Python collect → analyze → prompt → handoff
data/               config, prompts, output, research refs
docs/
```

## Prerequisites

- Node.js 18+
- Python 3.10+ (for research pipeline)
- A [Replicate](https://replicate.com) account and API token

## Quick start (generator)

```bash
npm install
cp .env.example .env
```

Add `REPLICATE_API_TOKEN=...` to `.env`, then:

```bash
npm run ui
```

Open [http://localhost:8787](http://localhost:8787), paste your idea, click **Submit**.

CLI:

```bash
npm run dev
npm run dev -- --file "data/config/Ganesha.txt"
```

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd run ui`.

## Research pipeline

```bash
python -m pip install -r apps/research/requirements.txt
python -m playwright install chromium

npm run research:collect
npm run research:analyze
npm run research:prompt
npm run research:generate
```

See [docs/RESEARCH_PIPELINE.md](docs/RESEARCH_PIPELINE.md).

## Docs

- [Workflow](docs/WORKFLOW.md) — NLP → structure → save → API → track
- [Architecture](docs/ARCHITECTURE.md) — monorepo, contracts, caps
- [Research pipeline](docs/RESEARCH_PIPELINE.md) — crawl / analyze / prompt / handoff
- [Usage](docs/USAGE.md) — prompts and troubleshooting
- [Poster log](docs/POSTERS.md) — generation history
- [Etsy research brief](docs/ETSY_DIGITAL_ART_RESEARCH.md)
