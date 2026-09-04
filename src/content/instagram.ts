/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE FEED
 * ─────────────────────────────────────────────────────────────────────────────
 *  Real posts from instagram.com/suanzenomakase, read off the public profile on
 *  2026-09-04. Permalinks and dates are the restaurant's own; nothing here is
 *  invented. The pictures are not copied — each card renders Instagram's own
 *  official embed, which is how a site is meant to show someone's posts, so the
 *  media stays on Instagram and stays current.
 *
 *  `category` is the one editorial judgement. It is filled in only where
 *  Instagram's own alt text says what a post shows; everything else sits in
 *  "moments", which means untagged, not "a moment". The restaurant should
 *  re-tag these — that is the only field here anyone needs to touch.
 *
 *  TO KEEP THIS CURRENT AUTOMATICALLY: swap this array for a fetch against the
 *  Instagram Basic Display API (`/me/media?fields=id,permalink,timestamp,
 *  media_type,caption`) using a long-lived token, and keep the same shape.
 *  Nothing in the component changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type PostCategory = "courses" | "counter" | "garden" | "afterDark" | "moments";

export type Post = {
  /** Instagram shortcode — the permalink is derived from it. */
  code: string;
  type: "image" | "video";
  /** ISO date of the post, as Instagram reports it. */
  date: string;
  category: PostCategory;
  /** Pinned to the top of the restaurant's own profile grid. */
  pinned?: boolean;
  /**
   * Instagram's own automatic description, where it published one. Used as the
   * card's text so the page says something true before the embed loads — and
   * so it still says something true if the embed never loads.
   */
  saysEn?: string;
  saysTh?: string;
};

export const posts: Post[] = [
  { code: "DZj9zbXGlTZ", type: "image", date: "2026-06-14", category: "moments", pinned: true },
  { code: "DV8AEZPiY9C", type: "image", date: "2026-03-16", category: "moments", pinned: true },
  { code: "DDmb0X6St1h", type: "image", date: "2024-12-15", category: "moments", pinned: true },

  { code: "DcC9wIcGpey", type: "image", date: "2026-08-14", category: "moments" },
  {
    code: "DbZ25ggsQlT", type: "image", date: "2026-07-29", category: "courses",
    saysEn: "Dessert, and caviar", saysTh: "ของหวาน และคาเวียร์",
  },
  { code: "DbKrdUcGhiI", type: "image", date: "2026-07-24", category: "moments" },
  { code: "DbAdrtPmltA", type: "image", date: "2026-07-20", category: "moments" },
  { code: "Dab-OgRmjmh", type: "image", date: "2026-07-05", category: "moments" },
  {
    code: "DaCkOW-MCi0", type: "video", date: "2026-06-26", category: "counter",
    saysEn: "Sushi, egg yolk, roe and caviar", saysTh: "ซูชิ ไข่แดง ไข่ปลา และคาเวียร์",
  },
  { code: "DZ6ZQepGoYp", type: "image", date: "2026-06-22", category: "moments" },
  {
    code: "DZhRb-fMf7m", type: "image", date: "2026-06-13", category: "garden",
    saysEn: "A lamppost", saysTh: "เสาไฟ",
  },
  { code: "DY_NyqomjhP", type: "image", date: "2026-05-30", category: "moments" },
];

export const permalink = (p: Post) =>
  `https://www.instagram.com/${p.type === "video" ? "reel" : "p"}/${p.code}/`;

export const categoryOrder: PostCategory[] = [
  "courses",
  "counter",
  "garden",
  "afterDark",
  "moments",
];

/** Categories that actually have posts, so the filter never offers an empty bin. */
export const usedCategories = categoryOrder.filter((c) => posts.some((p) => p.category === c));

export const formatPostDate = (iso: string, locale: "en" | "th") =>
  new Date(iso + "T00:00:00").toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
