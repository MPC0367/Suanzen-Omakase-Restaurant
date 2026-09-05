# Bookings → Google Sheet

Where this stands, and the four things left to do.

---

## Two corrections first

**Your Little House Flowers artifact does not write to Google Sheets.** I read it.
It collects bookings in the page and calls `window.claude.use('downloads')` to save
`lhf-bookings.csv` — a file you download and open. Nothing leaves the browser. So
"the same as Little House Flowers" would actually be a *step down* from what Suan
Zen now has, which writes a row into a live spreadsheet the moment a guest submits.

**Vercel is no longer needed for the sheet.** The earlier plan routed bookings
through a server so the shared secret never reached the browser. It turns out a
browser can post to Apps Script directly, as long as the request stays "simple"
(see the note on `text/plain` below). That removes the server from the booking
path entirely — GitHub Pages and the artifact both write to the sheet on their own.

---

## What is already done

| | |
|---|---|
| Google Sheet + Apps Script project | you did this |
| Web app deployed, URL live | `…AKfycbxGeM_…/exec` — answers, verified |
| `Code.gs` that accepts browser posts | written, in `tools/sheet-webhook.gs` — **not yet pasted in** |
| Booking form in the artifact | done, tested against your live URL |
| Booking form in the GitHub Pages build | done (`src/components/BookingForm.tsx`) |
| Booking form on a Node host | done (`src/app/api/reservations/route.ts`) |

The artifact's form already reaches Google. I submitted a test booking and the live
script replied `{"ok":false,"error":"bad_secret"}` — that is your *old* `Code.gs`
turning the request away, which proves the whole path works except the last door.

---

## Step 1 — Replace the Apps Script code (5 minutes)

1. Open your booking spreadsheet.
2. **Extensions → Apps Script**.
3. Select everything in `Code.gs` and delete it.
4. Paste the entire contents of [`tools/sheet-webhook.gs`](tools/sheet-webhook.gs).
5. Near the top, change one line to any long random string of your own:

   ```js
   var SECRET = 'change-me-to-something-long-and-random';
   ```

   Leave `PUBLIC_KEY` exactly as it is — the website sends that one.

6. Save (⌘S).

## Step 2 — Redeploy (1 minute)

Editing the code is not enough; the deployment serves a frozen version.

1. **Deploy → Manage deployments**.
2. Click the ✏️ pencil on your existing deployment.
3. **Version → New version**.
4. Confirm **Execute as: Me** and **Who has access: Anyone**.
5. **Deploy**.

Keep the same deployment so the URL does not change.

**Check it worked** — paste your `/exec` URL into a browser tab. You should see:

```
{"ok":true,"service":"suan zen booking sink"}
```

## Step 3 — Send a real booking (2 minutes)

Open the artifact, scroll to **Reserve**, fill it in, submit. A row appears in the
sheet within a second or two, newest directly under the header:

```
Reference  Received  Status  Date  Seating  Course  Guests  Name  Phone  LINE ID  Notes  Language
SZ-K4M2PQ  2026-09-05 10:14  requested  2026-09-07  19.00  Zen Ni  2  …
```

Status is always `requested`, never `confirmed` — a person confirms a table, not a form.

## Step 4 — Wire the GitHub Pages build (3 minutes)

The artifact and the GitHub site are two separate copies. This step is only for the
GitHub one; skip it if the artifact is all the client needs.

In the project folder, create `.env.local`:

```bash
NEXT_PUBLIC_SHEET_URL=https://script.google.com/macros/s/AKfycbxGeM_cfinzTauq7smWdOY-ruVhn_Ao3GVAfFOLOcws4D1fQHoyfjrH56JDLsmwG2Wthg/exec
NEXT_PUBLIC_SHEET_KEY=szpk_jCMrkhtmzqLb-ROl
```

Then rebuild and push:

```bash
npm run export
```

The build prints which mode it is in:

```
bookings → Google Sheet (posted from the browser)
```

If it says `bookings → LINE only`, the two values above did not reach it.

---

## What the client can now change without a developer

- **Column widths, colours, frozen rows** — it is an ordinary spreadsheet.
- **Filters and sorting** — e.g. a filter view for tomorrow's covers.
- **Email on new booking** — in Sheets: *Tools → Notification settings → Notify me
  when… any changes are made*. No code.
- **A second tab for confirmed bookings** — move a row across as staff phone back.

Do not delete or rename the header row; the script writes positionally under it.

---

## Two things you should know

**The key inside the page is readable by anyone.** With no server, there is nobody
to keep a secret, so `szpk_jCMrkhtmzqLb-ROl` ships in the page and anyone who views
source can find it. That is by design and it is why the script's `MAX_PER_HOUR = 60`
matters — it is the actual guard on the sheet, not the key. If the sheet ever fills
with junk, lower that number, or change `PUBLIC_KEY` in both the script and
`.env.local` and redeploy; the old key stops working immediately.

**Why `text/plain` and not `application/json`.** Sending JSON with a JSON
content-type makes the browser ask Google for permission first (a CORS preflight).
Apps Script answers that with a redirect instead of permission, and the booking
never leaves the page — I watched it fail exactly that way. `text/plain` counts as a
"simple" request, skips the preflight, and goes straight through. The body is still
JSON; only the label changed. **Do not "fix" that content type.**

---

## If a booking does not arrive

| What you see | What it means |
|---|---|
| `bad_key` | Step 1 pasted, Step 2 skipped — redeploy as a **new version** |
| `bad_secret` | The old `Code.gs` is still deployed — do Step 1 |
| `rate_limited` | More than 60 in an hour. Raise `MAX_PER_HOUR` |
| Form shows the LINE message instead | The sheet was unreachable; the booking is not lost, the guest is handed a message to send. Check the `/exec` URL still answers |
| Nothing at all, no error | Look at the browser console, and confirm **Who has access: Anyone** |
