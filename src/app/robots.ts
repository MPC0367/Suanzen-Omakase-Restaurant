import type { MetadataRoute } from "next";

/* Generated at build time so the static export can emit it as a file. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // No sitemap: the menu is not offered to search engines. Each page carries
  // noindex instead, and crawlers must be allowed in to read it — never
  // Disallow the pages. The photographs are the exception: noindex does not
  // reach an image, so this keeps them out of image search. It only takes
  // effect on a domain root (crawlers ignore robots.txt below one). The
  // link-preview picture lives in /og/, outside this rule, so LINE can fetch it.
  return { rules: { userAgent: "*", allow: "/", disallow: "/photos/" } };
}
