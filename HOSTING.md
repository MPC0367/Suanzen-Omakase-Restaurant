# Getting this online

The menu is a link Suan Zen sends in its LINE OA. It is **unlisted**: anyone
with the link can open it and pass it on, but it is not offered to search
engines. It is hosted on GitHub Pages and rebuilds on every push to `main`.

---

## How it stays off Google

- **Every page says `noindex, nofollow`**, including the root redirect page.
  Google and Bing drop a page when they see that, and never list it.
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
for the domain root and points the link preview at that domain. Until the
domain is attached in GitHub, a build like that breaks the github.io address,
so do the steps in this order.

1. **Register the domain in the restaurant's name.** A `.com` at Cloudflare
   Registrar costs about 345 THB a year, sold at cost, with contact details
   hidden. Leave the *Organization* field blank, or the restaurant's name is
   published in the domain's public record. Turn on auto-renew.
2. **Point the DNS at GitHub.** At the registrar, add:

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

   On Cloudflare DNS, set each record to **DNS only** (grey cloud), or GitHub
   cannot issue the HTTPS certificate.
3. **Verify the domain with GitHub** so nobody else can attach it: your GitHub
   profile → **Settings → Pages → Add a domain**, then add the TXT record it
   shows.
4. **Attach it:** the repo → **Settings → Pages → Custom domain**, enter the
   domain, **Save**. Wait for the DNS check to pass, then tick
   **Enforce HTTPS** once it lets you (the certificate can take up to an hour).
5. **Add `public/CNAME` and push:**

   ```bash
   echo "suanzenomakase.com" > public/CNAME
   git add public/CNAME && git commit -m "Serve the menu from the restaurant's domain" && git push
   ```

6. **Regenerate the QR code** for the new address:

   ```bash
   node scripts/make-qr.mjs https://suanzenomakase.com/
   ```

The old github.io address forwards to the domain from step 4 on, so links
already sent in LINE keep working.

---

## Editing the site from here on

```bash
npm run dev          # http://localhost:4321 — see changes as you type
git add -A && git commit -m "what changed" && git push
```

The push rebuilds and redeploys. `out/` is gitignored; never build and commit
it by hand.
