from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from ..models import (
    Niche,
    PosterConfig,
    StyleFeaturesRollup,
    poster_config_to_structured_text,
)
from ..niches import load_niches
from ..paths import load_models, repo_path


def _load_style(slug: str) -> Optional[StyleFeaturesRollup]:
    path = repo_path("data", "research", "manifests", f"{slug}.style.json")
    if not path.is_file():
        return None
    return StyleFeaturesRollup.model_validate(
        json.loads(path.read_text(encoding="utf-8"))
    )


def build_poster_config(niche: Niche, style: Optional[StyleFeaturesRollup]) -> PosterConfig:
    models = load_models()
    max_images = int(models.get("maxImages", 4))
    subjects = list(niche.defaultSubjects)[:max_images]
    count = min(len(subjects), max_images) or 1

    if style:
        colors = ", ".join(style.rollup.palette) if style.rollup.palette else niche.suggestedColors
        composition = (
            f"{style.rollup.composition}, no text, no watermark, print-ready wall art"
        )
        style_line = f"{niche.style}; inspired by market patterns: {style.rollup.medium}, {style.rollup.texture}"
    else:
        colors = niche.suggestedColors
        composition = "centered composition, clean background, no text, no watermark"
        style_line = niche.style

    brief = (
        f"Original {niche.label} set for {niche.audience}. "
        f"Buyer intent: {niche.buyerIntent}. "
        f"Create ORIGINAL artwork inspired by niche patterns only — "
        f"do not copy any reference listing. Risk notes: {niche.riskNotes}."
    )

    return PosterConfig(
        theme=niche.label,
        count=count,
        style=style_line,
        colors=colors,
        composition=composition,
        subjects=subjects,
        widthInches=float(models.get("defaultWidthInches", 18)),
        heightInches=float(models.get("defaultHeightInches", 24)),
        dpi=int(models.get("defaultDpi", 300)),
        creativeBrief=brief,
    )


def write_prompt_for_niche(niche: Niche) -> Path:
    style = _load_style(niche.slug)
    config = build_poster_config(niche, style)
    text = poster_config_to_structured_text(config)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    prompts_dir = repo_path("data", "prompts")
    prompts_dir.mkdir(parents=True, exist_ok=True)
    out = prompts_dir / f"research-{niche.slug}-{stamp}.txt"
    out.write_text(text, encoding="utf-8")
    print(f"[prompt] wrote {out.relative_to(repo_path()).as_posix()}")
    return out


def write_prompts_all() -> List[Path]:
    paths: List[Path] = []
    for niche in load_niches():
        paths.append(write_prompt_for_niche(niche))
    return paths
