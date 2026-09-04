/**
 * Generate src/content/courses.ts for the live site from the data harvested out
 * of the two earlier artifacts. Written by machine so no price, dish name or
 * Thai string is retyped by hand.
 */
import fs from 'node:fs';

const pool = JSON.parse(fs.readFileSync('extracted/pool.json', 'utf8'));

/* Photographs, and which dishes each one was actually reported to show. */
const shots = JSON.parse(fs.readFileSync('/tmp/photos.json', 'utf8'))
  .filter((p) => p.bestUse !== 'skip' && p.quality >= 4 && p.category !== 'logo');

const norm = (s) =>
  s.toLowerCase()
    .replace(/[\u00b7\u2014\u2013-]/g, ' ')
    .replace(/\bwith\b|\bor\b|\bfresh\b|\bdesigned by suan zen\b|\bspecial\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const index = new Map();
for (const p of shots) {
  for (const d of p.dishMatches || []) {
    const k = norm(d);
    if (!k) continue;
    if (!index.has(k)) index.set(k, []);
    index.get(k).push(p);
  }
}
for (const arr of index.values()) arr.sort((a, b) => b.quality - a.quality || b.warmth - a.warmth);

/* One photograph per dish, and ONLY where a vision pass actually reported that
   photo as showing that dish. No substring fallback: "wagyu roll", "wagyu nabe"
   and "wagyu porridge" all contain "wagyu", and matching on that put one photo
   of wagyu sushi against three dishes it does not show. A dish with no reported
   match gets no photo and falls back to a course picture, captioned as the
   course — which is true — rather than as the dish, which would not be. */
const used = new Set();
const photoFor = (dishName) => {
  const cands = index.get(norm(dishName));
  if (!cands || !cands.length) return undefined;
  const chosen = cands.find((c) => !used.has(c.file)) || cands[0];
  used.add(chosen.file);
  return `/photos/${chosen.file}`;
};
const th = JSON.parse(fs.readFileSync('extracted/th_v3.json', 'utf8'));

// English descriptions live in the v3 markup; pull them straight out.
const lean = fs.readFileSync('/tmp/lean_v3.html', 'utf8');
const enOf = (slug, key) => {
  const re = new RegExp(`data-i18n="c\\.${slug}\\.${key}"[^>]*>([^<]*)<`);
  return (lean.match(re) || [])[1] || '';
};

const ORDER = ['ichi', 'ni', 'san', 'boss', 'yon', 'kids', 'sweet'];
const NAMES = {
  ichi: ['Zen Ichi', 'เซน อิจิ'],
  ni: ['Zen Ni', 'เซน นิ'],
  san: ['Zen San', 'เซน ซัง'],
  boss: ['Zen Boss', 'เซน บอส'],
  yon: ['Zen Yon', 'เซน ยง'],
  kids: ['Zen Kids', 'เซน คิดส์'],
  sweet: ['Zen Sweet', 'เซน สวีท'],
};
// The sweet course is three fixed menus of five; the flat list needs splitting.
const SWEET_SPLIT = [
  ['MENU A', 'เมนู A', 0, 6],
  ['MENU B', 'เมนู B', 6, 11],
  ['MENU C', 'เมนู C', 11, 15],
];

const out = [];
for (const slug of ORDER) {
  const c = pool.courses[slug];
  if (!c) continue;
  const [nameEn, nameTh] = NAMES[slug];
  const price = Number(String(c.price).replace(/[^\d]/g, ''));
  const entry = {
    id: `zen-${slug}`,
    slug: `zen-${slug}`,
    key: slug,
    index: String(ORDER.indexOf(slug) + 1).padStart(2, '0'),
    nameEn,
    nameTh,
    kanji: c.glyph,
    price,
    count: c.dishes,
    unitEn: c.unitEn === 'PIECES' ? 'pieces' : 'bites',
    unitTh: c.unitTh || 'คำ',
    descEn: enOf(slug, 'desc'),
    descTh: th[`c.${slug}.desc`] || '',
    forEn: enOf(slug, 'for'),
    forTh: th[`c.${slug}.for`] || '',
    listLabelEn: enOf(slug, 'label'),
    listLabelTh: th[`c.${slug}.label`] || '',
    // Zen Ichi's published list is a selection, not the whole fourteen.
    listIsPartial: slug === 'ichi',
    photos: (c.photoShas || []).map((s) => `/photos/${s}.jpg`),
    dishes: (c.dishListEn || []).map((d) => ({ nameEn: d, photo: photoFor(d) })),
  };
  if (slug === 'sweet') {
    entry.menus = SWEET_SPLIT.map(([en, thL, a, b]) => ({
      labelEn: en,
      labelTh: thL,
      dishes: (c.dishListEn || []).slice(a, b).map((d) => ({ nameEn: d, photo: photoFor(d) })),
    }));
    delete entry.dishes;
  }
  out.push(entry);
}

const ts = `/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE COURSES — the full menu
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every course, price, dish and Thai string here was carried over from the two
 *  earlier Suan Zen builds, which were made with the restaurant. Nothing in this
 *  file is invented: prices are the restaurant's, quoted ++ (before service and
 *  VAT) exactly as they quote them, and the dish lists are the ones the kitchen
 *  published.
 *
 *  Zen Ichi is the one exception worth knowing: the restaurant published a
 *  selection of seven from its fourteen, so \`listIsPartial\` is true there and
 *  the UI says so rather than implying the course is seven bites.
 *
 *  \`photo\` on a dish is filled in only where one of the restaurant's own
 *  photographs actually shows that dish — it drives the hover preview, so a
 *  wrong match would put the wrong picture against a priced item.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Dish = {
  nameEn: string;
  nameTh?: string;
  /** Path under /public. Undefined when no photograph shows this dish. */
  photo?: string;
};

export type SweetMenu = { labelEn: string; labelTh: string; dishes: Dish[] };

export type Course = {
  id: string;
  slug: string;
  key: string;
  index: string;
  nameEn: string;
  nameTh: string;
  kanji: string;
  /** Baht, before ++. */
  price: number;
  count: number;
  unitEn: string;
  unitTh: string;
  descEn: string;
  descTh: string;
  forEn: string;
  forTh: string;
  listLabelEn: string;
  listLabelTh: string;
  /** True when the published list is a selection, not the whole course. */
  listIsPartial: boolean;
  photos: string[];
  dishes?: Dish[];
  /** Zen Sweet is three fixed menus rather than one sequence. */
  menus?: SweetMenu[];
  featured?: boolean;
  active?: boolean;
};

export const courses: Course[] = ${JSON.stringify(out, null, 2)
  .replace(/"([a-zA-Z]+)":/g, '$1:')
  .replace(/"/g, '"')};

// Zen Ichi is where most first visits start.
courses.forEach((c) => {
  c.active = true;
  c.featured = c.key === 'ichi';
});

export const activeCourses = courses.filter((c) => c.active);
export const featuredCourse = courses.find((c) => c.featured) ?? courses[0];

/** ฿2,000 — grouped, no decimals. */
export const formatBaht = (n: number) => '฿' + n.toLocaleString('en-US');

/** Every dish across every course, flattened — used by the hover preview. */
export const allDishes = (c: Course): Dish[] =>
  c.menus ? c.menus.flatMap((m) => m.dishes) : (c.dishes ?? []);
`;

fs.writeFileSync('suan-zen/src/content/courses.ts', ts);
const totalDishes = out.reduce((a, c) => a + (c.dishes ? c.dishes.length : c.menus.reduce((x, m) => x + m.dishes.length, 0)), 0);
const shot = out.reduce((a, c) => a + (c.dishes ? c.dishes.filter(d=>d.photo).length : c.menus.reduce((x, m) => x + m.dishes.filter(d=>d.photo).length, 0)), 0);
console.log(`wrote courses.ts — ${shot} of ${totalDishes} dishes have their own photograph`);
for (const c of out) {
  const n = c.dishes ? c.dishes.length : c.menus.reduce((a, m) => a + m.dishes.length, 0);
  const withPhoto = (c.dishes ? c.dishes : c.menus.flatMap(m=>m.dishes)).filter(d=>d.photo).length;
  console.log(`  ${c.kanji} ${c.nameEn.padEnd(10)} ฿${String(c.price).padStart(5)}++  ${String(c.count).padStart(2)} ${c.unitEn.padEnd(6)} listed:${String(n).padStart(2)}  photographed:${String(withPhoto).padStart(2)}  coursePhotos:${c.photos.length}${c.listIsPartial ? '  (partial list)' : ''}`);
}
