/**
 * Prefix a site-absolute path with the deployment's basePath.
 *
 * Next does this for <Link> and for the files it builds itself, but not for a
 * raw <a href="/..."> and not for next/image's src when the optimiser is off
 * (`images: { unoptimized: true }`, which a static export requires). Those two
 * gaps are why every photograph and every nav link 404s on a GitHub project
 * site unless the prefix is added here.
 *
 * On a domain root the basePath is empty and this returns the path untouched.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(p: string): string {
  if (!BASE || !p.startsWith("/")) return p;
  return BASE + p;
}
