import { photos, type Photo } from "@/content/media";

/**
 * Which photograph goes where.
 *
 * Picking is deterministic and done once at module load: each slot states what
 * it wants, takes the best remaining match, and marks it used — so no picture
 * appears twice on the page and the choice never changes between renders.
 */

const taken = new Set<string>();

type Want = {
  category?: Photo["category"][];
  people?: boolean;
  orientation?: Photo["orientation"];
  minWarmth?: number;
  /** Rank by warmth first rather than by picture quality. */
  preferWarm?: boolean;
};

function take(want: Want): Photo | undefined {
  const pool = photos
    .filter((p) => !taken.has(p.file))
    .filter((p) => (want.category ? want.category.includes(p.category) : true))
    .filter((p) => (want.people === undefined ? true : p.hasPeople === want.people))
    .filter((p) => (want.orientation ? p.orientation === want.orientation : true))
    .filter((p) => (want.minWarmth ? p.warmth >= want.minWarmth : true))
    .sort((a, b) =>
      want.preferWarm
        ? b.warmth * 10 + b.quality - (a.warmth * 10 + a.quality)
        : b.quality * 10 + b.warmth - (a.quality * 10 + a.warmth),
    );
  const chosen = pool[0];
  if (chosen) taken.add(chosen.file);
  return chosen;
}

/** Relax the request until something comes back, so a slot is never empty. */
function takeAny(...wants: Want[]): Photo | undefined {
  for (const w of wants) {
    const p = take(w);
    if (p) return p;
  }
  return photos.find((p) => !taken.has(p.file));
}

/* The room, with life in it, opens the site. */
export const heroShot = takeAny(
  { category: ["interior"], people: true, minWarmth: 6 },
  { category: ["chef", "people"], minWarmth: 7, orientation: "landscape" },
  { category: ["interior"] },
  { category: ["food"], orientation: "landscape" },
);

export const gardenShots = [
  takeAny({ category: ["signage"] }, { category: ["exterior"] }),
  takeAny({ category: ["exterior"] }, { category: ["interior"] }),
  takeAny({ category: ["interior"] }, { category: ["detail", "food"] }),
].filter(Boolean) as Photo[];

export const counterShot = takeAny(
  { category: ["chef"], people: true },
  { category: ["chef"] },
  { category: ["interior"] },
);

export const craftShots = [
  takeAny({ category: ["chef"] }, { category: ["detail"] }),
  takeAny({ category: ["chef"] }, { category: ["food"], orientation: "portrait" }),
  takeAny({ category: ["detail"] }, { category: ["food"] }),
].filter(Boolean) as Photo[];

export const afterDarkShot = takeAny(
  { category: ["people"], minWarmth: 6 },
  { category: ["interior"] },
  { category: ["food"] },
);

/* The gallery is sequenced: food, room, hand, guest, garden, food, … */
export const gallerySequence: Photo[] = [
  takeAny({ category: ["food"], orientation: "portrait" }, { category: ["food"] }),
  takeAny({ category: ["interior"] }, { category: ["exterior"] }),
  takeAny({ category: ["chef"] }, { category: ["detail"] }),
  takeAny({ category: ["people"], preferWarm: true }),
  takeAny({ category: ["exterior"] }, { category: ["signage"] }),
  takeAny({ category: ["food"] }),
  takeAny({ category: ["people"], preferWarm: true }),
  takeAny({ category: ["food"], orientation: "landscape" }, { category: ["food"] }),
  takeAny({ category: ["chef"] }, { category: ["people"] }),
  takeAny({ category: ["food"] }),
  takeAny({ category: ["food"] }),
  takeAny({ category: ["food"] }),
].filter(Boolean) as Photo[];

/* The Instagram teaser on the home page. It used to render three pieces of
   procedural artwork with no photograph behind them, so the section that
   promises "what is on the counter now" showed three blurred plates. A dish,
   a table of guests, the room — the three things the feed is actually full
   of. */
export const socialShots: Photo[] = [
  takeAny({ category: ["food"], orientation: "portrait" }, { category: ["food"] }),
  takeAny({ category: ["people"], preferWarm: true }, { category: ["chef"] }),
  takeAny({ category: ["interior"] }, { category: ["detail"] }, { category: ["exterior"] }),
].filter(Boolean) as Photo[];

/** Everything not spoken for, for the "more" grid. */
export const remaining = photos.filter((p) => !taken.has(p.file));
