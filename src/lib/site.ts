import { localeInfo, locales, type Locale } from "@/content/dictionary";

/**
 * The site's public address, in one place.
 *
 * This is what canonical, hreflang, og:url, og:image and the JSON-LD all
 * publish as "where this page really lives". It was hardcoded to
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

/** The image link previews use. A real photograph of the room, not a logo.
 *  It sits in /og/, not /photos/: robots.txt keeps /photos/ out of image
 *  search, and LINE's preview fetcher still has to reach this one. */
export const OG_IMAGE = `${SITE}/og/suan-zen.jpg`;


/** Every language's copy of one page, keyed the way hreflang wants them
 *  (en, th, zh-CN), plus x-default pointing at the English. `path` is what
 *  follows the locale, with its trailing slash: "/" or "/courses/zen-ni/". */
export const languageAlternates = (path: string) => ({
  ...Object.fromEntries(locales.map((l) => [localeInfo[l].html, `${SITE}/${l}${path}`])),
  "x-default": `${SITE}/en${path}`,
});

/** og:locale for this page, and og:locale:alternate for the other two. */
export const ogLocales = (locale: Locale) => ({
  locale: localeInfo[locale].og,
  alternateLocale: locales.filter((l) => l !== locale).map((l) => localeInfo[l].og),
});
