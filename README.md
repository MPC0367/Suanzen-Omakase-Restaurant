# Suan Zen Omakase — menu

The link Suan Zen sends in its LINE OA in place of photographs of the menu, for
guests who already mean to come. In English, Thai and Simplified Chinese
(`/en/`, `/th/`, `/zh/`), one page: the menu first,
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
spotlights the one being read, and the middle of the screen works like a
pointer resting on the menu: the dish under it is lit, its photograph slides
open beneath it, and when the middle moves on the one before closes, so only
one is ever open. The dish at the middle never moves while a photograph above
it closes: the page scrolls by exactly what the closing photograph takes away,
frame by frame. On an iPhone, where a scroll set by the page would stop a fling
dead, a photograph above the middle fades at once and slides shut when the page
comes to rest. A tap glides a dish to the middle. Nothing opens while
a tapped shortcut carries the page, and a tablet's two-column lists keep
tap-to-open.

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
| `dictionary.ts` | All other copy, and the locale model: `Locale`, `L10n<T>` (a value for every language), `pick()`, `localeInfo` (html lang, og:locale, the selector's names) |
| `media.ts` | Every photograph: what it shows, alt text in all three languages |

Every piece of localized text is an `L10n` — `{ en, th, zh }` — so a missing
language is a type error rather than a silent English fallback. Components
read it with `pick(value, locale)`; dish names, which the restaurant gives in
English and only sometimes in Thai, are `Named` and read with `named()`. Adding
a language means adding it to `locales` and `localeInfo` and letting the
compiler list every string it needs.

**Thai is written as Thai**, not translated from the English. It gets its own
line-height, because stacked vowels and tone marks clip at Latin leading, and
its own casing rules: Thai has no uppercase, so `text-transform` is off
wherever English labels are set in caps.

**Chinese is Simplified, for Mainland readers**, translated and then reviewed
line by line by a second, adversarial editor; the open questions they raised
for the restaurant are in `src/content/OPEN-QUESTIONS.md`. Brand, course and platform names,
prices, `++`, phone numbers and handles stay as they are; Japanese dish names
with no settled Chinese form stay in Latin letters. It is set in Noto Serif SC
and Noto Sans SC (layout.tsx), which only the `/zh/` pages ask for, with its
own leading, no uppercase and next to no letterspacing (globals.css, "CHINESE
TYPOGRAPHY"). The Chinese address carries the romanised one under it, for a
taxi or a map search.

**The language selector** (`src/components/LanguageMenu.tsx`) is a button and
three links — English, ไทย, 简体中文 — each to the same page in that language,
with the query and `#section` kept. It works from the keyboard (arrows, Home,
End, Escape) and closes on a click elsewhere. Switching keeps the guest's place:
the course they had open, and the same point in the element they were reading
(`src/lib/place.ts`), since the three languages are not the same length.

**The restaurant behind the page.** One photograph, fixed behind every page
(`src/components/Backdrop.tsx`), under a wash that lets it through at 30%, 20%
and 10% down the top third of the screen, not at all through the middle third,
and at 10%, 20% and 30% down the bottom third. It never moves: no scroll
listener, no parallax, no `background-attachment: fixed`. The photograph is the
olive tree at the door at blue hour (`src/assets/backdrop/olive-dusk.jpg`),
framed on the tree and cropped clear of the restaurant's watermark. Phones and
upright tablets get it as supplied; wide screens, which show it twice its size,
get a copy with only its brightest lights held down, so small print keeps 4.5:1.
The empty curved counter (`public/photos/78893251dcbe.jpg`) is kept too — set
`WIDE` in `Backdrop.tsx` to `"counter"` and wide screens show it instead.
`scripts/backdrop.mjs` makes them all, never upscaled, as AVIF/WebP/JPEG, in
colour and in greyscale (`TONE` chooses). `qa/verify-zh.mjs` checks every text
colour against the brightest part of the photograph at four screen sizes, in
both tones and in Chrome and Safari's engine.

**Night throughout.** The page is dark from top to bottom, at the restaurant's
word. It used to cross from an ink palette into a rice-paper one as each
section came up; that second world is gone, and `:root` in `globals.css` is the
whole palette.

**The QR codes.** `src/lib/qr.ts` is a small QR encoder, so the LINE code needs
no third-party script. `scripts/make-qr.mjs` makes the handover QR for the
page's own address.

**The artifact.** `npm run artifact` packages the real static export in
`.artifact/`, to publish as a Claude artifact for a preview on a phone before
pushing: the pages on one level (`index.html` is `/en/`, `th.html` is `/th/`,
`zh.html` is `/zh/`, `en-zen-ichi.html` is `/en/courses/zen-ichi/`…), their files with relative
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
node qa/verify-zh.mjs [base]          # the Chinese pages, the language selector, the room behind the page
node qa/a11y.mjs [base]               # headings, alt text, names, contrast
```
