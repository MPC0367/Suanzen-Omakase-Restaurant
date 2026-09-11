# Suan Zen Omakase — menu

The link Suan Zen sends in its LINE OA in place of photographs of the menu, for
guests who already mean to come. Bilingual (TH/EN), one page: the menu first,
then à la carte, then how to visit. It is **unlisted** — shared by link, not
offered to search engines. Next.js 15 App Router, static export, TypeScript,
hand-written CSS, three runtime dependencies (`next`, `react`, `react-dom`).

```bash
npm install
npm run dev          # http://localhost:4321
npm run export       # static site in out/, for a domain root
```

**Getting it online, and onto the restaurant's domain: [HOSTING.md](HOSTING.md).**
It also explains how the page stays off Google.

---

## What is on the page

**The menu.** Seven courses with the restaurant's prices and dish lists. The
shortcuts at the top jump to each course, and stay pinned under the header on a
phone.

| | Course | | Price | Dishes listed |
|---|---|---|---|---|
| 一 | Zen Ichi | 14 bites | ฿2,000++ | 7 (a published selection of the 14) |
| 二 | Zen Ni | 16 bites | ฿2,890++ | 16 |
| 三 | Zen San | 17 bites | ฿3,890++ | 17 |
| 将 | Zen Boss | 12 bites | ฿3,890++ | 12 |
| 四 | Zen Yon | 13 bites | ฿4,500++ | 13 |
| 子 | Zen Kids | 9 bites | ฿1,290++ | 9 |
| 甘 | Zen Sweet | 3 menus × 5 | ฿1,890++ | 15 |

**23 of the 89 dishes have a photograph that genuinely shows them**, and only
those open one. A dish without its own photograph shows none rather than
borrowing another dish's.

**À la carte** renders a designed "ask us on LINE" state until the list arrives.

**Visit.** Reserve on LINE, call, directions, and the map.

Every reserve button on the page opens LINE. There is no booking form.

---

## Still needed from the restaurant

1. **The à la carte list.** Add the sections and items to
   `src/content/alacarte.ts` and set `published: true`; the section, its Thai
   copy and its layout are already built.
2. **Thai dish names**, where the menu only has them in English.
3. **Original photographs**, if they have them. Most are social-media
   resolution. Dropping originals into `public/photos` under the same filenames
   upgrades the page with no code change.

---

## How it is put together

**Content is separate from design.** Everything the page says about the
restaurant lives in `src/content/`. No price, phone number or opening time is
written into a component.

| File | Holds |
|---|---|
| `restaurant.ts` | Address, geo, phone, LINE, hours, socials |
| `courses.ts` | The courses, prices, lengths and dishes |
| `alacarte.ts` | The à la carte list, unpublished until it arrives |
| `dictionary.ts` | All EN and TH copy |
| `media.ts` | Every photograph: what it shows, alt text in both languages |

**Thai is written as Thai**, not translated from the English. It gets its own
line-height, because stacked vowels and tone marks clip at Latin leading, and
its own casing rules: Thai has no uppercase, so `text-transform` is off
wherever English labels are set in caps.

**Day and night.** The page moves between a rice-paper palette and an ink one
as each section crosses a line across the viewport (`src/lib/motion.ts`).

**The QR codes.** `src/lib/qr.ts` is a small QR encoder, so the LINE code needs
no third-party script. `scripts/make-qr.mjs` makes the handover QR for the
page's own address.

**The artifact.** `npm run artifact` builds the same page as one
self-contained HTML file, for sharing a preview.

---

## QA

```bash
npx playwright install chromium       # once
node qa/verify-brochure.mjs [base]    # the page's contract: menu first, phone, unlisted
node qa/verify-curtain.mjs            # the opening seal
npm run qa:a11y                       # headings, alt text, names, contrast
```
