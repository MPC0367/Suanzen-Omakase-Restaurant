import type { MetadataRoute } from "next";
import { locales } from "@/content/dictionary";

/* Generated at build time so the static export can emit it as a file. */
export const dynamic = "force-static";

const SITE = "https://suanzen.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) => [
    {
      url: `${SITE}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
      alternates: { languages: { en: `${SITE}/en`, th: `${SITE}/th` } },
    },
  ]);
}
