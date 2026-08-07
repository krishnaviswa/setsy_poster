from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

import httpx

from ..paths import find_repo_root, repo_path


def latest_research_prompts() -> List[Path]:
    prompts_dir = repo_path("data", "prompts")
    if not prompts_dir.is_dir():
        return []
    files = sorted(
        prompts_dir.glob("research-*.txt"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    # Keep the newest prompt per niche slug (research-<slug>-timestamp.txt)
    seen: set[str] = set()
    out: List[Path] = []
    for f in files:
        parts = f.stem.split("-")
        # research-<slug parts...>-YYYYMMDD-HHMMSS
        if len(parts) < 3:
            continue
        # niche slug is between research- and last two timestamp segments
        slug = "-".join(parts[1:-2]) if len(parts) >= 4 else parts[1]
        if slug in seen:
            continue
        seen.add(slug)
        out.append(f)
    return out


def run_generator_cli(prompt_file: Path) -> int:
    """Invoke TS generator via npm.cmd (Windows-safe) or npm."""
    root = find_repo_root()
    rel = prompt_file.relative_to(root).as_posix()
    npm = "npm.cmd" if os.name == "nt" else "npm"
    cmd = [npm, "run", "dev", "--", "--file", rel]
    print(f"[handoff] {' '.join(cmd)}")
    completed = subprocess.run(cmd, cwd=str(root))
    return completed.returncode


def run_generator_http(prompt_text: str, base_url: str = "http://127.0.0.1:8787") -> dict:
    resp = httpx.post(
        f"{base_url.rstrip('/')}/api/generate",
        json={"prompt": prompt_text},
        timeout=600.0,
    )
    resp.raise_for_status()
    return resp.json()


def generate_from_latest(use_http: bool = False) -> None:
    prompts = latest_research_prompts()
    if not prompts:
        print("[handoff] No research-*.txt prompts found. Run `prompt` first.")
        sys.exit(1)

    for prompt_file in prompts:
        print(f"[handoff] generating from {prompt_file.name}")
        if use_http:
            text = prompt_file.read_text(encoding="utf-8")
            result = run_generator_http(text)
            print(f"[handoff] HTTP result keys: {list(result.keys())}")
        else:
            code = run_generator_cli(prompt_file)
            if code != 0:
                raise SystemExit(code)
