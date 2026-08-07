/**
 * Node Playwright shop scraper (preferred path on Windows).
 * Usage: node scripts/scrape-shop.cjs <shopUrl> <limit> <outJsonPath> [--headed]
 * Paginates with ?page=N until limit unique listings or a page adds none.
 * Writes JSON array: [{ title, listingUrl, imageUrl }, ...]
 * Headless often returns 0 on Etsy; retries once headed (Chrome channel) automatically.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const PHYSICAL =
  /\b(framed|shipped|shipping|canvas print|print on demand|\bpod\b|physical|metal print)\b/i;

function pageUrl(shopUrl, pageNum) {
  const u = new URL(shopUrl);
  if (pageNum <= 1) u.searchParams.delete("page");
  else u.searchParams.set("page", String(pageNum));
  return u.toString();
}

async function launchBrowser(headed) {
  if (!headed) return chromium.launch({ headless: true });
  try {
    return await chromium.launch({ headless: false, channel: "chrome" });
  } catch {
    return chromium.launch({ headless: false });
  }
}

async function scrape(shopUrl, limit, headed) {
  const results = [];
  const seen = new Set();
  const label = headed ? "headed" : "headless";
  const browser = await launchBrowser(headed);
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();

  let pageNum = 1;
  const maxPages = Math.max(8, Math.ceil(limit / 12) + 2);
  while (results.length < limit && pageNum <= maxPages) {
    const url = pageUrl(shopUrl, pageNum);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    try {
      await page.waitForSelector("a[href*='/listing/']", { timeout: 45000 });
    } catch {
      console.error(`[scrape-shop] ${label} page ${pageNum}: no listing links`);
      break;
    }
    await page.waitForTimeout(headed ? 2000 : 1500);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(headed ? 600 : 700);
    }

    let added = 0;
    const cards = await page.$$("a[href*='/listing/']");
    for (const card of cards) {
      if (results.length >= limit) break;
      const href = await card.getAttribute("href");
      if (!href || !href.includes("/listing/")) continue;
      let listingUrl = href.split("?")[0];
      if (!listingUrl.startsWith("http")) {
        listingUrl = new URL(listingUrl, "https://www.etsy.com").toString();
      }
      if (seen.has(listingUrl)) continue;

      let title =
        (await card.getAttribute("title")) ||
        ((await card.innerText()) || "").replace(/\s+/g, " ").trim();
      if (!title || PHYSICAL.test(title)) continue;

      const img = await card.$("img");
      let imageUrl = "";
      if (img) {
        imageUrl =
          (await img.getAttribute("src")) ||
          (await img.getAttribute("data-src")) ||
          "";
      }
      if (!imageUrl) continue;

      seen.add(listingUrl);
      results.push({ title, listingUrl, imageUrl });
      added += 1;
    }
    console.log(
      `[scrape-shop] ${label} page ${pageNum}: +${added} (total ${results.length}/${limit})`
    );
    if (added === 0) break;
    pageNum += 1;
    if (results.length < limit) await page.waitForTimeout(2500);
  }

  await browser.close();
  return results;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--headed");
  const forceHeaded = process.argv.includes("--headed");
  const shopUrl = args[0];
  const limit = parseInt(args[1] || "12", 10);
  const outPath = args[2];
  if (!shopUrl || !outPath) {
    console.error(
      "Usage: node scripts/scrape-shop.cjs <shopUrl> <limit> <outJsonPath> [--headed]"
    );
    process.exit(2);
  }

  let results = await scrape(shopUrl, limit, forceHeaded);
  if (results.length === 0 && !forceHeaded) {
    console.error("[scrape-shop] headless got 0 listings; retrying headed...");
    results = await scrape(shopUrl, limit, true);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`[scrape-shop] wrote ${results.length} listings -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
