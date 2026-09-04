/**
 * Read the site's content files without a TypeScript toolchain.
 *
 * courses.ts, media.ts, dictionary.ts and restaurant.ts are plain data behind a
 * type annotation, so the literal is lifted out and evaluated. Doing it this way
 * means the artifact is generated from exactly the same prices, dish lists and
 * Thai strings the live site serves — there is no second copy to drift.
 *
 * Comments are stripped first. They are full of apostrophes ("the restaurant's
 * own") and braces, and a scanner that treats those as real code loses track of
 * where the object ends.
 */
import fs from 'node:fs';
import path from 'node:path';

const read = (f) => fs.readFileSync(path.join('src/content', f), 'utf8');

/** Remove // and /* *\/ comments, leaving string contents untouched. */
function stripComments(src) {
  let out = '', quote = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i], next = src[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') { out += src[++i] ?? ''; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue; }
    if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i++; // land on the '/'
      out += ' ';
      continue;
    }
    out += c;
  }
  return out;
}

/**
 * Remove TypeScript assertions from a data literal — `as const`, `as Foo`,
 * `satisfies Foo` — leaving string contents alone.
 */
function stripTypes(src) {
  let out = '', quote = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      out += c;
      if (c === '\\') { out += src[++i] ?? ''; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue; }
    // A type expression: const, or Name<Args> with any number of [] suffixes,
    // optionally unioned. Matching it exactly avoids the trap of a character
    // class swallowing the [ of `Seating[]` and orphaning the ].
    const TYPE = /^\s+(?:as|satisfies)\s+(?:const|[A-Za-z_$][\w$.]*(?:<[^<>]*>)?(?:\[\])*(?:\s*\|\s*[A-Za-z_$][\w$.]*(?:\[\])*)*)/;
    const m = TYPE.exec(src.slice(i));
    if (m) { i += m[0].length - 1; continue; }
    out += c;
  }
  return out;
}

/** Lift the bracketed literal that follows `export const NAME`. */
function literal(src, name) {
  const clean = stripComments(src);
  const decl = clean.indexOf(`export const ${name}`);
  if (decl === -1) throw new Error(`${name} not declared`);

  // Walk forward to the first [ or { after the '=' that opens the value.
  let i = clean.indexOf('=', decl + `export const ${name}`.length);
  while (i < clean.length && clean[i] !== '[' && clean[i] !== '{') i++;
  const open = clean[i];
  const close = open === '[' ? ']' : '}';

  let depth = 0, quote = null, out = '';
  for (; i < clean.length; i++) {
    const c = clean[i];
    out += c;
    if (quote) {
      if (c === '\\') { out += clean[++i] ?? ''; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) break; }
  }
  if (depth !== 0) throw new Error(`${name}: unbalanced literal`);

  // v(value, verified, note) in restaurant.ts collapses to its value.
  const v = (value) => value;
  // eslint-disable-next-line no-new-func
  return new Function('v', `return (${stripTypes(out)});`)(v);
}

export const courses = literal(read('courses.ts'), 'courses');
export const photos = literal(read('media.ts'), 'photos');
export const dict = literal(read('dictionary.ts'), 'dict');
export const restaurant = literal(read('restaurant.ts'), 'restaurant');
export const alaCarte = literal(read('alacarte.ts'), 'alaCarte');
export const booking = literal(read('booking.ts'), 'booking');
