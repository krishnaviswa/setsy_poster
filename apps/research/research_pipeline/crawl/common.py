from __future__ import annotations

import re
from pathlib import Path

import httpx

PHYSICAL_HINTS = re.compile(
    r"\b(framed|shipped|shipping|canvas|print on demand|\bpod\b|physical|metal print)\b",
    re.I,
)


def looks_digital(title: str) -> bool:
    return not bool(PHYSICAL_HINTS.search(title or ""))


async def download(client: httpx.AsyncClient, url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    resp = await client.get(url, follow_redirects=True, timeout=60.0)
    resp.raise_for_status()
    dest.write_bytes(resp.content)
