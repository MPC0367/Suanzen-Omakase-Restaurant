import type { Locale } from "@/content/dictionary";

/**
 * Keeping the guest's place across a change of language.
 *
 * The three editions are the same page in different words, and the words are
 * not the same length — Chinese runs shorter than English, Thai longer — so
 * the scroll offset alone would land the guest somewhere else on the new page.
 * What is kept instead is the elements with an id that sit under the header
 * (a course, a section, the finder), innermost first, and how far down each
 * the guest had read, plus which course was open. The new page opens that
 * course and puts the same point of the innermost of them that it is showing
 * back under the header. Some of them may not be showing there — the course
 * finder's answer does not travel with the guest — and then the next one out
 * is used, and failing all of them the old offset.
 *
 * It is held in memory for the site's own navigation, and in sessionStorage
 * for a page that loads whole (the preview artifact, a browser without the
 * router). It is stamped with the language it is for and a time, so a place
 * kept and never used cannot turn up on some later visit.
 */
type Spot = { id: string; frac: number };
type Place = { to: Locale; at: number; spots: Spot[]; y: number; open: string[]; focus: boolean };

const KEY = "suanzen:place";
const FRESH = 15_000;
let held: Place | null = null;

/** The reading line: just under the header. */
const line = () =>
  (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hdr-h")) || 64) + 12;

/** `focus`: the change was made from the keyboard, so the new page gives the
    focus back to the language button. */
export function keepPlace(to: Locale, { focus = false }: { focus?: boolean } = {}) {
  const at = line();
  const spots: Spot[] = [];
  // Document order puts a parent before its children, so reversed, the
  // elements spanning the reading line run from the innermost outwards.
  document.querySelectorAll<HTMLElement>("main [id]").forEach((el) => {
    if (el.closest("svg")) return;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.top <= at && r.bottom > at) spots.unshift({ id: el.id, frac: (at - r.top) / r.height });
  });
  const open = Array.from(document.querySelectorAll<HTMLElement>('.course__btn[aria-expanded="true"]'))
    .map((b) => b.closest<HTMLElement>("[id^='course-']")?.id.slice("course-".length))
    .filter((id): id is string => !!id);
  held = { to, at: Date.now(), spots: spots.slice(0, 4), y: window.scrollY, open, focus };
  try { sessionStorage.setItem(KEY, JSON.stringify(held)); } catch { /* private mode: memory still carries it */ }
}

/** The place kept for this page, if there is one and it is recent. */
export function placeFor(locale: Locale): Place | null {
  let p = held;
  if (!p) {
    try { p = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { p = null; }
  }
  if (!p || p.to !== locale || Date.now() - p.at > FRESH || !Array.isArray(p.spots)) return null;
  return p;
}

export function dropPlace() {
  held = null;
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

/** Where the kept point is on this page, in page coordinates — the same answer
    however often it is asked, wherever the page happens to be scrolled. */
function target(p: Place): number {
  for (const s of p.spots) {
    const el = document.getElementById(s.id);
    const r = el?.getBoundingClientRect();
    if (r && r.height > 0) return window.scrollY + r.top + s.frac * r.height - line();
  }
  return p.y;
}

/** Put the kept point back under the header, at once. Returns where it landed. */
export function restorePlace(p: Place): number {
  const y = Math.max(0, target(p));
  const html = document.documentElement;
  const was = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";   // a glide here would show the page arriving
  window.scrollTo(0, y);
  html.style.scrollBehavior = was;
  return window.scrollY;
}
