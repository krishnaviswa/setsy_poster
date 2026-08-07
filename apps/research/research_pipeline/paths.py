from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


def find_repo_root(start: Path | None = None) -> Path:
    start = (start or Path.cwd()).resolve()
    for candidate in [start, *start.parents]:
        if (candidate / "contracts" / "MODELS.json").is_file():
            return candidate
    # apps/research/research_pipeline → repo root
    module_root = Path(__file__).resolve().parents[3]
    if (module_root / "contracts" / "MODELS.json").is_file():
        return module_root
    raise RuntimeError(
        "Could not find repo root (expected contracts/MODELS.json). "
        "Run from the monorepo root."
    )


def repo_path(*parts: str) -> Path:
    return find_repo_root().joinpath(*parts)


@lru_cache(maxsize=1)
def load_models() -> dict:
    path = repo_path("contracts", "MODELS.json")
    return json.loads(path.read_text(encoding="utf-8"))
