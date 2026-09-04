# Putting this on GitHub

There are two ways, and they give you different things.

---

## A · Push the source, let GitHub build it

**Best option.** You get the whole project in version control, and every push
rebuilds and republishes the site.

```bash
cd suan-zen
git init
git add -A
git commit -m "Suan Zen Omakase website"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source → GitHub Actions**.

The workflow in `.github/workflows/pages.yml` does the rest. It works out
whether the site is at `<you>.github.io/<repo>/` or at a domain root and sets
the asset paths accordingly, so you don't have to think about it.

**Custom domain:** put the domain in `public/CNAME` (one line, no protocol) and
set it under Settings → Pages. The workflow sees the file and builds for a root
path automatically.

---

## B · Upload the built folder

If you just want files on a server, `out/` is the finished site — plain HTML,
CSS, JS and images, no Node needed.

```bash
npm install
npm run export        # writes out/
```

Drag the **contents** of `out/` into the repo (not the folder itself), then
Settings → Pages → Source → *Deploy from a branch* → `main` / `(root)`.

If the site will live at `<you>.github.io/<repo>/` rather than a domain root,
build it with the base path or every stylesheet and photograph will 404:

```bash
npm run export -- --base /<repo>
```

---

## What changes in the static build

The site is the same, with one honest difference.

**Booking.** The full app has a real endpoint — `POST /api/reservations` —
that validates a booking, rate-limits it and files it to
`.data/reservations.jsonl`. GitHub Pages only serves files, so there is nothing
to receive that request.

So in the static build the same six-step form ends differently: instead of
filing the booking it writes it out as a message, gives the guest a **Copy**
button and a **LINE** button, and they send it to the restaurant themselves.
Nothing pretends to have been received.

Everything else is unchanged — the menu and its dish photographs, the gallery,
the Instagram page, both languages, the schema and the sitemap.

**If you want the booking endpoint to actually work,** deploy to Vercel or
Netlify instead of Pages. Import the repo, no configuration needed; `npm run
build` is the default and the API route comes with it. Then set the two
environment variables below and bookings land in the spreadsheet.

---

## Bookings → the Google Sheet

The sheet is here:

**[Suan Zen Omakase — Booking Requests](https://docs.google.com/spreadsheets/d/1iySk66XjOYv8p9fXPbLYEdIm-2G6wKds3p6jFicbJbo/edit)**

Connecting it takes about three minutes, and needs no Google Cloud project and
no private key anywhere in this repo.

1. Open the sheet → **Extensions → Apps Script**.
2. Replace everything in `Code.gs` with `tools/sheet-webhook.gs` from this repo.
3. Change `SECRET` at the top to a long random string of your own.
4. **Deploy → New deployment → Web app.** Execute as *Me*, access *Anyone*.
   Authorise it when Google asks. Copy the Web app URL.
5. Set two environment variables — locally in `.env.local`, or in the Vercel /
   Netlify dashboard:

   ```
   SHEETS_WEBHOOK_URL=<the Web app URL from step 4>
   SHEETS_WEBHOOK_SECRET=<the SECRET from step 3>
   ```

Take a booking and the row appears, newest at the top.

**"Anyone" access** means anyone who has the URL can POST to it — the `SECRET`
is what actually guards the sheet, which is why it needs to be long and why it
does not belong in a commit. The script only ever appends a row; it cannot read
or change anything else in your Drive.

### If the sheet is unreachable

Nothing is lost. Every booking is written to `.data/reservations.jsonl` **before**
the sheet is contacted, and that file is the system of record. If the sheet is
slow, down, or not configured, the guest still gets their reference and the
booking is still on the server. The API response says which happened:

| `sheet` in the response | what it means |
|---|---|
| `written` | the row is in the spreadsheet |
| `not_configured` | the two variables are unset — the booking was still filed |
| `rejected` | the script answered, but refused — usually a mismatched `SECRET` |
| `timeout` / `error` | the script could not be reached; the booking was still filed |

Anything other than `written` or `not_configured` is also written to the server
log with the booking's reference, so a missing row can be traced and re-entered.

`.data/` is gitignored — it holds real guest names and phone numbers and must
never be committed.

---

## Sizes

`out/` is about **27 MB**, nearly all of it the 82 photographs (12 MB) plus the
responsive sizes Next generates from them. Comfortably inside GitHub's limits
(1 GB soft repo limit, 100 MB per file).

To trim it, the photographs are the place to look — several are larger than the
page ever displays.
