from __future__ import annotations
import asyncio
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote_plus, urljoin
import httpx
from ..models import ManifestItem, Niche, NicheManifest
from ..niches import load_niches, refs_per_niche
from ..paths import repo_path
from .common import download, looks_digital


def _etsy_search_url(phrase: str) -> str:
    return "https://www.etsy.com/search?q=" + quote_plus(phrase) + "&explicit=1"


async def _crawl_with_playwright(niche: Niche, limit: int) -> List[dict]:
    from playwright.async_api import async_playwright

    results: List[dict] = []
    url = _etsy_search_url(niche.etsySearchPhrase)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            locale="en-US",
        )
        page = await context.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(2500)
        cards = await page.query_selector_all(
            "a[href*='/listing/'], [data-listing-id] a[href*='/listing/']"
        )
        seen: set[str] = set()
        for card in cards:
            if len(results) >= limit:
                break
            href = await card.get_attribute("href")
            if not href or "/listing/" not in href:
                continue
            listing_url = href.split("?")[0]
            if not listing_url.startswith("http"):
                listing_url = urljoin("https://www.etsy.com", listing_url)
            if listing_url in seen:
                continue
            title = (
                (await card.get_attribute("title")) or (await card.inner_text()) or ""
            )
            title = " ".join(title.split())
            if not looks_digital(title):
                continue
            img = await card.query_selector("img")
            image_url = ""
            if img:
                image_url = (
                    (await img.get_attribute("src"))
                    or (await img.get_attribute("data-src"))
                    or ""
                )
            if not image_url:
                continue
            seen.add(listing_url)
            results.append(
                {
                    "title": title or niche.label,
                    "listingUrl": listing_url,
                    "imageUrl": image_url,
                }
            )
        await browser.close()
    return results


def _crawl_from_urls(urls: List[str], niche: Niche) -> List[dict]:
    """Fallback: treat provided URLs as listing or direct image URLs."""
    out: List[dict] = []
    for i, u in enumerate(urls, start=1):
        out.append(
            {
                "title": f"{niche.label} ref {i}",
                "listingUrl": u,
                "imageUrl": u,
            }
        )
    return out


async def collect_niche(
    niche: Niche,
    limit: Optional[int] = None,
    from_urls: Optional[List[str]] = None,
) -> NicheManifest:
    limit = limit or refs_per_niche()
    refs_dir = repo_path("data", "research", "refs", niche.slug)
    refs_dir.mkdir(parents=True, exist_ok=True)
    manifests_dir = repo_path("data", "research", "manifests")
    manifests_dir.mkdir(parents=True, exist_ok=True)
    if from_urls:
        raw_items = _crawl_from_urls(from_urls[:limit], niche)
    else:
        try:
            raw_items = await _crawl_with_playwright(niche, limit)
        except Exception as exc:  # noqa: BLE001
            print(f"[crawl] Playwright failed for {niche.slug}: {exc}")
            print(
                "[crawl] Tip: pass --from-urls or install browsers: playwright install chromium"
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
                print(f"[crawl] download failed ({raw['imageUrl']}): {exc}")
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
        nicheSlug=niche.slug,
        searchPhrase=niche.etsySearchPhrase,
        fetchedAt=datetime.now(timezone.utc).isoformat(),
        items=items,
    )
    out_path = manifests_dir / f"{niche.slug}.json"
    out_path.write_text(
        json.dumps(manifest.model_dump(), indent=2),
        encoding="utf-8",
    )
    print(f"[crawl] {niche.slug}: saved {len(items)} refs -> {out_path}")
    return manifest


async def collect_all(from_urls: Optional[List[str]] = None) -> List[NicheManifest]:
    niches = load_niches()
    manifests: List[NicheManifest] = []
    for niche in niches:
        urls = from_urls if from_urls and niche is niches[0] else None
        manifests.append(await collect_niche(niche, from_urls=urls))
        await asyncio.sleep(2.0)
    return manifests


def collect_all_sync(from_urls: Optional[List[str]] = None) -> List[NicheManifest]:
    return asyncio.run(collect_all(from_urls=from_urls))
