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

**Find your course.** The page opens on "Which course is right for you?": a
family path (younger diners, teenage diners, adult diners, each with their
course), a two-to-three-tap finder, and the four adult courses side by side.
Every course says who it is for and, for the adult courses, what sets it apart.
Each course also has its own unlisted page, `/en/courses/<slug>/`, for staff to
send, and a Reserve that opens LINE with that course already in the message.

**The menu.** Seven courses in family order, with the restaurant's prices and
full lists. Courses are counted in **bites** (**คำ** in Thai), the way omakase
is served; Zen Sweet in menus. The shortcuts at the top jump to each course,
and stay pinned under the header on a phone.

| | Course | For | Length | Price |
|---|---|---|---|---|
| 子 | Zen Kids | ages 7–11 | 9 bites | ฿1,290++ |
| 一 | Zen Ichi | ages 12–14 | 14 bites | ฿2,000++ |
| 二 | Zen Ni | adults | 16 bites | ฿2,890++ |
| 三 | Zen San | adults | 17 bites | ฿3,890++ |
| 将 | Zen Boss | adults | 12 bites | ฿3,890++ |
| 四 | Zen Yon | adults | 13 bites | ฿4,500++ |
| 甘 | Zen Sweet | dessert | 3 menus × 5 | ฿1,890++ |

**14 of the 96 dishes have a photograph that genuinely shows them**, and only
those open one. A dish without its own photograph shows none rather than
borrowing another dish's. On a phone every course is open, the course bar
spotlights the one being read, and each of those photographs opens by itself in
the middle of the screen as the guest scrolls its dish there, then folds away
once scrolled past. It opens only for a guest scrolling by hand, never for a
tapped shortcut carrying the page past it, and never in the two-column lists
of a tablet.

**À la carte** renders a designed "ask us on LINE" state until the list arrives.

**Visit.** Reserve on LINE, call, directions, and the map.

Every reserve button on the page opens LINE. There is no booking form.

---

## Still needed from the restaurant

What the menu cannot state until the restaurant confirms it — the Zen Ichi age,
which dish lists are current, whether Zen Boss and Zen Sweet still run, the
LINE pre-filled message on their own phones — is listed in
[`src/content/OPEN-QUESTIONS.md`](src/content/OPEN-QUESTIONS.md). No page loads
that file, so nothing internal ships in the site's JavaScript. Besides those:

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
| `courses.ts` | The courses, prices, lengths and dishes, and where each fact comes from |
| `advisor.ts` | Who each course is for and why, the finder, the comparison, and their copy |
| `OPEN-QUESTIONS.md` | What still needs the restaurant's word (never shipped) |
| `alacarte.ts` | The à la carte list, unpublished until it arrives |
| `dictionary.ts` | All other EN and TH copy |
| `media.ts` | Every photograph: what it shows, alt text in both languages |
| `photo-sizes.ts` | Each dish photograph's size, so it opens at its true height |

**Thai is written as Thai**, not translated from the English. It gets its own
line-height, because stacked vowels and tone marks clip at Latin leading, and
its own casing rules: Thai has no uppercase, so `text-transform` is off
wherever English labels are set in caps.

**Day and night.** The page moves between a rice-paper palette and an ink one
as each section crosses a line across the viewport (`src/lib/motion.ts`).

**The QR codes.** `src/lib/qr.ts` is a small QR encoder, so the LINE code needs
no third-party script. `scripts/make-qr.mjs` makes the handover QR for the
page's own address.

**The artifact.** `npm run artifact` packages the real static export in
`.artifact/`, to publish as a Claude artifact for a preview on a phone before
pushing: the pages on one level (`index.html` is `/en/`, `th.html` is `/th/`,
`en-zen-ichi.html` is `/en/courses/zen-ichi/`…), their files with relative
addresses, only the font slices the pages use, and `files.json` listing what to
publish alongside `index.html`. `node qa/verify-artifact.mjs <base>` checks the
package, served locally, both as built and wrapped the way an artifact wraps it.

---

## QA

```bash
npx playwright install chromium       # once
node qa/verify-brochure.mjs [base]    # the page's contract: menu, phone behaviour, unlisted
node qa/verify-advisor.mjs [base]     # the course advisor, course pages, LINE messages
node qa/verify-curtain.mjs [base]     # the opening seal
node qa/a11y.mjs [base]               # headings, alt text, names, contrast
```
