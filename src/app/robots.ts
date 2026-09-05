import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/* Generated at build time so the static export can emit it as a file. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
