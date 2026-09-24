import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/* Generated at build time so the static export can emit it as a file. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Listed since 2026-09-24: everything is open to crawlers and the sitemap
  // is offered here. /photos/ is open too, so the dishes can appear in image
  // search — the earlier unlisted build blocked it. Remember robots.txt only
  // takes effect on a domain root; crawlers ignore it below one.
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
