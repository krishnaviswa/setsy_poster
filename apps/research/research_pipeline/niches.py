from __future__ import annotations

import json
from typing import List

from .models import Niche
from .paths import repo_path


def load_niches() -> List[Niche]:
    data = json.loads(repo_path("contracts", "niches.v1.json").read_text(encoding="utf-8"))
    return [Niche.model_validate(n) for n in data["niches"]]


def refs_per_niche() -> int:
    data = json.loads(repo_path("contracts", "niches.v1.json").read_text(encoding="utf-8"))
    return int(data.get("refsPerNiche", 5))
