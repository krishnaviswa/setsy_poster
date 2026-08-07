# Shop study: TapIntoDigital

**Shop URL:** https://www.etsy.com/shop/TapIntoDigital
**Fetched (UTC):** 2026-08-07T06:06:27.049018+00:00
**Listings sampled:** 42 (deep sample / visible cards, not full catalog)

## Important limits

- Etsy does **not** expose true sales ranks to scrapers.
- This study uses **public listing titles + thumbs** on the shop page as directional signals only.
- Inspiration only — do **not** copy compositions, titles, tags, or mockups.

## Shop-level public signals (manual observation)

Observed on the live shop page (not from private analytics):

- Badge / trust: about **17.2k sales** shown on the storefront (reviews not reliably parsed).
- Product mix on the sampled page is **broader than Pixar portraits alone**: custom pet bathroom portraits, Pixar/3D photo portraits, plus a large recent wave of **PNG sublimation** designs (Halloween, Christmas, breast-cancer awareness, funny quotes).
- Hero / featured SKUs still include **Pixar Style Portrait from Photo** (couple / family / pet gift) and funny **custom pet toilet** wall-art downloads.
- Nearly all cards are labeled **Digital Download**.
- Headless Playwright often returns **0** cards for this shop; sample was captured via interactive browser then ingested with `--from-json`.

## What appears to “work” here (hypotheses)

1. **Gift customization hook**: photo-to-Pixar / pet portrait language drives gift intent (couple, family, pet).
2. **Funny pet bathroom art** is a distinct viral-style niche sitting beside the portrait offer.
3. **High SKU velocity via PNG sublimation** (seasonal + awareness + humor) likely pads catalog volume beyond custom portraits.
4. For *our* poster generator: original concepts can target **animated-style family/pet gift posters** and **funny pet wall art** — do **not** copy their art, titles, or offer a fake “Disney/Pixar” trademark claim.
5. Avoid trademarked “Pixar” / Disney branding in sellable titles; use “3D animated cartoon portrait style” wording instead.

## Observed theme signals (from sampled titles)

| Theme keyword | Count in sample |
| --- | ---: |
| clipart | 36 |
| printable/digital | 34 |
| seasonal | 23 |
| gift | 6 |
| pet portrait | 5 |
| nursery/kids | 4 |
| pixar/3d portrait | 3 |
| custom from photo | 3 |
| couple portrait | 2 |
| family portrait | 2 |
| typography | 2 |
| bundle/set | 2 |
| kitchen/food | 1 |
| abstract | 1 |
| botanical/floral | 1 |

## Sampled listings

