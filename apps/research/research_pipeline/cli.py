from __future__ import annotations

import argparse
import sys


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="research_pipeline",
        description="Etsy niche research → structured prompts → TS generator handoff",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    collect_p = sub.add_parser("collect", help="Crawl Etsy (or --from-urls) for top niches")
    collect_p.add_argument(
        "--from-urls",
        nargs="+",
        help="Fallback image/listing URLs instead of crawling (first niche only)",
    )

    shop_p = sub.add_parser(
        "collect-shop",
        help="Crawl a specific Etsy shop (default: EdLPrintableDesigns from contracts/shops.v1.json)",
    )
    shop_p.add_argument(
        "--shop",
        default="edl-printable-designs",
        help="Shop slug from contracts/shops.v1.json, shop name, or full shop URL",
    )
    shop_p.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Max listing thumbs to save (default from shops.v1.json)",
    )
    shop_p.add_argument(
        "--from-json",
        default=None,
        help="Skip live scrape; load listings array JSON [{title,listingUrl,imageUrl}]",
    )

    analyze_p = sub.add_parser("analyze", help="Vision/heuristic style analysis of local refs")
    analyze_p.add_argument(
        "--no-vision",
        action="store_true",
        help="Skip Replicate vision; use heuristic style features",
    )

    sub.add_parser("prompt", help="Write structured research prompts to data/prompts/")

    gen_p = sub.add_parser("generate", help="Hand off latest research prompts to TS generator")
    gen_p.add_argument(
        "--http",
        action="store_true",
        help="POST to local UI /api/generate instead of npm run dev",
    )

    all_p = sub.add_parser("run-all", help="collect → analyze → prompt → generate")
    all_p.add_argument("--from-urls", nargs="+")
    all_p.add_argument("--no-vision", action="store_true")
    all_p.add_argument("--http", action="store_true")
    all_p.add_argument(
        "--skip-generate",
        action="store_true",
        help="Stop after writing prompts (no Replicate image generation)",
    )

    args = parser.parse_args(argv)

    if args.command == "collect":
        from .crawl.etsy import collect_all_sync

        collect_all_sync(from_urls=args.from_urls)
        return 0

    if args.command == "collect-shop":
        from .crawl.shop import collect_shop_sync

        collect_shop_sync(args.shop, limit=args.limit, from_json=args.from_json)
        return 0

    if args.command == "analyze":
        from .analyze.vision import analyze_all

        analyze_all(use_vision=not args.no_vision)
        return 0

    if args.command == "prompt":
        from .prompt.build import write_prompts_all

        write_prompts_all()
        return 0

    if args.command == "generate":
        from .handoff.to_generator import generate_from_latest

        generate_from_latest(use_http=args.http)
        return 0

    if args.command == "run-all":
        from .crawl.etsy import collect_all_sync
        from .analyze.vision import analyze_all
        from .prompt.build import write_prompts_all
        from .handoff.to_generator import generate_from_latest

        collect_all_sync(from_urls=args.from_urls)
        analyze_all(use_vision=not args.no_vision)
        write_prompts_all()
        if not args.skip_generate:
            generate_from_latest(use_http=args.http)
        return 0

    parser.error(f"Unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
