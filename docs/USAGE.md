# Usage

## Web UI (NLP paste & submit)

```bash
npm run ui
```

Open `http://localhost:8787`. Paste a **natural-language** idea (not a rigid template). The backend:

1. Structures the prompt
2. Saves `prompts/<unique>.txt`
3. Calls Replicate
4. Writes PNGs to `output/`
5. Appends a row to `docs/POSTERS.md`

See [WORKFLOW.md](WORKFLOW.md).

## Choose a prompt file

Default CLI file: `config/prompt.txt`.

Pass another file with `--file`:

```bash
npm run dev -- --file "customprompt.txt"
npm run dev -- --file "config/Ganesha.txt"
npx ts-node src/generate-posters.ts --file "customprompt.txt"
```

The same NLP → structure → save → generate → track workflow runs.

## Change the theme

Describe what you want in plain language (or edit a text file and pass `--file`). Mention count (“3 posters”), size (“18x24 inches at 300 DPI”), and subjects when you know them.

## Change the number of images

Say it in the prompt (e.g. “Generate 3 … images” or “3 posters”). Hard cap still applies in code.

## Change size / DPI

Mention size in the prompt, e.g. `18x24 inches at 300 DPI`.

Final pixel size = `widthInches × dpi` by `heightInches × dpi`.

## Example NLP prompts

### Woodland nursery

```text
Make 3 vertical nursery wall posters in a soft vintage storybook style.
Muted sage green, cream, rust, and warm brown. Centered on a clean cream background, no text.
Subjects: a friendly fox, a friendly bear, and a friendly deer. 18x24 inches at 300 DPI.
```

### Space-themed nursery

```text
Create 3 coordinated space nursery posters, soft storybook look, navy cream soft gold dusty lavender.
Centered cream background, no watermark. Rocket, crescent moon, and star cluster. 18x24 at 300 DPI.
```

### Ocean-themed nursery

```text
3 ocean nursery posters, soft vintage storybook, seafoam cream coral teal.
Centered compositions, no text. Whale, seahorse, sea turtle. Format 18x24 inches 300 DPI.
```

## If you get errors

1. **Token** — Ensure `.env` has a valid `REPLICATE_API_TOKEN`.
2. **Model** — Must stay `black-forest-labs/flux-kontext-pro`.
3. **Empty prompt** — Submit non-empty text.
4. **Network / billing** — Check Replicate balance and connectivity.

Failed slots are logged and skipped; no retries. Check `docs/POSTERS.md` for the run row.
