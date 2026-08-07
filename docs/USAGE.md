# Usage

## Web UI (NLP paste & submit)

```bash
npm run ui
```

Open `http://localhost:8787`. Paste a **natural-language** idea (not a rigid template). The backend:

1. Structures the prompt
2. Saves `data/prompts/<unique>.txt`
3. Calls Replicate
4. Writes PNGs to `data/output/`
5. Appends a row to `docs/POSTERS.md`

See [WORKFLOW.md](WORKFLOW.md).

## Choose a prompt file

Default CLI file: `data/config/prompt.txt`.

Pass another file with `--file` (path relative to repo root):

```bash
npm run dev -- --file "data/config/Ganesha.txt"
npm run dev -- --file "data/prompts/research-nursery-storybook-animals-….txt"
```

The same NLP → structure → save → generate → track workflow runs.

## Research pipeline (Python)

See [RESEARCH_PIPELINE.md](RESEARCH_PIPELINE.md).

```bash
python -m pip install -r apps/research/requirements.txt
python -m playwright install chromium
npm run research:collect
npm run research:analyze -- --no-vision   # optional offline style
npm run research:prompt
```

## Change the theme

Describe what you want in plain language (or edit a text file and pass `--file`). Mention count (“3 posters”), size (“18x24 inches at 300 DPI”), and subjects when you know them.

## Change the number of images

Say it in the prompt (e.g. “Generate 3 … images” or “3 posters”). Hard cap comes from `contracts/MODELS.json` (`maxImages`).

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
2. **Model** — Image model must match `contracts/MODELS.json` → `imageModel`.
3. **Empty prompt** — Submit non-empty text.
4. **Network / billing** — Check Replicate balance and connectivity.
5. **PowerShell + npm** — If scripts are blocked, use `npm.cmd run ui` or `& "C:\Program Files\nodejs\npm.cmd" run ui`.

Failed slots are logged and skipped; no retries. Check `docs/POSTERS.md` for the run row.
