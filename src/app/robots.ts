import type { MetadataRoute } from "next";

/* Generated at build time so the static export can emit it as a file. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // No sitemap: the brochure is not offered to search engines. Each page
  // carries noindex instead, and crawlers must be allowed in to read it.
  return { rules: { userAgent: "*", allow: "/" } };
}
