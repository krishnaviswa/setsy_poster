---
name: Simple prompt submit UI
overview: Add a minimal local web page with a prompt textarea and Submit button. On submit, parse the text with the existing structured parser and run the same Replicate generation flow, saving PNGs to output/.
todos:
  - id: extract-runner
    content: Extract runGeneration() from generate-posters.ts; keep CLI working
    status: completed
  - id: server-page
    content: Add src/server.ts + public/index.html with prompt form and POST /api/generate
    status: completed
  - id: scripts-docs
    content: Add npm run ui and short README note
    status: completed
isProject: false
---

# Simple prompt submit UI

## Behavior

- One local page: paste a structured prompt → **Submit** → generate posters.
- Reuse existing logic in `[src/generate-posters.ts](src/generate-posters.ts)`: `parseConfig` → `buildPrompt` → `generateImage` → `saveAsPrintReady`.
- Same rules: hard cap (current `MAX_IMAGES`), no retries, one model, save to `output/poster-XX.png`.
- You write the prompt however you like (e.g. with Perplexity); for best results include lines like `Generate N … images`, `Style:`, `Colors:`, `Composition:`, `Subjects:`, `Format:` — missing fields still get defaults + warnings.

```mermaid
flowchart LR
  page[public/index.html] -->|POST prompt text| server[src/server.ts]
  server --> parse[parseConfig]
  parse --> loop[for each slot]
  loop --> gen[generateImage]
  gen --> save[saveAsPrintReady]
  save --> out[output/*.png]
  server -->|JSON results| page
```



## Implementation

1. **Extract a shared runner** in `[src/generate-posters.ts](src/generate-posters.ts)`
  - Add `export async function runGeneration(rawText: string)` that contains the parse → cap → loop logic currently in `main()`.
  - Return `{ files: string[], errors: string[], count: number }`.
  - Keep CLI `main()` calling `runGeneration` after reading `--file` / default config.
2. **Add a tiny server** `[src/server.ts](src/server.ts)` (Node `http`, no Express)
  - `GET /` → serve `[public/index.html](public/index.html)`
  - `GET /output/:name` → serve generated PNGs for preview
  - `POST /api/generate` → JSON `{ prompt: string }` → `runGeneration(prompt)` → JSON results
  - Port `8787` (logged on start)
3. **Simple page** `[public/index.html](public/index.html)`
  - Textarea (prefilled with a short example / placeholder of the woodland format)
  - Submit button
  - Status area (“Generating… this can take a few minutes”)
  - On success: list saved filenames + small image previews via `/output/...`
  - Disable submit while a run is in progress
4. **Scripts** in `[package.json](package.json)`
  - `"ui": "ts-node src/server.ts"`
  - Brief note in `[README.md](README.md)`: `npm run ui` then open `http://localhost:8787`

## Out of scope

- No Etsy listing, mockups, SEO, auth, or cloud deploy
- No change to the Replicate model or retry policy

