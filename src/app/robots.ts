import type { MetadataRoute } from "next";

/* Generated at build time so the static export can emit it as a file. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://suanzen.com/sitemap.xml",
  };
}
