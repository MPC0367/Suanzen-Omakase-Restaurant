# Getting this online

The menu is a link Suan Zen sends in its LINE OA. It is **unlisted**: anyone
with the link can open it and pass it on, but it is not offered to search
engines. It is hosted on GitHub Pages and rebuilds on every push to `main`.

---

## How it stays off Google

- **Every page says `noindex, nofollow`**: the menu in both languages, the root
  redirect page and the 404. Google and Bing drop a page when they see that,
  and never list it.
- **robots.txt lets crawlers in.** They have to read a page to see its
  `noindex`. Never add `Disallow` for the pages; a blocked page can still be
  listed from links, just without its contents.
- **The photographs are blocked in robots.txt** (`Disallow: /photos/`), because
  `noindex` does not reach an image. This only works on a domain root:
  crawlers read robots.txt at the root of a host and nowhere else, so under
  `mpc0367.github.io/Suanzen-Omakase-Restaurant/` it is ignored.
- **The link-preview picture is in `/og/`**, outside that rule, so LINE can
  still fetch it for the preview.
- **No sitemap.**

What it does not do: stop someone who has the link from opening it or
forwarding it. It is a shareable link, not a locked page.

---

## Now · GitHub Pages

Push to `main` and the workflow in `.github/workflows/pages.yml` builds and
publishes. Watch it under the repo's **Actions** tab; the site is live at
https://mpc0367.github.io/Suanzen-Omakase-Restaurant/ a minute after a green
tick.

---

## Putting it on the restaurant's own domain

`public/CNAME` is the one switch. When it holds a domain, the workflow builds
for the domain root and points the link preview at that domain. GitHub does
not read the file itself; the domain is attached in the repo's settings.

Do the steps in this order. Verifying first stops anyone else attaching the
domain to their own GitHub site in the gap before you do.

1. **Register the domain to the restaurant.**
   - Put the restaurant's legal name in the *Organization* field, so the
     business, not whoever fills in the form, owns the domain.
   - If the registrar asks whether to publish that name, decline. Check the
     public record afterwards at [lookup.icann.org](https://lookup.icann.org).
   - Turn on auto-renew, with a card that will not expire.
   - A `.com` at Cloudflare Registrar is sold at cost, in US dollars: US$10.46
     (about 345 THB) a year until 31 October 2026, about US$11.2 (365–370 THB)
     from 1 November.
2. **Verify the domain with GitHub.** Your GitHub profile → **Settings →
   Pages → Add a domain**. Add the TXT record it shows
   (`_github-pages-challenge-mpc0367`) at the registrar, then click **Verify**.
3. **Point the DNS at GitHub.** At the registrar, add:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | AAAA | `@` | `2606:50c0:8000::153` |
   | AAAA | `@` | `2606:50c0:8001::153` |
   | AAAA | `@` | `2606:50c0:8002::153` |
   | AAAA | `@` | `2606:50c0:8003::153` |
   | CNAME | `www` | `mpc0367.github.io` |

   Cloudflare DNS proxies new records by default (orange cloud). Set each of
   these to **DNS only** (grey cloud) and leave them that way: it is the widely
   reported fix for GitHub failing to issue or renew the HTTPS certificate,
   though neither company documents it. If the domain has CAA records, one
   must allow `letsencrypt.org`.
4. **Attach it, and push the switch straight away.** In the repo → **Settings
   → Pages → Custom domain**, enter the domain and **Save**. Then at once:

   ```bash
   echo "suanzenomakase.com" > public/CNAME
   git add public/CNAME && git commit -m "Serve the menu from the restaurant's domain" && git push
   ```

   Between the Save and the green tick on that push, the page shows without
   its styling: GitHub is serving the old build at the new address. It is a
   minute or two.
5. **Turn on Enforce HTTPS** in the same settings once it lets you. The
   certificate usually arrives within an hour; GitHub allows up to 24.
6. **Regenerate the QR code** for the new address:

   ```bash
   node scripts/make-qr.mjs https://suanzenomakase.com/
   ```

Once the domain is attached, GitHub redirects the old github.io address to it
permanently, keeping the rest of the path, so links already sent in LINE keep
working. Open an old link after step 4 to check.

---

## Editing the site from here on

```bash
npm run dev          # http://localhost:4321 — see changes as you type
git add -A && git commit -m "what changed" && git push
```

The push rebuilds and redeploys. `out/` is gitignored; never build and commit
it by hand.
