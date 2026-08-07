from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class PosterConfig(BaseModel):
    """Mirrors contracts/poster-config.schema.json and TS Config."""

    theme: str
    count: int = Field(ge=1, le=4)
    style: str
    colors: str
    composition: str
    subjects: List[str] = Field(min_length=1)
    widthInches: float = Field(gt=0)
    heightInches: float = Field(gt=0)
    dpi: int = Field(ge=72)
    creativeBrief: Optional[str] = None


class Niche(BaseModel):
    slug: str
    label: str
    style: str
    audience: str
    etsySearchPhrase: str
    buyerIntent: str
    riskNotes: str
    defaultSubjects: List[str]
    suggestedColors: str


class ManifestItem(BaseModel):
    index: int
    title: str
    listingUrl: str
    imageUrl: str
    localPath: str


class NicheManifest(BaseModel):
    nicheSlug: str
    searchPhrase: str
    fetchedAt: str
    items: List[ManifestItem]


class StyleFeatures(BaseModel):
    localPath: str
    medium: str
    palette: List[str]
    lighting: str
    composition: str
    subjectType: str
    texture: str
    typographyPresent: bool
    roomUseGuess: str


class StyleRollup(BaseModel):
    medium: str
    palette: List[str]
    lighting: str
    composition: str
    subjectType: str
    texture: str
    typographyPresent: bool
    roomUseGuess: str


class StyleFeaturesRollup(BaseModel):
    nicheSlug: str
    analyzedAt: str
    perImage: List[StyleFeatures]
    rollup: StyleRollup


def poster_config_to_structured_text(config: PosterConfig) -> str:
    """Emit the labeled dialect TS parseConfig / structureFromNlp understand."""
    brief = (config.creativeBrief or "").strip()
    lines = [
        f"Generate {config.count} vertical poster images for {config.theme}.",
        f"Style: {config.style}.",
        f"Colors: {config.colors}.",
        f"Composition: {config.composition}.",
        f"Subjects: {', '.join(config.subjects)}.",
        (
            f"Format: {config.widthInches:g}x{config.heightInches:g} inches "
            f"at {config.dpi} DPI, suitable for wall art."
        ),
        "",
        "Creative brief:",
        brief or config.theme,
    ]
    return "\n".join(lines)
