# Suan Zen Omakase — website

Bilingual (TH/EN) site for Suan Zen Omakase, Nonthaburi. Next.js 15 App Router,
TypeScript, hand-written CSS. No UI framework, no animation library, three
runtime dependencies (`next`, `react`, `react-dom`).

```bash
npm install
npm run dev          # http://localhost:4321
npm run build && npm run start
npm run check:sheet  # prove the Google Sheet connection works
```

**Getting it online: [HOSTING.md](HOSTING.md).** Note that GitHub Pages cannot
write to the booking spreadsheet — it has no server — so Vercel is the right
host if you want bookings to land in the sheet.

---

## What is in this build

**The full menu.** Seven courses with the restaurant's real prices and dish
lists, carried over from the two earlier Suan Zen builds:

| | Course | | Price | Dishes listed |
|---|---|---|---|---|
| 一 | Zen Ichi | 14 bites | ฿2,000++ | 7 (a published selection of the 14) |
| 二 | Zen Ni | 16 bites | ฿2,890++ | 16 |
| 三 | Zen San | 17 bites | ฿3,890++ | 17 |
| 将 | Zen Boss | 12 bites | ฿3,890++ | 12 |
| 四 | Zen Yon | 13 bites | ฿4,500++ | 13 |
| 子 | Zen Kids | 9 bites | ฿1,290++ | 9 |
| 甘 | Zen Sweet | 3 menus × 5 | ฿1,890++ | 15 |

Each course opens to its dishes; pointing at a dish shows the restaurant's
photograph of it. **23 of the 89 dishes have a photograph that genuinely shows
them** — the rest fall back to a course picture, captioned as the course rather
than as the dish, because a photograph of wagyu sushi against "wagyu porridge"
would be a lie about the menu.

**82 photographs**, recovered from the two earlier builds plus the restaurant's
Facebook and Instagram, deduplicated by content hash and described one by one so
every picture carries real alt text in both languages. 72 are used; 31 have
people in them. See `src/content/media.ts`.

**The logo** is the restaurant's own mark at 1284px — the gold seal with the
pine over rocks, the sun, 枯山水 and OMAKASE — pulled from their Facebook
profile. The amber tokens in `globals.css` are the three golds sampled out of
that file, not an approximation of them.

---

## Before this goes live

### 1. The à la carte menu is the one thing missing

It was not in either earlier build, is not on the restaurant's Facebook or
Instagram, and is not on any listing site. Rather than invent dishes and prices
beside the real omakase ones, the à la carte section renders a designed "ask us
on LINE" state.

**To publish it:** add the sections and items to `src/content/alacarte.ts` and
set `published: true`. The section, its layout, its Thai copy and the same
hover-photo behaviour are already built and will simply start showing food.

### 2. Confirm these three facts with the restaurant

| Question | What the site currently says | Why it is uncertain |
|---|---|---|
| **Open every day, or closed Mondays?** | Open daily | The Instagram bio says daily. An older post on the restaurant's own TikTok says Tue–Sun. The bio is more current, so it wins — but this needs a yes/no. |
| **Seating times** | 12.00 / 15.00 / 17.00 / 19.00 | From the restaurant's TikTok. The Instagram bio says the room opens at 12.30, which does not fit a 12.00 seating. |
| **Live music Fri–Sun** | Not shown anywhere | Only a diner review mentions it. Left off the site until the restaurant confirms. |

If Mondays are closed, add `1` to `closedWeekdays` in
`src/content/booking.ts` — the booking calendar greys them out immediately.

### 3. Photography

The photographs are the restaurant's own, but most are social-media resolution
(1000–2300px, some smaller). They hold up at the sizes used here. If the
restaurant has the originals, dropping them into `public/photos` under the same
filenames upgrades the whole site with no code change.

`src/content/media.ts` records what each picture shows, whether it has people
in it, and a `warmth` score — how much it carries the feeling of the room rather
than just a plate. `src/lib/slots.ts` uses those scores to decide what goes in
the hero, the garden, the counter and the gallery, and picks each photograph
once so nothing repeats.

### 4. Set the domain

`SITE` in `src/app/[locale]/layout.tsx` and `src/app/sitemap.ts` is a
placeholder (`https://suanzen.com`). It feeds canonical URLs, hreflang, Open
Graph and the sitemap.

---

## How it is put together

### Content is separate from design

Everything the site claims about the restaurant lives in `src/content/`. No
price, phone number or opening time is written into a component.

