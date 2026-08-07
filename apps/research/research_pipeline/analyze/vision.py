from __future__ import annotations

import base64
import json
import os
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

from ..models import (
    NicheManifest,
    StyleFeatures,
    StyleFeaturesRollup,
    StyleRollup,
)
from ..niches import load_niches
from ..paths import load_models, repo_path

VISION_PROMPT = """Analyze this printable wall-art reference for STYLE FEATURES only.
Do NOT describe how to copy the artwork. Return JSON only with keys:
medium, palette (array of 3-5 color names), lighting, composition,
subjectType, texture, typographyPresent (boolean), roomUseGuess.
Keep values short."""


def _load_env() -> None:
    load_dotenv(repo_path(".env"))


def _encode_image(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def _parse_json_blob(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))
        raise


def _heuristic_features(local_path: str, niche_style: str) -> StyleFeatures:
    """Offline fallback when Replicate vision is unavailable."""
    return StyleFeatures(
        localPath=local_path,
        medium=niche_style or "illustrated print",
        palette=["cream", "muted sage", "warm brown"],
        lighting="soft even lighting",
        composition="centered subject, clean background",
        subjectType="decor print subject",
        texture="soft paper / watercolor texture",
        typographyPresent=False,
        roomUseGuess="home wall art",
    )


def analyze_image_with_replicate(image_path: Path, local_rel: str) -> StyleFeatures:
    _load_env()
    token = os.getenv("REPLICATE_API_TOKEN", "")
    if not token or token == "your_replicate_api_token_here":
        raise RuntimeError("REPLICATE_API_TOKEN missing")

    import replicate

    models = load_models()
    vision_model = models["visionModel"]
    data_uri = f"data:image/jpeg;base64,{_encode_image(image_path)}"

    output = replicate.run(
        vision_model,
        input={
            "image": data_uri,
            "prompt": VISION_PROMPT,
        },
    )
    if isinstance(output, list):
        text = "".join(str(x) for x in output)
    else:
        text = str(output)

    data = _parse_json_blob(text)
    palette = data.get("palette") or ["cream", "muted tones"]
    if isinstance(palette, str):
        palette = [p.strip() for p in palette.split(",") if p.strip()]
    return StyleFeatures(
        localPath=local_rel,
        medium=str(data.get("medium") or "illustrated print"),
        palette=list(palette)[:5],
        lighting=str(data.get("lighting") or "soft lighting"),
        composition=str(data.get("composition") or "centered composition"),
        subjectType=str(data.get("subjectType") or "decor subject"),
        texture=str(data.get("texture") or "soft texture"),
        typographyPresent=bool(data.get("typographyPresent", False)),
        roomUseGuess=str(data.get("roomUseGuess") or "home décor"),
    )


def _rollup(features: List[StyleFeatures]) -> StyleRollup:
    if not features:
        return StyleRollup(
            medium="illustrated print",
            palette=["cream", "muted tones"],
            lighting="soft lighting",
            composition="centered composition, no text, no watermark",
            subjectType="original decor subject",
            texture="soft texture",
            typographyPresent=False,
            roomUseGuess="home wall art",
        )

    def majority(values: List[str]) -> str:
        return Counter(values).most_common(1)[0][0]

    palette: List[str] = []
    for f in features:
        for c in f.palette:
            if c not in palette:
                palette.append(c)
    return StyleRollup(
        medium=majority([f.medium for f in features]),
        palette=palette[:5],
        lighting=majority([f.lighting for f in features]),
        composition=majority([f.composition for f in features]),
        subjectType=majority([f.subjectType for f in features]),
        texture=majority([f.texture for f in features]),
        typographyPresent=any(f.typographyPresent for f in features),
        roomUseGuess=majority([f.roomUseGuess for f in features]),
    )


def analyze_niche(slug: str, use_vision: bool = True) -> StyleFeaturesRollup:
    manifest_path = repo_path("data", "research", "manifests", f"{slug}.json")
    if not manifest_path.is_file():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}. Run collect first.")

    manifest = NicheManifest.model_validate(
        json.loads(manifest_path.read_text(encoding="utf-8"))
    )
    niche = next((n for n in load_niches() if n.slug == slug), None)
    niche_style = niche.style if niche else "illustrated print"

    per_image: List[StyleFeatures] = []
    for item in manifest.items:
        abs_path = repo_path(item.localPath)
        if not abs_path.is_file():
            print(f"[analyze] missing file {item.localPath}, skipping")
            continue
        try:
            if use_vision:
                feat = analyze_image_with_replicate(abs_path, item.localPath)
            else:
                feat = _heuristic_features(item.localPath, niche_style)
        except Exception as exc:  # noqa: BLE001
            print(f"[analyze] vision failed for {item.localPath}: {exc}; using heuristic")
            feat = _heuristic_features(item.localPath, niche_style)
        per_image.append(feat)

    rollup = StyleFeaturesRollup(
        nicheSlug=slug,
        analyzedAt=datetime.now(timezone.utc).isoformat(),
        perImage=per_image,
        rollup=_rollup(per_image),
    )
    out = repo_path("data", "research", "manifests", f"{slug}.style.json")
    out.write_text(json.dumps(rollup.model_dump(), indent=2), encoding="utf-8")
    print(f"[analyze] wrote {out}")
    return rollup


def analyze_all(use_vision: bool = True) -> List[StyleFeaturesRollup]:
    results: List[StyleFeaturesRollup] = []
    for niche in load_niches():
        manifest = repo_path("data", "research", "manifests", f"{niche.slug}.json")
        if not manifest.is_file():
            print(f"[analyze] skip {niche.slug} (no manifest)")
            continue
        results.append(analyze_niche(niche.slug, use_vision=use_vision))
    return results
