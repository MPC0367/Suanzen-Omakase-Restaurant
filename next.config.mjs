/**
 * Two builds come out of this one codebase.
 *
 *  npm run build   — the full app. Booking requests POST to /api/reservations,
 *                    which validates them and files them. Deploy to Vercel,
 *                    Netlify, or any Node host.
 *
 *  npm run export  — a folder of static HTML for GitHub Pages. There is no
 *                    server, so the booking form hands off to LINE instead of
 *                    posting, and Next's image optimiser is turned off.
 *
 * STATIC_EXPORT is set by the export script; BASE_PATH is for a GitHub project
 * site served from /<repo>/ rather than the domain root.
 *
 * Next prefixes basePath onto <Link> and onto its own build assets, but NOT
 * onto a raw <a href="/..."> or onto next/image's src once the optimiser is
 * off — those come out absolute and 404 on a project site. So the basePath is
 * also published to the client, and src/lib/asset.ts applies it by hand.
 */
const isExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },

  ...(isExport
    ? {
        output: "export",
        // No server means no on-demand image optimisation.
        images: { unoptimized: true },
        // Every route becomes a folder with an index.html, so links work
        // without server-side rewriting.
        trailingSlash: true,
        basePath: basePath || undefined,
        assetPrefix: basePath || undefined,
      }
    : {
        images: { formats: ["image/avif", "image/webp"] },
        // Redirects need a server; the export writes its own root index.html.
        async redirects() {
          return [{ source: "/", destination: "/en", permanent: false }];
        },
      }),
};

export default nextConfig;
