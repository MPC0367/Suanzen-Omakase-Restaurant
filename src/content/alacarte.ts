/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  À LA CARTE / THE BAR MENU
 * ─────────────────────────────────────────────────────────────────────────────
 *  Suan Zen serves à la carte alongside the omakase — the izakaya bar runs
 *  Thursday to Saturday until midnight, and single dishes are available then.
 *
 *  THE LIST BELOW IS EMPTY ON PURPOSE. The à la carte menu was not in either of
 *  the earlier builds, is not on the restaurant's Facebook or Instagram, and is
 *  not on any listing site. Rather than invent dishes and prices next to the
 *  real omakase ones, the section renders a designed "ask us" state and points
 *  at LINE until the restaurant sends the list.
 *
 *  TO PUBLISH IT: add the sections and items below and set `published: true`.
 *  The section, its layout and its Thai copy are already built and will simply
 *  start showing the food.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { L10n } from "./dictionary";
import type { Named } from "./courses";

export type AlaItem = {
  /** The restaurant's own name; Thai only where it gives one. */
  name: Named;
  /** Baht, before ++. Leave undefined for market price. */
  price?: number;
  note?: L10n;
  /** Path under /public/photos — drives the same hover preview as the courses. */
  photo?: string;
};

export type AlaSection = {
  id: string;
  title: L10n;
  items: AlaItem[];
};

export const alaCarte = {
  /** Flip to true once the restaurant supplies the list. */
  published: false,

  /** When the à la carte is actually served. */
  served: {
    en: "Thursday to Saturday, alongside the izakaya bar",
    th: "พฤหัสบดี ถึง เสาร์ พร้อมกับอิซากายะ",
    zh: "周四至周六，居酒屋营业时供应",
  } satisfies L10n as L10n,

  sections: [] as AlaSection[],
};

export const alaSections = alaCarte.sections.filter((s) => s.items.length > 0);
export const alaIsPublished = alaCarte.published && alaSections.length > 0;
