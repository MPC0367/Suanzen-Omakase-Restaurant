import type { MetadataRoute } from "next";
import { locales } from "@/content/dictionary";
import { SITE } from "@/lib/site";

/* Generated at build time so the static export can emit it as a file. */
export const dynamic = "force-static";

/* Trailing slashes, because that is what the pages' own canonical tags use and
   what the export actually serves — a mismatch makes every entry a redirect. */
const PAGES = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/book", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/instagram", priority: 0.6, changeFrequency: "weekly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return locales.flatMap((locale) =>
    PAGES.map((page) => ({
      url: `${SITE}/${locale}${page.path}/`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE}/${l}${page.path}/`]),
        ),
      },
    })),
  );
}
