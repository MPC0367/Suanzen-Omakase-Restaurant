import type { MetadataRoute } from "next";
import { locales } from "@/content/dictionary";
import { activeCourses } from "@/content/courses";
import { SITE, languageAlternates } from "@/lib/site";

/* Generated at build time so the static export can emit it as a file. */
export const dynamic = "force-static";

/**
 * Every listed page: the menu in each language, and each course's own page in
 * each language, with its translations attached the way hreflang wants them.
 * Not here, on purpose: the root and language-less /courses/… redirect pages
 * (they canonicalise or noindex themselves) and /404/.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...activeCourses.map((c) => `/courses/${c.slug}/`)];
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE}/${locale}${path}`,
      lastModified: new Date(),
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
