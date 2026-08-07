from __future__ import annotations
import asyncio
import json
import os
import re
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx
from ..models import ManifestItem, NicheManifest
from ..paths import repo_path
from .common import download

THEME_KEYWORDS = [
    (
        "pixar/3d portrait",
        re.compile(
            r"pixar|3d portrait|animated style|cartoon portrait|disney[- ]?style", re.I
        ),
    ),
    (
        "couple portrait",
        re.compile(
            r"\bcouple\b|anniversary|wedding portrait|boyfriend|girlfriend", re.I
        ),
    ),
    (
        "family portrait",
        re.compile(r"\bfamily\b|parents|kids portrait|group portrait", re.I),
    ),
    (
        "pet portrait",
        re.compile(r"\bpet\b|\bdog\b|\bcat\b|puppy|kitten|animal portrait", re.I),
    ),
    ("gift", re.compile(r"\bgift\b|present|keepsake", re.I)),
    (
        "custom from photo",
        re.compile(r"from photo|photo to|custom portrait|turn.*photo", re.I),
    ),
    (
        "botanical/floral",
        re.compile(
            r"botanic|floral|flower|leaf|fern|plant|garden|gingham flowers", re.I
        ),
    ),
    (
        "nursery/kids",
        re.compile(r"nursery|kids?|children|baby|woodland|moose|bow|coquette", re.I),
    ),
    ("abstract", re.compile(r"abstract|geometric|line art|minimal", re.I)),
    (
        "typography",
        re.compile(r"quote|typography|lettering|wall quote|love word", re.I),
    ),
    ("japandi|scandi", re.compile(r"japandi|scandi|nordic|zen|wabi", re.I)),
    (
        "kitchen/food",
        re.compile(r"kitchen|coffee|culinary|recipe|bakery|baking|food", re.I),
    ),
    (
        "travel",
        re.compile(r"travel|city|map|vintage travel|wanderlust|tourism|vacation", re.I),
    ),
    (
        "seasonal",
        re.compile(r"christmas|xmas|halloween|valentine|autumn|fall|new year", re.I),
    ),
    ("clipart", re.compile(r"clip\s?art|clipart|png", re.I)),
    (
        "digital paper",
        re.compile(r"digital paper|seamless|scrapbook|pattern pack", re.I),
    ),
    (
        "bundle/set",
        re.compile(r"\bset of\b|\bbundle\b|\bgallery wall\b|\bpack\b", re.I),
    ),
    (
        "printable/digital",
        re.compile(r"printable|digital download|instant download|digital art", re.I),
    ),
]


def _shops_config() -> Dict[str, Any]:
    return json.loads(
        repo_path("contracts", "shops.v1.json").read_text(encoding="utf-8")
    )


def load_shops() -> List[Dict[str, Any]]:
    return list(_shops_config().get("shops") or [])


def get_shop(slug_or_url: str) -> Dict[str, Any]:
    key = slug_or_url.strip().rstrip("/")
    cfg = _shops_config()
    for shop in cfg.get("shops") or []:
        if shop["slug"] == key or shop["shopUrl"].rstrip("/") == key:
            return shop
        if shop["name"].lower() == key.lower():
            return shop
    if "etsy.com" in key and "/shop/" in key:
        name = key.split("/shop/")[-1].split("?")[0].split("/")[0]
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        return {
            "slug": slug,
            "name": name,
            "shopUrl": key.split("?")[0],
            "notes": "Ad-hoc shop scrape",
            "limit": int(cfg.get("defaultLimit", 12)),
            "signals": [],
            "hypotheses": [
                "Inspect sampled titles and thumbs for recurring gift angles and styles.",
                "Prefer digital-download clear labeling in any inspired listings.",
                "Build **original** products only — do not copy seller art or titles.",
            ],
        }
    raise ValueError(
        f"Unknown shop '{slug_or_url}'. Add it to contracts/shops.v1.json or pass a full Etsy shop URL."
    )


async def _scrape_shop_listings(shop_url: str, limit: int) -> List[dict]:
    """Node Playwright only (paginated). Use --from-json if Etsy bot-walls the browser."""
    import subprocess
    import tempfile

    root = repo_path()
    script = root / "scripts" / "scrape-shop.cjs"
    if not script.is_file():
        raise FileNotFoundError(f"Missing shop scraper: {script}")
    with tempfile.TemporaryDirectory() as tmp:
        out_json = Path(tmp) / "listings.json"
        cmd = ["node", str(script), shop_url, str(limit), str(out_json)]
        try:
            completed = subprocess.run(
                cmd,
                cwd=str(root),
                capture_output=True,
                text=True,
                timeout=360,
                shell=(os.name == "nt"),
            )
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"Node scrape failed to start: {exc}") from exc
        if completed.stdout.strip():
            print(completed.stdout.strip())
        if completed.returncode != 0:
            err = (completed.stderr or completed.stdout or "").strip()
            raise RuntimeError(f"Node scrape exit {completed.returncode}: {err[:500]}")
        if not out_json.is_file():
            raise RuntimeError("Node scrape produced no output JSON")
        data = json.loads(out_json.read_text(encoding="utf-8"))
        return list(data) if isinstance(data, list) else []


def _theme_counts(titles: List[str]) -> Counter:
    counts: Counter = Counter()
    for title in titles:
        matched = False
        for label, pattern in THEME_KEYWORDS:
            if pattern.search(title):
                counts[label] += 1
                matched = True
        if not matched:
            counts["other/unclassified"] += 1
    return counts


