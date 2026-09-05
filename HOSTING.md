# Getting this online

Your route is **GitHub now, Cloudflare with a domain when the client wants one.**
This is set up for exactly that, and the switch between them is one file.

---

## How the two shapes differ

A site living at `github.io/Suanzen-Omakase-Restaurant/` and a site living at
`suanzenomakase.com/` need **different builds**. Every image and link has to
carry the `/Suanzen-Omakase-Restaurant` prefix in the first case and must not
carry it in the second.

Getting that wrong is not subtle — it is the entire site with no styling, no
photographs and a menu that 404s. That is precisely what was live before, because
the build was made for a custom domain and then the CNAME was removed.

You do not have to think about it. `.github/workflows/pages.yml` works it out:

```
if public/CNAME exists  -> build for a domain root
else                    -> build for /<repo-name>/
```

So the day the client buys a domain, you add one file and the build follows.

---

## Now · GitHub Pages

Everything is committed. Two things happen on your side.

### 1 · Push the source

The repo currently holds a **built copy** of the site rather than the code, and
its history is unrelated to this project's. Replacing it puts the source there,
so the site rebuilds itself on every push instead of you building by hand.

```bash
git push --force origin main
```

### 2 · Point Pages at the Action

On GitHub: **Settings → Pages → Build and deployment → Source**, change
**Deploy from a branch** to **GitHub Actions**. Save.

That is the whole setup. From then on, every `git push` rebuilds and redeploys.

Watch it run under the repo's **Actions** tab. A green tick means the new site is
live at https://mpc0367.github.io/Suanzen-Omakase-Restaurant/ within a minute.

The build refuses to publish a site whose booking form cannot reach the
spreadsheet, so a green tick also means bookings are wired.

---

## Later · Cloudflare and the client's domain

Two ways, depending on whether you want to keep GitHub Pages alive.

### Option 1 — Cloudflare Pages builds from the repo (recommended)

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
pick this repository, then set:

| Field | Value |
|---|---|
| Framework preset | **None** |
| Build command | `npm run export` |
| Build output directory | `out` |
| Node version | `22` |

Add two environment variables — the same public pair the Action uses:

```
NEXT_PUBLIC_SHEET_URL   https://script.google.com/macros/s/AKfycbxGeM_.../exec
NEXT_PUBLIC_SHEET_KEY   szpk_jCMrkhtmzqLb-ROl
```

Note there is **no `--base`** in that build command. Cloudflare serves from the
domain root, which is exactly what a plain `npm run export` produces. Then attach
the client's domain under **Custom domains**.

### Option 2 — keep GitHub Pages, put the domain on it

Create `public/CNAME` containing just the domain:

```bash
echo "suanzenomakase.com" > public/CNAME && git add public/CNAME && git commit -m "Add the domain" && git push
```

The workflow sees that file and switches to a root build on its own. Then point
the domain's DNS at GitHub Pages.

---

## Editing the site from here on

```bash
npm run dev          # http://localhost:4321 — see changes as you type
git add -A && git commit -m "what changed" && git push
```

The push rebuilds and redeploys. You never build by hand again.

---

## What is NOT needed any more

**Vercel.** Earlier notes recommended it, because the booking form used to need a
server to hold a secret. It does not: the browser posts to Apps Script directly,
so a plain static host reaches the spreadsheet. Vercel still works if you ever
want the server-side API route, but nothing requires it.

**Building and committing the `out/` folder.** The Action does it. `out/` is
gitignored on purpose — a built copy in the repo is how the live site drifted out
of sync with the code in the first place.
