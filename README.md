# Etsy Posters

Minimal Node + TypeScript tool that reads one natural-language paragraph from `config/prompt.txt` and generates up to 10 print-ready PNG posters via a single Replicate model (`black-forest-labs/flux-kontext-pro`). No local GPU required — inference is hosted only. See `docs/` for architecture and usage details.

## Prerequisites

- Node.js 18+
- A [Replicate](https://replicate.com) account and API token

## Quick start

```bash
npm install
cp .env.example .env
```

Add your token to `.env` (`REPLICATE_API_TOKEN=...`), edit `config/prompt.txt`, then:

```bash
npm run dev
```

Or pass a custom prompt file:

```bash
npm run dev -- --file "customprompt.txt"
```

Print-ready PNGs are written to `output/poster-01.png`, `poster-02.png`, etc.

## Web UI

Start a simple local page to paste a prompt and submit:

```bash
npm run ui
```

Open [http://localhost:8787](http://localhost:8787), paste your structured prompt, click **Submit**.

## Docs

- [Architecture](docs/ARCHITECTURE.md) — flow, model, caps, cost behavior
- [Usage](docs/USAGE.md) — editing the config, examples, troubleshooting