| # | Title | Listing | Local ref |
| --- | --- | --- | --- |
| 1 | Dog in Toilet, Dog Reading Newspaper Personalized Pet Portrait Gift, Funny Bathroom Art, Dog Wall Art, Pet in Bathtub, Personalized pet gift | https://www.etsy.com/in-en/listing/4304261831/dog-in-toilet-dog-reading-newspaper | `data/research/refs/tap-into-digital/01.jpg` |
| 2 | Pixar Style Portrait from Photo, Couple, Family, Pet Gift, Animated Style Portraits, Digital 3D Portrait, Gift, Digital Pixar Art | https://www.etsy.com/in-en/listing/4319957532/pixar-style-portrait-from-photo-couple | `data/research/refs/tap-into-digital/02.jpg` |
| 3 | Custom Pet Portrait, Funny Bathroom Poster, Dog in Toilet, Dog Reading Newspaper on Toilet, Pet Owner Gift, Dog Bathroom Art ,Digital Print | https://www.etsy.com/in-en/listing/4323026056/custom-pet-portrait-funny-bathroom | `data/research/refs/tap-into-digital/03.jpg` |
| 4 | Custom Pet Portraits, Dog In Toilet, Funny Pet Portrait, Bathroom Dog Wall Art, Pet in Bathtub, Dog Bathroom Art, Pet Gift ,Digital Downlaod | https://www.etsy.com/in-en/listing/4323023471/custom-pet-portraits-dog-in-toilet-funny | `data/research/refs/tap-into-digital/04.jpg` |
| 5 | Resting Witch Face PNG, Green Witch Halloween Sublimation Design, Spooky Pumpkin Shirt PNG Digital Download | https://www.etsy.com/in-en/listing/4551399802/resting-witch-face-png-green-witch | `data/research/refs/tap-into-digital/05.jpg` |
| 6 | Big Plans Start Young PNG, Motivational Kids Quote Sublimation Design, Youth Shirt PNG, Digital Download | https://www.etsy.com/in-en/listing/4551397796/big-plans-start-young-png-motivational | `data/research/refs/tap-into-digital/06.jpg` |
| 7 | Happy Halloween Ghost PNG, Spooky Haunted House Ghost Sublimation Design, Halloween Shirt PNG Digital Download | https://www.etsy.com/in-en/listing/4551388005/happy-halloween-ghost-png-spooky-haunted | `data/research/refs/tap-into-digital/07.jpg` |
| 8 | Merry Christmas Bow PNG, Cute Christmas Ribbon Sublimation Design, Holiday Shirt PNG, Festive Digital Download | https://www.etsy.com/in-en/listing/4551395668/merry-christmas-bow-png-cute-christmas | `data/research/refs/tap-into-digital/08.jpg` |
| 9 | Hello Fall Ghost PNG, Cute Autumn Ghost with Coffee Sublimation Design, Pumpkin Fall Shirt PNG Digital Download | https://www.etsy.com/in-en/listing/4551385817/hello-fall-ghost-png-cute-autumn-ghost | `data/research/refs/tap-into-digital/09.jpg` |
| 10 | Happy Fall Ghost PNG, Cute Autumn Ghost Sublimation Design, Pumpkin Fall Shirt PNG, Cozy Fall Digital Download | https://www.etsy.com/in-en/listing/4551384815/happy-fall-ghost-png-cute-autumn-ghost | `data/research/refs/tap-into-digital/10.jpg` |
| 11 | Merry Christmas PNG, Black Buffalo Plaid Christmas Sublimation, Rustic Holiday Shirt Design, Festive Digital Download | https://www.etsy.com/in-en/listing/4551383649/merry-christmas-png-black-buffalo-plaid | `data/research/refs/tap-into-digital/11.jpg` |
| 12 | Holly Jolly Christmas PNG, Pink Christmas Sublimation, Retro Holiday Shirt Design, Festive Digital Download | https://www.etsy.com/in-en/listing/4551382713/holly-jolly-christmas-png-pink-christmas | `data/research/refs/tap-into-digital/12.jpg` |
| 13 | Half-Assed Holiday Mode PNG, Funny Christmas Goose Sublimation, Tired Holiday Shirt Design Digital Download | https://www.etsy.com/in-en/listing/4551380057/half-assed-holiday-mode-png-funny | `data/research/refs/tap-into-digital/13.jpg` |
| 14 | Feeling a Little Frosty PNG, Cute Snowman Christmas Sublimation, Winter Holiday Shirt Design Digital Download | https://www.etsy.com/in-en/listing/4551379131/feeling-a-little-frosty-png-cute-snowman | `data/research/refs/tap-into-digital/14.jpg` |
| 15 | Believe Breast Cancer Awareness PNG, Pink Ribbon Sublimation Design, Survivor Support Shirt Digital Download | https://www.etsy.com/in-en/listing/4549532921/believe-breast-cancer-awareness-png-pink | `data/research/refs/tap-into-digital/15.jpg` |
| 16 | Stronger Than Cancer PNG, Breast Cancer Awareness Sublimation, Pink Ribbon Survivor Shirt Digital Download | https://www.etsy.com/in-en/listing/4549544178/stronger-than-cancer-png-breast-cancer | `data/research/refs/tap-into-digital/16.jpg` |
| 17 | Breast Cancer Awareness PNG, Pink Ribbon Cheer Bundle, Cute Survivor Sublimation, Support Squad Digital Download | https://www.etsy.com/in-en/listing/4549538902/breast-cancer-awareness-png-pink-ribbon | `data/research/refs/tap-into-digital/17.jpg` |
| 18 | Cute Ghost Boo PNG, Halloween Ghost Sublimation, Kawaii Spooky PNG, Trick or Treat Shirt Design, Digital Download | https://www.etsy.com/in-en/listing/4549535272/cute-ghost-boo-png-halloween-ghost | `data/research/refs/tap-into-digital/18.jpg` |
| 19 | Breast Cancer Bow PNG, Pink Ribbon PNG, Coquette Breast Cancer Sublimation, Awareness Shirt PNG, Digital Download | https://www.etsy.com/in-en/listing/4549534360/breast-cancer-bow-png-pink-ribbon-png | `data/research/refs/tap-into-digital/19.jpg` |
| 20 | Breast Cancer Awareness PNG, Pink Ribbon Heart PNG, Breast Cancer Sublimation, Hope Shirt Design, Digital Download | https://www.etsy.com/in-en/listing/4549515625/breast-cancer-awareness-png-pink-ribbon | `data/research/refs/tap-into-digital/20.jpg` |
| 21 | Quack or Treat PNG, Halloween Duck PNG, Ghost Duck Sublimation, Pumpkin Duck Shirt Design, Halloween PNG Download | https://www.etsy.com/in-en/listing/4549525796/quack-or-treat-png-halloween-duck-png | `data/research/refs/tap-into-digital/21.jpg` |
| 22 | Christmas Goose PNG Bundle, Cute Holiday Goose PNG, Winter Goose Sublimation, Christmas Shirt Design, Digital Download | https://www.etsy.com/in-en/listing/4549511787/christmas-goose-png-bundle-cute-holiday | `data/research/refs/tap-into-digital/22.jpg` |
| 23 | Just Melting PNG, Funny Melting Snowman PNG, Christmas Sublimation Design, Winter Shirt PNG, Holiday Digital Download | https://www.etsy.com/in-en/listing/4549510815/just-melting-png-funny-melting-snowman | `data/research/refs/tap-into-digital/23.jpg` |
| 24 | Merry Christmas PNG, Pink Christmas Tree PNG, Coquette Christmas Sublimation, Cute Holiday Shirt Design, Bow PNG | https://www.etsy.com/in-en/listing/4549522338/merry-christmas-png-pink-christmas-tree | `data/research/refs/tap-into-digital/24.jpg` |
| 25 | Joyful and Bright PNG, Retro Christmas Sublimation Design, Holiday Sweatshirt Design, Farmhouse Christmas PNG, Digital Download | https://www.etsy.com/in-en/listing/4549521178/joyful-and-bright-png-retro-christmas | `data/research/refs/tap-into-digital/25.jpg` |
| 26 | Retro Christmas Tree PNG, Minimalist Christmas Tree Sublimation, Vintage Holiday Tree PNG, Christmas Digital Download | https://www.etsy.com/in-en/listing/4549507209/retro-christmas-tree-png-minimalist | `data/research/refs/tap-into-digital/26.jpg` |
| 27 | Christmas Goose PNG, Christmas Sweater PNG, Holiday Goose Sublimation Design, Festive Winter Shirt SVG, Christmas Digital Download | https://www.etsy.com/in-en/listing/4549518048/christmas-goose-png-christmas-sweater | `data/research/refs/tap-into-digital/27.jpg` |
| 28 | Most Likely to Jingle Then Take a Nap PNG, Funny Christmas PNG, Reindeer Sublimation, Holiday Shirt PNG, Christmas Digital Download | https://www.etsy.com/in-en/listing/4549516384/most-likely-to-jingle-then-take-a-nap | `data/research/refs/tap-into-digital/28.jpg` |
| 29 | Hey Boo Halloween PNG, Pink Skeleton Halloween PNG, Spooky Season Sublimation, Ghost Pumpkin Halloween Shirt PNG, Digital Download | https://www.etsy.com/in-en/listing/4548347917/hey-boo-halloween-png-pink-skeleton | `data/research/refs/tap-into-digital/29.jpg` |
| 30 | Happy Halloween Skeleton Cowgirl PNG, Pink Western Halloween PNG, Spooky Cowgirl Sublimation , Retro Halloween Shirt SVG, Digital Download | https://www.etsy.com/in-en/listing/4548360568/happy-halloween-skeleton-cowgirl-png | `data/research/refs/tap-into-digital/30.jpg` |
| 31 | Cozy Skeleton Reading PNG, Spooky Book Lover PNG, Halloween Skeleton Sublimation Design, Cozy Spooky Season Shirt PNG, Digital Download | https://www.etsy.com/in-en/listing/4548346211/cozy-skeleton-reading-png-spooky-book | `data/research/refs/tap-into-digital/31.jpg` |
| 32 | I Don't Keep Grudges I Keep Receipts PNG, Funny Raccoon PNG, Sarcastic Trash Panda Sublimation, Retro Raccoon Shirt Design, Digital Download | https://www.etsy.com/in-en/listing/4548345435/i-dont-keep-grudges-i-keep-receipts-png | `data/research/refs/tap-into-digital/32.jpg` |
| 33 | Just a Bunch of Spooky Witches PNG, Halloween Witch Squad PNG, Pink Gothic Witch Sublimation, Spooky Season Shirt Design, Digital Download | https://www.etsy.com/in-en/listing/4548357938/just-a-bunch-of-spooky-witches-png | `data/research/refs/tap-into-digital/33.jpg` |
| 34 | Too Spooky to Handle PNG, Cute Halloween Ghost PNG, Witch Hat Halloween Sublimation, Funny Halloween Shirt Design, Digital Download | https://www.etsy.com/in-en/listing/4548341443/too-spooky-to-handle-png-cute-halloween | `data/research/refs/tap-into-digital/34.jpg` |
| 35 | Bruh We're Back PNG, Back to School Flamingo PNG, Funny Teacher Shirt Design, Cute School Sublimation PNG, Digital Download | https://www.etsy.com/in-en/listing/4548353956/bruh-were-back-png-back-to-school | `data/research/refs/tap-into-digital/35.jpg` |
| 36 | Choose Happiness PNG, Inspirational Quote PNG, Positive Affirmation Sublimation Design, Motivational Typography Shirt PNG, Digital Download | https://www.etsy.com/in-en/listing/4548353362/choose-happiness-png-inspirational-quote | `data/research/refs/tap-into-digital/36.jpg` |
| 37 | Pink Ribbon Butterfly PNG, Breast Cancer Awareness Butterfly Sublimation, Breast Cancer PNG, Pink Ribbon Shirt Design, Digital Download | https://www.etsy.com/in-en/listing/4547845602/pink-ribbon-butterfly-png-breast-cancer | `data/research/refs/tap-into-digital/37.jpg` |
| 38 | Fight Believe Hope PNG, Breast Cancer Awareness PNG, Pink Ribbon Sublimation, Never Give Up Shirt PNG, Breast Cancer Digital Download | https://www.etsy.com/in-en/listing/4547829935/fight-believe-hope-png-breast-cancer | `data/research/refs/tap-into-digital/38.jpg` |
| 39 | Breast Cancer Awareness PNG, Pink Ribbon Floral PNG, Stronger Than You Think Sublimation, Survivor Shirt Design, Digital Download | https://www.etsy.com/in-en/listing/4547842218/breast-cancer-awareness-png-pink-ribbon | `data/research/refs/tap-into-digital/39.jpg` |
| 40 | Rooted in Hope PNG, Breast Cancer Awareness PNG, Pink Ribbon Sublimation, Breast Cancer Support Digital Download | https://www.etsy.com/in-en/listing/4547840032/rooted-in-hope-png-breast-cancer | `data/research/refs/tap-into-digital/40.jpg` |
| 41 | Pixar Style Portrait from Photo, Couple, Family, Pet Gift, Animated Style Portraits, Digital 3D Portrait, Gift, Digital Pixar Art | https://www.etsy.com/in-en/listing/4309484298/pixar-style-portrait-from-photo-couple | `data/research/refs/tap-into-digital/41.jpg` |
| 42 | Custom Pixar-Style, Unique Wall Art, Couples Pixar Gift, Custom Cartoon Pixar Style, Personalized 3D, Custom Portrait | https://www.etsy.com/in-en/listing/4309496036/custom-pixar-style-unique-wall-art | `data/research/refs/tap-into-digital/42.jpg` |

## Next steps for this repo

1. `analyze` the saved thumbs (style/palette only) if Replicate credit allows.
2. `prompt` original concepts inspired by the strongest gift themes (not trademarked brand names).
3. Keep scope clear: our TS generator is print-ready posters unless you expand product types on purpose.

_Shop notes from contracts:_ Custom Pixar/3D-style portrait gifts from photos (couple/family/pet). Deep-sample research only; inspiration, not copying.