| File | Holds |
|---|---|
| `restaurant.ts` | Address, geo, phone, LINE, hours, socials — every fact wrapped in `Verified<T>` so the source and confidence travel with it |
| `courses.ts` | The course ladder, prices, lengths |
| `dictionary.ts` | All EN and TH copy |
| `gallery.ts` | Gallery sequence + shoot list |
| `instagram.ts` | Real post permalinks and dates |
| `booking.ts` | Seatings, party sizes, closed days, booking window |

### Thai is written as Thai

Not translated from the English. Thai gets its own line-height (1.86 body, 1.42
headings) because stacked vowels and tone marks clip at Latin leading, and its
own casing rules — Thai has no uppercase, so `text-transform` is switched off
and letter-spacing reduced wherever labels are set in caps in English.

Display type is Shippori Mincho, which carries no Thai, so Thai characters fall
through to Noto Serif Thai automatically inside one font stack. Body text is IBM
Plex Sans Thai for both languages, so English and Thai sit on the same skeleton.

### Day and night

Sections declare `data-section-world="day" | "night"` and the page moves between
a rice-paper world and an ink one as you scroll — the garden outside, the
counter in daylight. All colour goes through tokens in `globals.css`.

### Bookings go to a Google Sheet

`/{locale}/book` — six steps: date → seating → course → guests → contact →
review. The request is written to `.data/reservations.jsonl` first, then
forwarded to the restaurant's spreadsheet through a small Apps Script web app
(`tools/sheet-webhook.gs`). No Google Cloud project, no service-account key —
just two environment variables. Setup is in [DEPLOY.md](DEPLOY.md).

The sheet is best-effort on purpose: the booking is on disk before the sheet is
contacted, so a spreadsheet that is slow, down or unconfigured never costs a
table. The API response reports which happened.

### The booking engine

`/{locale}/book` — six steps: date → seating → course → guests → contact →
review. It posts to `/api/reservations`, which validates with the *same* code
the form uses (`src/lib/booking.ts`), rate-limits by IP, and appends the request
to `.data/reservations.jsonl`.

**It takes a request; it does not confirm a table.** There is no live table
system to ask, so the site never tells a guest a seating is held — the response,
the confirmation screen and the reference code all say the restaurant will
confirm on LINE. Please keep that honest if you extend it.

To send bookings somewhere the restaurant actually reads, fill in the marked
block in `src/app/api/reservations/route.ts` (LINE Messaging API, a Google
Sheet, email — whatever they use). If a real booking platform is connected
later, replace the availability check in `src/lib/booking.ts` and the rest of
the flow is unchanged.

### The Instagram page

`/{locale}/instagram` — the three posts the restaurant has pinned render as
live Instagram embeds, so the pictures are real, current, and stay on
Instagram. Below them, the rest of the feed is laid out in the site's own
design, filterable by category, each entry linking to the post.

Only three posts are embedded on purpose: ask Instagram for a dozen at once and
it serves most of them as blank white frames. Three load reliably.

`category` in `src/content/instagram.ts` is the one editorial judgement in the
file — it is filled in only where Instagram's own alt text says what a post
shows, and everything else sits in `moments`, meaning *untagged*. **The
restaurant should re-tag these.**

To keep the feed current automatically, swap the array for a fetch against the
Instagram Basic Display API (`/me/media?fields=id,permalink,timestamp,
media_type,caption`) keeping the same shape.

### The QR code

`src/lib/qr.ts` is a small QR encoder (byte mode, EC level M, versions 1–10)
written so the LINE code needs no third-party script and no network call. It
was verified against an independent decoder and against a reference encoder —
identical output, decodes back to the exact LINE URL. If you change the LINE
link, re-run `qa/` to confirm it still scans.

---

## QA

```bash
npx playwright install chromium      # once

npm run qa                           # every page, 4 viewports, full-page PNGs
node qa/shots.mjs /en/book desktop    # one page, one viewport
npm run qa:booking                   # drives the booking flow end to end
npm run qa:a11y                      # headings, alt text, names, contrast
```

`shots.mjs` also fails loudly on horizontal overflow and console errors at
1440 / 1366 / 768 / 390. `booking.mjs` checks that validation actually blocks a
bad phone number and an empty name before a request can be filed. `a11y.mjs`
computes real contrast ratios off the rendered colours — it caught two failing
pairs during the build, which is why `--fg-faint` is set where it is. Keep it
passing if you change the palette.

## Accessibility

Semantic landmarks, a skip link, visible focus rings on the brand amber, focus
trapped in the reservation panel and the gallery lightbox, focus moved to each
booking step's heading, 44–48px touch targets, `aria-live` on the feed count,
real radio inputs behind the styled calendar and seating cards, and full
keyboard support in the gallery (arrows, Escape). Every animation is disabled
under `prefers-reduced-motion` and the site is designed to read without motion.
