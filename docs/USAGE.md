# Usage

## Choose a prompt file

Default: `config/prompt.txt`.

Pass another file with `--file` (path is relative to the project folder unless absolute):

```bash
npm run dev -- --file "customprompt.txt"
npm run dev -- --file "config/space-nursery.txt"
npx ts-node src/generate-posters.ts --file "customprompt.txt"
```

## Change the theme

Edit `config/prompt.txt` (or your `--file` target). The first line sets both the count and the theme (text after `images for`).

## Change the number of images

Change the number in the first line:

```text
Generate 3 vertical poster images for …
```

to, for example:

```text
Generate 5 vertical poster images for …
```

Hard cap: **10** images per run. If you ask for more, the script caps at 10 and logs a warning.

If you list fewer subjects than `count`, subjects cycle (`subjects[i % length]`). The script never invents new subjects.

## Change size / DPI

Edit the `Format:` line. Examples:

```text
Format: 18x24 inches at 300 DPI, suitable for nursery wall art.
Format: 12x16 inches at 300 DPI, suitable for nursery wall art.
Format: 8x10 inches at 300 DPI, suitable for nursery wall art.
```

Final pixel size = `widthInches × dpi` by `heightInches × dpi` (e.g. 18×24 @ 300 DPI → 5400×7200).

## Example configs

### Woodland nursery (default)

```text
Generate 3 vertical poster images for a coordinated set of woodland nursery wall art.
Style: soft vintage storybook style.
Colors: muted sage green, cream, rust, and warm brown.
Composition: centered compositions, clean cream background, no text, no watermark.
Subjects: a friendly-looking fox, a friendly-looking bear, and a friendly-looking deer.
Format: 18x24 inches at 300 DPI, suitable for nursery wall art.
```

### Space-themed nursery

```text
Generate 3 vertical poster images for a coordinated set of space-themed nursery wall art.
Style: soft vintage storybook style.
Colors: muted navy, cream, soft gold, and dusty lavender.
Composition: centered compositions, clean cream background, no text, no watermark.
Subjects: a friendly-looking rocket, a friendly-looking crescent moon, and a friendly-looking star cluster.
Format: 18x24 inches at 300 DPI, suitable for nursery wall art.
```

### Ocean-themed nursery

```text
Generate 3 vertical poster images for a coordinated set of ocean-themed nursery wall art.
Style: soft vintage storybook style.
Colors: muted seafoam, cream, coral, and soft teal.
Composition: centered compositions, clean cream background, no text, no watermark.
Subjects: a friendly-looking whale, a friendly-looking seahorse, and a friendly-looking sea turtle.
Format: 18x24 inches at 300 DPI, suitable for nursery wall art.
```

## If you get errors

1. **Token** — Ensure `.env` exists and `REPLICATE_API_TOKEN` is a valid Replicate API token (not the placeholder from `.env.example`).
2. **Model name** — Must stay `black-forest-labs/flux-kontext-pro` (set in `src/generate-posters.ts`).
3. **Config shape** — Include a line like `Generate N … images for …` plus labeled `Style:`, `Colors:`, `Composition:`, `Subjects:`, and `Format:` lines.
4. **Network / billing** — Check your Replicate account balance and that the machine can reach `api.replicate.com`.

Failed slots are logged and skipped; the script continues to the next image without retrying.
