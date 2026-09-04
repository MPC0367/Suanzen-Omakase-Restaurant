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

export type AlaItem = {
  nameEn: string;
  nameTh?: string;
  /** Baht, before ++. Leave undefined for market price. */
  price?: number;
  noteEn?: string;
  noteTh?: string;
  /** Path under /public/photos — drives the same hover preview as the courses. */
  photo?: string;
};

export type AlaSection = {
  id: string;
  titleEn: string;
  titleTh: string;
  items: AlaItem[];
};

export const alaCarte = {
  /** Flip to true once the restaurant supplies the list. */
  published: false,

  /** When the à la carte is actually served. */
  servedEn: "Thursday to Saturday, alongside the izakaya bar",
  servedTh: "พฤหัสบดี ถึง เสาร์ พร้อมกับอิซากายะ",

  sections: [] as AlaSection[],
};

export const alaSections = alaCarte.sections.filter((s) => s.items.length > 0);
export const alaIsPublished = alaCarte.published && alaSections.length > 0;
