/**
 * Generate src/content/media.ts — the photograph catalogue.
 * Source: the restaurant's own pictures, harvested out of the two earlier
 * Suan Zen builds plus their Facebook and Instagram, then described one by one.
 */
import fs from 'node:fs';

const photos = JSON.parse(fs.readFileSync('/tmp/photos.json', 'utf8'));
const pool = JSON.parse(fs.readFileSync('extracted/pool.json', 'utf8'));

// Where each file came from, so the catalogue records provenance.
const origin = {};
for (const im of pool.images) origin[im.file.replace(/^(v2|v3|fb|ig)-/, '').replace('.jpg', '')] = im;
const originOf = (file) => {
  const sha = file.replace('.jpg', '');
  const rec = pool.images.find((i) => i.sha === sha) || {};
  const s = rec.sources || [];
  if (s.includes('facebook')) return 'facebook';
  if (s.includes('instagram')) return 'instagram';
  return 'archive';
};

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

const usable = photos
  .filter((p) => p.bestUse !== 'skip' && p.quality >= 4 && p.category !== 'logo')
  .map((p) => ({
    file: `/photos/${p.file}`,
    category: p.category,
    hasPeople: p.hasPeople,
    warmth: p.warmth,
    quality: p.quality,
    orientation: p.orientation,
    altEn: clean(p.altEn).slice(0, 150),
    altTh: clean(p.altTh).slice(0, 150),
    dishMatches: p.dishMatches || [],
    bestUse: p.bestUse,
    source: originOf(p.file),
  }))
  .sort((a, b) => b.quality - a.quality);

const skipped = photos.filter((p) => p.bestUse === 'skip' || p.quality < 4 || p.category === 'logo');

const ts = `/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE PHOTOGRAPH CATALOGUE
 * ─────────────────────────────────────────────────────────────────────────────
 *  ${usable.length} of the restaurant's own photographs, recovered from the two earlier
 *  Suan Zen builds and from their Facebook and Instagram, then described one by
 *  one so every picture carries real alt text in both languages.
 *
 *  \`warmth\` is the thing the owner asked for: how much a picture carries the
 *  feeling of the room — guests, smiles, a full table, the chef among people —
 *  rather than a plate on its own. The site leans on the high-warmth pictures
 *  deliberately; see \`peopleShots\` below.
 *
 *  Files live in /public/photos, named by the SHA of their bytes, so the same
 *  photograph appearing in two places is stored once.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Photo = {
  file: string;
  category: "food" | "people" | "chef" | "interior" | "exterior" | "detail" | "signage" | "other";
  hasPeople: boolean;
  /** 0–10: how much of the restaurant's warmth this picture carries. */
  warmth: number;
  quality: number;
  orientation: "portrait" | "landscape" | "square";
  altEn: string;
  altTh: string;
  /** Menu dishes this photograph actually shows. */
  dishMatches: string[];
  bestUse: string;
  source: "archive" | "facebook" | "instagram";
};

export const photos: Photo[] = ${JSON.stringify(usable, null, 2)};

/** The pictures with people in them — the ones the room is actually about. */
export const peopleShots = photos
  .filter((p) => p.hasPeople || p.warmth >= 7)
  .sort((a, b) => b.warmth * b.quality - a.warmth * a.quality);

export const foodShots = photos.filter((p) => p.category === "food" || p.category === "detail");
export const roomShots = photos.filter((p) => p.category === "interior" || p.category === "exterior" || p.category === "signage");

export const byFile = (f: string) => photos.find((p) => p.file === f || p.file.endsWith("/" + f));

/** Photographs that show a given dish, best first. */
export const shotsForDish = (dish: string) =>
  photos
    .filter((p) => p.dishMatches.some((d) => d.toLowerCase() === dish.toLowerCase()))
    .sort((a, b) => b.quality - a.quality);
`;

fs.writeFileSync('suan-zen/src/content/media.ts', ts);

console.log(`wrote media.ts — ${usable.length} photographs (${skipped.length} set aside)`);
const c = (k) => usable.filter((p) => p.category === k).length;
console.log(`  food:${c('food')} people:${c('people')} chef:${c('chef')} interior:${c('interior')} exterior:${c('exterior')} signage:${c('signage')}`);
console.log(`  warmth>=7: ${usable.filter((p) => p.warmth >= 7).length}   with people: ${usable.filter((p) => p.hasPeople).length}`);
console.log(`  from: archive ${usable.filter((p) => p.source === 'archive').length} · facebook ${usable.filter((p) => p.source === 'facebook').length} · instagram ${usable.filter((p) => p.source === 'instagram').length}`);
console.log('\n  set aside:');
skipped.forEach((p) => console.log(`    ${p.file}  q${p.quality} ${p.category}  ${clean(p.subject).slice(0, 70)}`));
