/**
 * Harvest every photograph and every menu fact out of the two earlier
 * Suan Zen artifacts, keyed by the SHA of the image bytes so the same picture
 * appearing in both versions is stored once and keeps whichever caption is
 * richer.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const T = '/Users/natdanaisuanpong/.claude/projects/-Users-natdanaisuanpong-Desktop-O2-Design-Studio/0c12fa03-cc19-4788-8e06-96162f61dab7/tool-results';
const OUT = '/Users/natdanaisuanpong/Desktop/O2 Design Studio/extracted';
const IMG = path.join(OUT, 'media');
fs.mkdirSync(IMG, { recursive: true });

const sources = fs.readdirSync(T).filter((f) => f.endsWith('.html'))
  .map((f) => ({ tag: f.includes('4e9e2f27') ? 'v3' : 'v2', path: path.join(T, f) }));

const bySha = new Map();

function store(b64, ext, meta, tag) {
  const raw = Buffer.from(b64, 'base64');
  const sha = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12);
  if (!bySha.has(sha)) {
    const file = `${sha}.${ext === 'jpeg' ? 'jpg' : ext}`;
    fs.writeFileSync(path.join(IMG, file), raw);
    bySha.set(sha, { sha, file, bytes: raw.length, sources: [], altEn: '', altTh: '', roles: [] });
  }
  const rec = bySha.get(sha);
  if (!rec.sources.includes(tag)) rec.sources.push(tag);
  if (meta.altEn && meta.altEn.length > rec.altEn.length) rec.altEn = meta.altEn;
  if (meta.altTh && meta.altTh.length > rec.altTh.length) rec.altTh = meta.altTh;
  if (meta.role && !rec.roles.includes(meta.role)) rec.roles.push(meta.role);
  return sha;
}

const shaOf = (b64) =>
  crypto.createHash('sha1').update(Buffer.from(b64, 'base64')).digest('hex').slice(0, 12);

const result = { courses: {}, gallery: [], moments: [], sections: [] };

for (const { tag, path: p } of sources) {
  const html = fs.readFileSync(p, 'utf8');

  // ── <img> tags, with their alt and nearest figcaption ────────────────────
  const imgRe = /<img\b([^>]*?)src="data:image\/([a-z]+);base64,([^"]+)"([^>]*)>/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    const attrs = m[1] + ' ' + m[4];
    const alt = (attrs.match(/alt="([^"]*)"/i) || [])[1] || '';
    const cls = (attrs.match(/class="([^"]*)"/i) || [])[1] || '';
    const id = (attrs.match(/id="([^"]*)"/i) || [])[1] || '';
    // figcaption immediately after
    const after = html.slice(m.index + m[0].length, m.index + m[0].length + 400);
    const cap = (after.match(/<figcaption[^>]*>[\s\S]*?>([^<]{3,120})</) || [])[1] || '';
    store(m[3], m[2], { altEn: alt || cap, role: (id || cls.split(/\s+/)[0] || 'img') }, tag);
  }

  // ── data-photos="b64|b64|..." on course panels (v3) ──────────────────────
  const courseRe = /<article class="course"[^>]*id="panel-([a-z]+)"[^>]*?data-dishes="(\d+)"[^>]*?data-price="([^"]*)"[^>]*?data-glyph="([^"]*)"([^>]*)>/gi;
  while ((m = courseRe.exec(html))) {
    const [, slug, dishes, price, glyph, rest] = m;
    const c = (result.courses[slug] ||= { slug });
    c.dishes = +dishes; c.price = price; c.glyph = glyph;
    c.unitEn = (rest.match(/data-unit-en="([^"]*)"/) || [])[1] || 'DISHES';
    c.unitTh = (rest.match(/data-unit-th="([^"]*)"/) || [])[1] || '';

    const photos = (rest.match(/data-photos="([^"]*)"/) || [])[1] || '';
    c.photoShas = photos.split('|').filter((x) => x.includes('base64,'))
      .map((x) => {
        const [, ext, b64] = x.match(/data:image\/([a-z]+);base64,(.+)$/);
        return store(b64, ext, { role: `course:${slug}` }, tag);
      });

    // body: description, dish list, labels
    const end = html.indexOf('</article>', m.index);
    const body = html.slice(m.index, end).replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, '');
    const grabText = (sel) => (body.match(new RegExp(`class="${sel}"[^>]*>([^<]*)<`)) || [])[1] || '';
    c.nameEn ||= (body.match(/class="course-name d"[^>]*>([^<]*)</) || [])[1] || '';
    c.tagEn ||= grabText('course-tag mono');
    c.descEn ||= grabText('course-desc');
    c.listLabelEn ||= grabText('course-listlabel mono');
    c.forWhoEn ||= grabText('course-for mono');
    c.dishListEn = [...body.matchAll(/<li>([^<]+)<\/li>/g)].map((x) => x[1].trim());
    const sweetHeads = [...body.matchAll(/class="sweet-h mono"[^>]*>([^<]*)</g)].map((x) => x[1]);
    if (sweetHeads.length) c.sweetMenus = sweetHeads;
  }

  // ── const COURSES = [...] (v2) — Thai names and tags ─────────────────────
  const ci = html.indexOf('const COURSES');
  if (ci > -1) {
    const block = html.slice(ci, html.indexOf('];', ci));
    const entryRe = /\{\s*id:'([a-z]+)',\s*n:(\d+),\s*price:'([^']*)',[\s\S]*?name:\{en:'([^']*)',\s*th:'([^']*)'\},[\s\S]*?tag:\{en:'([^']*)',\s*th:'([^']*)'\},[\s\S]*?photos:\[([^\]]*)\][\s\S]*?alt:\{en:'([^']*)',\s*\n?\s*th:'([^']*)'\}/g;
    let e;
    while ((e = entryRe.exec(block))) {
      const [, id, n, price, nameEn, nameTh, tagEn, tagTh, photos, altEn, altTh] = e;
      const c = (result.courses[id] ||= { slug: id });
      c.dishes ||= +n; c.price ||= `฿${price}++`;
      c.nameEn ||= nameEn; c.nameTh = nameTh;
      if (tagEn) c.tagEnAlt = tagEn;
      if (tagTh) c.tagTh = tagTh;
      const shas = [...photos.matchAll(/data:image\/([a-z]+);base64,([A-Za-z0-9+/=]+)/g)]
        .map((x) => store(x[2], x[1], { altEn, altTh, role: `course:${id}` }, tag));
      c.photoShas = [...new Set([...(c.photoShas || []), ...shas])];
    }
  }

  // ── const GALLERY = [...] (v2) — bilingual captions ──────────────────────
  const gi = html.indexOf('const GALLERY');
  if (gi > -1) {
    const block = html.slice(gi, html.indexOf('];', gi));
    const gRe = /\{\s*src:'data:image\/([a-z]+);base64,([A-Za-z0-9+/=]+)',\s*\n?\s*en:'([^']*)',\s*th:'([^']*)'/g;
    let g;
    while ((g = gRe.exec(block))) {
      const sha = store(g[2], g[1], { altEn: g[3], altTh: g[4], role: 'gallery' }, tag);
      result.gallery.push({ sha, en: g[3], th: g[4] });
    }
  }
}

const catalogue = [...bySha.values()].sort((a, b) => b.bytes - a.bytes);
fs.writeFileSync(path.join(OUT, 'catalogue.json'), JSON.stringify({ ...result, images: catalogue }, null, 1));

console.log(`${catalogue.length} unique photographs`);
console.log(`gallery captions: ${result.gallery.length}`);
console.log('\ncourses:');
for (const c of Object.values(result.courses)) {
  console.log(`  ${c.glyph || ' '} ${(c.nameEn || c.slug).padEnd(10)} ${String(c.dishes).padStart(2)} ${(c.price || '').padEnd(10)} th="${c.nameTh || ''}" photos=${(c.photoShas || []).length} dishes=${(c.dishListEn || []).length}`);
}
console.log(`\nwith captions: ${catalogue.filter((c) => c.altEn).length} / ${catalogue.length}`);
