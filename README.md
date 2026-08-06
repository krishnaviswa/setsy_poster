# Etsy Posters

Minimal Node + TypeScript tool that takes a natural-language idea, structures it on the backend, saves a unique prompt file, and generates print-ready PNGs via Replicate (`black-forest-labs/flux-kontext-pro`). Runs are logged in `docs/POSTERS.md`. See `docs/WORKFLOW.md` for the step-by-step flow.

## Prerequisites

- Node.js 18+
- A [Replicate](https://replicate.com) account and API token

## Quick start

```bash
npm install
cp .env.example .env
```

Add your token to `.env` (`REPLICATE_API_TOKEN=...`), then:

```bash
npm run ui
```

Open [http://localhost:8787](http://localhost:8787), paste your idea, click **Submit**.

CLI:

```bash
npm run dev
npm run dev -- --file "config/Ganesha.txt"
```

## Docs

- [Workflow](docs/WORKFLOW.md) — NLP → structure → save → API → track
- [Poster log](docs/POSTERS.md) — history of generated runs
- [Architecture](docs/ARCHITECTURE.md) — model, caps, cost behavior
- [Usage](docs/USAGE.md) — editing prompts and troubleshooting
