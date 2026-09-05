/**
 * The site's public address, in one place.
 *
 * This is what canonical, hreflang, og:url, the sitemap, robots.txt and the
 * JSON-LD all publish as "where this page really lives". It was hardcoded to
 * https://suanzen.com — a placeholder that was never replaced, and a domain
 * that is not merely un-pointed but unregistered. Every URL the site offered
 * search engines and LINK previews resolved to nothing.
 *
 *   NEXT_PUBLIC_SITE_ORIGIN   scheme + host, no trailing slash
 *   NEXT_PUBLIC_BASE_PATH     "/repo-name" on a GitHub project site, "" on a domain
 *
 * On a custom domain set the origin and leave the base path empty; the export
 * script and the Pages workflow already work the base path out.
 */
const ORIGIN = (process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://mpc0367.github.io").replace(/\/$/, "");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const SITE = `${ORIGIN}${BASE}`;

/** The image link previews use. A real photograph of the room, not a logo. */
export const OG_IMAGE = `${SITE}/photos/78893251dcbe.jpg`;