def _shop_signal_blocks(shop: Dict[str, Any]) -> List[str]:
    signals = list(shop.get("signals") or [])
    hypotheses = list(shop.get("hypotheses") or [])
    if not signals and not hypotheses:
        return [
            "## Shop-level public signals",
            "",
            f"- See contracts notes: {shop.get('notes', '')}",
        ]
    lines: List[str] = [
        "## Shop-level public signals (manual observation)",
        "",
        "Observed on the live shop page (not from private analytics):",
        "",
    ]
    for s in signals:
        lines.append(f"- {s}")
    if hypotheses:
        lines.extend(["", "## What appears to “work” here (hypotheses)", ""])
        for i, h in enumerate(hypotheses, start=1):
            lines.append(f"{i}. {h}")
    return lines


def write_shop_pattern_notes(shop: Dict[str, Any], manifest: NicheManifest) -> Path:
    """Public-signal pattern notes from listing titles (not private sales data)."""
    titles = [item.title for item in manifest.items]
    counts = _theme_counts(titles)
    docs_dir = repo_path("docs")
    docs_dir.mkdir(parents=True, exist_ok=True)
    out = docs_dir / f"SHOP_{shop['slug'].upper().replace('-', '_')}.md"
    lines = [
        f"# Shop study: {shop['name']}",
        "",
        f"**Shop URL:** {shop['shopUrl']}",
        f"**Fetched (UTC):** {manifest.fetchedAt}",
        f"**Listings sampled:** {len(manifest.items)} (deep sample / visible cards, not full catalog)",
        "",
        "## Important limits",
        "",
        "- Etsy does **not** expose true sales ranks to scrapers.",
        "- This study uses **public listing titles + thumbs** on the shop page as directional signals only.",
        "- Inspiration only — do **not** copy compositions, titles, tags, or mockups.",
        "",
    ]
    lines.extend(_shop_signal_blocks(shop))
    lines.extend(
        [
            "",
            "## Observed theme signals (from sampled titles)",
            "",
            "| Theme keyword | Count in sample |",
            "| --- | ---: |",
        ]
    )
    for theme, n in counts.most_common():
        lines.append(f"| {theme} | {n} |")
    lines.extend(
        [
            "",
            "## Sampled listings",
            "",
            "| # | Title | Listing | Local ref |",
            "| --- | --- | --- | --- |",
        ]
    )
    for item in manifest.items:
        safe_title = item.title.replace("|", "/")
        lines.append(
            f"| {item.index} | {safe_title} | {item.listingUrl} | `{item.localPath}` |"
        )
    lines.extend(
        [
            "",
            "## Next steps for this repo",
            "",
            "1. `analyze` the saved thumbs (style/palette only) if Replicate credit allows.",
            "2. `prompt` original concepts inspired by the strongest gift themes (not trademarked brand names).",
            "3. Keep scope clear: our TS generator is print-ready posters unless you expand product types on purpose.",
            "",
            f"_Shop notes from contracts:_ {shop.get('notes', '')}",
            "",
        ]
    )
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[shop] pattern notes -> {out.relative_to(repo_path()).as_posix()}")
    return out


async def collect_shop(
    slug_or_url: str,
    limit: Optional[int] = None,
    from_json: Optional[str] = None,
) -> NicheManifest:
    shop = get_shop(slug_or_url)
    limit = limit or int(shop.get("limit") or 12)
    slug = shop["slug"]
    refs_dir = repo_path("data", "research", "refs", slug)
    refs_dir.mkdir(parents=True, exist_ok=True)
    manifests_dir = repo_path("data", "research", "manifests")
    manifests_dir.mkdir(parents=True, exist_ok=True)
    if from_json:
        raw_path = Path(from_json)
        if not raw_path.is_absolute():
            raw_path = repo_path(from_json)
        raw_items = json.loads(raw_path.read_text(encoding="utf-8-sig"))
        if not isinstance(raw_items, list):
            raise ValueError(f"--from-json must be a JSON array: {raw_path}")
        print(f"[shop] loaded {len(raw_items)} listings from {raw_path}")
    else:
        try:
            raw_items = await _scrape_shop_listings(shop["shopUrl"], limit)
        except Exception as exc:  # noqa: BLE001
            print(f"[shop] scrape failed for {slug}: {exc}")
            print(
                "[shop] Tip: use --from-json with a saved listings array, or install Node Playwright"
            )
            raw_items = []
    items: List[ManifestItem] = []
    async with httpx.AsyncClient(
        headers={"User-Agent": "etsy-posters-research/1.0"},
        follow_redirects=True,
    ) as client:
        for i, raw in enumerate(raw_items[:limit], start=1):
            local_path = refs_dir / f"{i:02d}.jpg"
            try:
                await download(client, raw["imageUrl"], local_path)
            except Exception as exc:  # noqa: BLE001
                print(f"[shop] download failed ({raw['imageUrl']}): {exc}")
                continue
            rel = local_path.relative_to(repo_path()).as_posix()
            items.append(
                ManifestItem(
                    index=i,
                    title=raw["title"],
                    listingUrl=raw["listingUrl"],
                    imageUrl=raw["imageUrl"],
                    localPath=rel,
                )
            )
            time.sleep(0.4)
    manifest = NicheManifest(
        nicheSlug=slug,
        searchPhrase=shop["shopUrl"],
        fetchedAt=datetime.now(timezone.utc).isoformat(),
        items=items,
    )
    out_path = manifests_dir / f"{slug}.json"
    out_path.write_text(json.dumps(manifest.model_dump(), indent=2), encoding="utf-8")
    print(f"[shop] {slug}: saved {len(items)} refs -> {out_path}")
    write_shop_pattern_notes(shop, manifest)
    return manifest


def collect_shop_sync(
    slug_or_url: str,
    limit: Optional[int] = None,
    from_json: Optional[str] = None,
) -> NicheManifest:
    return asyncio.run(collect_shop(slug_or_url, limit=limit, from_json=from_json))
