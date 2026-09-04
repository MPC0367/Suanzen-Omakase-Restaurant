# Getting this online

You have finished the Google Sheet side. This is the other half.

---

## Read this first: GitHub Pages cannot use your sheet

GitHub Pages only hands out files. There is no server on it, so there is
nowhere to keep your `SHEETS_WEBHOOK_SECRET` and nothing to make the request to
Apps Script. **A site on GitHub Pages will not write to the spreadsheet.** Its
booking form falls back to composing a message the guest copies into LINE.

That is a real fallback, not a broken one — but it is not what you just built.

So there are two shapes, and the choice is about the booking form only. The
menu, the photographs, the gallery, both languages and the Instagram page are
identical either way.

| | GitHub Pages | **Vercel** |
|---|---|---|
| Bookings reach the sheet | **no** | **yes** |
| Booking form does | copy-to-LINE | files it, then writes the row |
| Cost | free | free |
| Custom domain | yes | yes |
| Where the code lives | GitHub | GitHub |

**Take Vercel.** It reads from the same GitHub repo, so you still push to
GitHub exactly as you would have; Vercel just builds it with a server attached.
Everything below covers both, with the Vercel path marked.

---

## Step 1 · Put the code on GitHub

The repository is already initialised and committed locally. It needs a home.

**Create an empty repository.** On [github.com/new](https://github.com/new):

- **Repository name:** `suan-zen` (or anything)
- **Private** is fine — Vercel can read private repos
- **Do not** tick "Add a README", ".gitignore" or "license". The repo already
  has all three and an initial commit; adding them makes the first push
  conflict.

**Push.** In Terminal, from the `suan-zen` folder:

```bash
cd "/Users/natdanaisuanpong/Desktop/O2 Design Studio/suan-zen"
git remote add origin https://github.com/YOUR-USERNAME/suan-zen.git
git push -u origin main
```

If GitHub asks for a password, it wants a **personal access token**, not your
account password — GitHub Settings → Developer settings → Personal access
tokens → Fine-grained → give it access to that one repo with *Contents: Read
and write*. Paste the token as the password.

**Check what landed.** Your secret must not be in there:

```bash
git ls-files | grep -i env
```

You should see `.env.example` and nothing else. `.env.local`, `.data/` and
`out/` are all ignored.

---

## Step 2 · Deploy on Vercel — this is what makes the sheet work

1. Go to [vercel.com](https://vercel.com) and sign in **with GitHub**.
2. **Add New… → Project**, find `suan-zen`, press **Import**.
3. Leave every build setting alone. Vercel detects Next.js and gets it right.
4. Before pressing Deploy, open **Environment Variables** and add two:

   | Name | Value |
   |---|---|
   | `SHEETS_WEBHOOK_URL` | `https://script.google.com/macros/s/AKfycbxGeM_cfinzTauq7smWdOY-ruVhn_Ao3GVAfFOLOcws4D1fQHoyfjrH56JDLsmwG2Wthg/exec` |
   | `SHEETS_WEBHOOK_SECRET` | the `SECRET` from the top of your `Code.gs` |

   Leave all three environment checkboxes ticked (Production, Preview,
   Development).

5. **Deploy.** Two or three minutes.

You get a URL like `suan-zen.vercel.app`. Open `/en/book`, take a booking, and
the row appears in the sheet under the header.

**A custom domain:** Vercel → Settings → Domains → add it, then point the
domain's DNS at the records Vercel shows you. Also change `SITE` in
`src/app/[locale]/layout.tsx` and `src/app/sitemap.ts` from the placeholder
`https://suanzen.com` to the real domain, so canonical URLs and the sitemap are
right.

**If you add or change an environment variable later**, redeploy — Vercel bakes
them in at build time. Deployments → ⋯ → Redeploy.

---

## Step 2 (alternative) · GitHub Pages, without the sheet

Only if you have decided the copy-to-LINE fallback is enough.

1. Push as in Step 1.
2. Repo → **Settings → Pages → Source → GitHub Actions**.

That is all. `.github/workflows/pages.yml` is already in the repo: it builds the
static export on every push and works out whether the site sits at
`you.github.io/suan-zen/` or at a domain root, so asset paths come out right
without you touching anything.

Watch it run under the **Actions** tab. First run takes about three minutes.

**Custom domain:** put the bare domain in `public/CNAME` (one line, no
`https://`), commit, and set it under Settings → Pages. The workflow notices the
file and builds for a root path.

---

## Step 3 · Test the connection from your own machine

Before or after deploying, you can prove the sheet link works:

```bash
cd "/Users/natdanaisuanpong/Desktop/O2 Design Studio/suan-zen"
```

Open `.env.local` and paste your secret after `SHEETS_WEBHOOK_SECRET=` — the URL
is already filled in. Then:

```bash
npm run check:sheet
```

It pings the deployment, checks the secret, and writes one row labelled
`SZ-CHECK` that you can delete. If something is wrong it tells you which of the
three things it was.

To try the whole flow locally:

```bash
npm run build && npm run start
```

then open <http://localhost:4321/en/book>.

---

## What is already in the repo

You do not need to create any of these.

| | |
|---|---|
| `.github/workflows/pages.yml` | builds and publishes to GitHub Pages on every push |
| `.github/workflows/ci.yml` | typechecks, builds, exports and runs the browser QA suite on every push and pull request |
| `.env.example` | the template; the real values go in `.env.local`, which is ignored |
| `.gitignore` | keeps out `node_modules`, `out/`, screenshots, **`.env*.local`** and **`.data/`** (real guest names and phone numbers) |
| `.nvmrc` | Node 22, so CI and your machine agree |
| `.editorconfig`, `.gitattributes` | consistent formatting and line endings |
| `tools/sheet-webhook.gs` | the Apps Script you already deployed, kept under version control |
| `scripts/check-sheet.mjs` | `npm run check:sheet` |
| `scripts/export.mjs` | `npm run export` — the static build |

---

## If a booking does not reach the sheet

The booking is never lost. It is written to `.data/reservations.jsonl` on the
server **before** the sheet is contacted, so it can always be re-entered by
hand. The API response says what happened:

| `sheet` in the response | meaning | fix |
|---|---|---|
| `written` | the row is in the spreadsheet | — |
| `not_configured` | the two variables are not set | add them, then redeploy |
| `rejected` | script answered but refused | `SECRET` mismatch — or you edited `Code.gs` without deploying a **new version** |
| `timeout` / `error` | the script could not be reached | wrong URL, or access is not set to *Anyone* |

On Vercel you can see it under Deployments → the deployment → **Functions →
Logs**; failures are logged with the booking's reference.

The single most common cause is the last one in the `rejected` row: in Apps
Script, saving is not deploying. **Deploy → Manage deployments → edit (pencil) →
Version: New version → Deploy.**
