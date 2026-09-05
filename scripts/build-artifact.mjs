/**
 * Build the single-file artifact.
 *
 * Everything — menu, prices, Thai copy, photographs, the logo — is read from
 * the same files the live site uses, so the artifact cannot drift from it.
 * Images are the optimised set from optimise-for-artifact.mjs, inlined as data
 * URIs, because an artifact is one HTML file with nothing beside it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { courses, photos, dict, restaurant, alaCarte } from './read-content.mjs';

const PHOTO_DIR = '/tmp/artifact-photos';
const OUT = process.argv[2] || '/tmp/suan-zen-artifact.html';

/* ── images ─────────────────────────────────────────────────────────────────
   Each photograph is written into the file exactly once and referenced by a
   short id. The gallery track is rendered twice for its seamless loop, and
   several dish photographs repeat across courses — inlining the base64 at
   every use turned 37 pictures into 110 copies and tripled the file. */
const blobs = new Map();   // id -> data URI
const idFor = new Map();   // web path -> id

function photoId(webPath) {
  if (!webPath) return '';
  if (idFor.has(webPath)) return idFor.get(webPath);
  const file = path.join(PHOTO_DIR, webPath.split('/').pop());
  if (!fs.existsSync(file)) return '';
  const id = 'p' + blobs.size.toString(36);
  blobs.set(id, 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64'));
  idFor.set(webPath, id);
  return id;
}

/** Inline the bytes directly — only for what must paint before scripts run. */
function dataUri(webPath) {
  const id = photoId(webPath);
  return id ? blobs.get(id) : '';
}
const logoUri =
  'data:image/jpeg;base64,' +
  fs.readFileSync('public/brand/logo-512.jpg').toString('base64');

/* ── helpers ───────────────────────────────────────────────────────────────── */
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Bilingual text: renders English, carries Thai for the toggle. */
const t = (en, th) => `data-en="${esc(en)}" data-th="${esc(th || en)}"`;
const bt = (en, th) => `<span ${t(en, th)}>${esc(en)}</span>`;

const en = dict.en, th = dict.th;
const baht = (n) => '฿' + n.toLocaleString('en-US');

const pick = (list) => list.filter(Boolean);
const byFile = Object.fromEntries(photos.map((p) => [p.file, p]));

/* ── slot picking, mirroring src/lib/slots.ts ──────────────────────────────── */
const taken = new Set();
function take(opts) {
  const pool = photos
    .filter((p) => !taken.has(p.file))
    .filter((p) => (opts.cat ? opts.cat.includes(p.category) : true))
    .filter((p) => (opts.people === undefined ? true : p.hasPeople === opts.people))
    .filter((p) => (opts.minWarmth ? p.warmth >= opts.minWarmth : true))
    .sort((a, b) =>
      opts.warm ? b.warmth * 10 + b.quality - (a.warmth * 10 + a.quality)
                : b.quality * 10 + b.warmth - (a.quality * 10 + a.warmth));
  const c = pool[0];
  if (c) taken.add(c.file);
  return c;
}
const takeAny = (...wants) => {
  for (const w of wants) { const p = take(w); if (p) return p; }
  return photos.find((p) => !taken.has(p.file));
};

const hero = takeAny({ cat: ['interior'], people: true, minWarmth: 6 },
                     { cat: ['chef', 'people'], minWarmth: 7 }, { cat: ['interior'] });
const garden = pick([
  takeAny({ cat: ['signage'] }, { cat: ['exterior'] }),
  takeAny({ cat: ['exterior'] }, { cat: ['interior'] }),
  takeAny({ cat: ['interior'] }, { cat: ['food'] }),
]);
const counter = takeAny({ cat: ['chef'], people: true }, { cat: ['chef'] }, { cat: ['interior'] });
const afterDark = takeAny({ cat: ['people'], minWarmth: 6 }, { cat: ['interior'] }, { cat: ['food'] });
const warmth = photos
  .filter((p) => p.hasPeople || p.warmth >= 7)
  .sort((a, b) => b.warmth * b.quality - a.warmth * a.quality)
  .slice(0, 12);
/* The gallery carries the rest of the catalogue. It is sequenced rather than
   dumped — food, room, hand, guest, garden, food — and then keeps going
   through whatever is left, so the whole collection is on the page. */
const SEQUENCE = [
  { cat: ['food'] }, { cat: ['interior'] }, { cat: ['chef'] },
  { cat: ['people'], warm: true }, { cat: ['exterior'] }, { cat: ['food'] },
  { cat: ['signage'] }, { cat: ['food'] }, { cat: ['chef'] },
  { cat: ['people'], warm: true }, { cat: ['food'] }, { cat: ['interior'] },
];
const gallery = pick(SEQUENCE.map((want) => takeAny(want, { cat: ['food'] }, {})));
// Everything still unspoken for, alternating so food and faces stay mixed.
const leftovers = photos.filter((p) => !taken.has(p.file));
const faces = leftovers.filter((p) => p.hasPeople);
const plates = leftovers.filter((p) => !p.hasPeople);
while (faces.length || plates.length) {
  if (plates.length) gallery.push(plates.shift());
  if (plates.length) gallery.push(plates.shift());
  if (faces.length) gallery.push(faces.shift());
}

/* ── image element ─────────────────────────────────────────────────────────── */
const img = (photo, cls, opts = {}) => {
  if (!photo) return '';
  const attrs = opts.decorative
    ? 'alt="" aria-hidden="true"'
    : `alt="${esc(photo.altEn)}" data-alt-en="${esc(photo.altEn)}" data-alt-th="${esc(photo.altTh)}"`;
  // The hero must be on screen before any script runs, so it carries its bytes.
  const src = opts.eager
    ? `src="${dataUri(photo.file)}"`
    : `data-p="${photoId(photo.file)}"`;
  return `<img class="${cls}" ${src} ${attrs} loading="${opts.eager ? 'eager' : 'lazy'}" decoding="async">`;
};

/* ── courses ───────────────────────────────────────────────────────────────── */
const dishRow = (d, n) => {
  const uri = d.photo ? photoId(d.photo) : '';
  return `<li class="dish${uri ? ' has-photo' : ''}"${uri ? ` data-shot="${uri}"` : ''} data-name-en="${esc(d.nameEn)}" data-name-th="${esc(d.nameTh || d.nameEn)}">
  <button class="dish__btn" type="button">
    <span class="dish__n">${String(n).padStart(2, '0')}</span>
    <span class="dish__name" ${t(d.nameEn, d.nameTh || d.nameEn)}>${esc(d.nameEn)}</span>
    ${uri ? '<span class="dish__dot" aria-hidden="true"></span>' : ''}
  </button>
</li>`;
};

const courseBlock = (c, i) => {
  const groups = c.menus
    ? c.menus.map((m) => ({ label: [m.labelEn, m.labelTh], dishes: m.dishes }))
    : [{ label: null, dishes: c.dishes || [] }];
  let n = 0;
  const lists = groups.map((g) => `
    ${g.label ? `<p class="course__grouph" ${t(g.label[0], g.label[1])}>${esc(g.label[0])}</p>` : ''}
    <ol class="dishes">${g.dishes.map((d) => dishRow(d, ++n)).join('')}</ol>`).join('');

  const stage = c.photos && c.photos.length ? photoId(c.photos[0]) : '';

  return `<li class="course${i === 0 ? ' is-open' : ''}" data-stage="${stage}" data-name-en="${esc(c.nameEn)}" data-name-th="${esc(c.nameTh)}">
  <h3 class="course__h">
    <button class="course__btn" type="button" aria-expanded="${i === 0}">
      <span class="course__idx">${c.index}</span>
      <span class="course__kanji" aria-hidden="true">${c.kanji}</span>
      <span class="course__name" ${t(c.nameEn, c.nameTh)}>${esc(c.nameEn)}</span>
      <span class="course__meta">
        <span class="course__count" ${t(`${c.count} ${c.unitEn}`, `${c.count} ${c.unitTh}`)}>${c.count} ${esc(c.unitEn)}</span>
        <span class="course__price">${baht(c.price)}<i>++</i></span>
      </span>
      <svg class="cx" width="13" height="8" viewBox="0 0 13 8" fill="none" aria-hidden="true"><path d="M1 1l5.5 5.5L12 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </h3>
  <div class="course__panel">
    <div class="course__inner">
      <p class="course__desc" ${t(c.descEn, c.descTh)}>${esc(c.descEn)}</p>
      <p class="course__for" ${t(c.forEn, c.forTh)}>${esc(c.forEn)}</p>
      <div class="course__listhead">
        <span class="u-label" ${t(c.listLabelEn, c.listLabelTh)}>${esc(c.listLabelEn)}</span>
        ${c.listIsPartial ? `<span class="course__partial" ${t(en.coursesSection.partialNote, th.coursesSection.partialNote)}>${esc(en.coursesSection.partialNote)}</span>` : ''}
      </div>
      ${lists}
      <div class="course__acts">
        <a class="btn" href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener" ${t(en.cta.reserve, th.cta.reserve)}>${esc(en.cta.reserve)}</a>
        <span class="course__total" ${t(`${c.count} ${c.unitEn}`, `${c.count} ${c.unitTh}`)}>${c.count} ${esc(c.unitEn)}</span>
      </div>
    </div>
  </div>
</li>`;
};

/* ── the page ──────────────────────────────────────────────────────────────── */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxGeM_cfinzTauq7smWdOY-ruVhn_Ao3GVAfFOLOcws4D1fQHoyfjrH56JDLsmwG2Wthg/exec';
const PUBLIC_KEY = fs.readFileSync(path.join('scripts', '.public-key'), 'utf8').trim();

/* The next 30 days, minus anything the restaurant is closed. */
const today = new Date();
const days = [];
for (let i = 1; i <= 30; i++) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
  days.push(d.toISOString().slice(0, 10));
}

const seatings = restaurant.seatings;

const html = `<title>Suan Zen Omakase</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500&family=Noto+Serif+Thai:wght@400;500&family=IBM+Plex+Sans+Thai:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
${fs.readFileSync(path.join('scripts', 'artifact.css'), 'utf8')}
</style>

<a class="skip" href="#main" ${t(en.a11y.skip, th.a11y.skip)}>${esc(en.a11y.skip)}</a>

<header class="hdr" id="hdr">
  <div class="hdr__in">
    <a class="hdr__brand" href="#top" aria-label="Suan Zen Omakase">
      <span class="mark"><img src="${logoUri}" alt="" aria-hidden="true"></span>
      <span class="wordmark"><span>Suan</span><span class="gold">Zen</span></span>
    </a>
    <nav class="hdr__nav" aria-label="Primary">
      <a href="#courses" ${t(en.nav.courses, th.nav.courses)}>${esc(en.nav.courses)}</a>
      <a href="#garden" ${t(en.nav.garden, th.nav.garden)}>${esc(en.nav.garden)}</a>
      <a href="#counter" ${t(en.nav.counter, th.nav.counter)}>${esc(en.nav.counter)}</a>
      <a href="#room" ${t(en.warmth.label, th.warmth.label)}>${esc(en.warmth.label)}</a>
      <a href="#gallery" ${t(en.nav.gallery, th.nav.gallery)}>${esc(en.nav.gallery)}</a>
      <a href="#visit" ${t(en.nav.visit, th.nav.visit)}>${esc(en.nav.visit)}</a>
    </nav>
    <div class="hdr__end">
      <button class="lang" id="lang" type="button" aria-label="เปลี่ยนเป็นภาษาไทย">ไทย</button>
      <a class="btn hdr__cta" href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener" ${t(en.nav.book, th.nav.book)}>${esc(en.nav.book)}</a>
      <button class="burger" id="burger" type="button" aria-expanded="false" aria-label="${esc(en.a11y.openMenu)}"><span></span><span></span></button>
    </div>
  </div>
</header>

<div class="sheet" id="sheet" aria-hidden="true">
  <nav class="sheet__nav" aria-label="Menu">
    <a href="#courses"><i>01</i><span ${t(en.nav.courses, th.nav.courses)}>${esc(en.nav.courses)}</span></a>
    <a href="#garden"><i>02</i><span ${t(en.nav.garden, th.nav.garden)}>${esc(en.nav.garden)}</span></a>
    <a href="#counter"><i>03</i><span ${t(en.nav.counter, th.nav.counter)}>${esc(en.nav.counter)}</span></a>
    <a href="#room"><i>04</i><span ${t(en.warmth.label, th.warmth.label)}>${esc(en.warmth.label)}</span></a>
    <a href="#gallery"><i>05</i><span ${t(en.nav.gallery, th.nav.gallery)}>${esc(en.nav.gallery)}</span></a>
    <a href="#visit"><i>06</i><span ${t(en.nav.visit, th.nav.visit)}>${esc(en.nav.visit)}</span></a>
  </nav>
  <a class="btn" href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener" ${t(en.cta.reserveLine, th.cta.reserveLine)}>${esc(en.cta.reserveLine)}</a>
</div>

<main id="main">

<section class="hero" id="top" data-world="night">
  <div class="hero__media">${img(hero, 'hero__img', { eager: true })}<div class="hero__scrim"></div></div>
  <div class="shell hero__in">
    <p class="hero__place u-label" ${t(en.hero.place, th.hero.place)}>${esc(en.hero.place)}</p>
    <h1 class="hero__h display">
      <span class="l"><span ${t(en.hero.headline[0], th.hero.headline[0])}>${esc(en.hero.headline[0])}</span></span>
      <span class="l"><span ${t(en.hero.headline[1], th.hero.headline[1])}>${esc(en.hero.headline[1])}</span></span>
    </h1>
    <p class="hero__brandline">
      <span ${t(en.hero.brand, th.hero.brand)}>${esc(en.hero.brand)}</span>
      <span class="hero__sep" aria-hidden="true"></span>
      <span ${t(en.hero.category, th.hero.category)}>${esc(en.hero.category)}</span>
    </p>
    <p class="hero__stand u-lede" ${t(en.hero.standfirst, th.hero.standfirst)}>${esc(en.hero.standfirst)}</p>
    <div class="hero__acts">
      <a class="btn" href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener" ${t(en.cta.reserve, th.cta.reserve)}>${esc(en.cta.reserve)}</a>
      <a class="btn btn--ghost" href="#courses" ${t(en.cta.viewCourses, th.cta.viewCourses)}>${esc(en.cta.viewCourses)}</a>
    </div>
    <div class="hero__foot">
      <span class="u-label" ${t(en.hero.scroll, th.hero.scroll)}>${esc(en.hero.scroll)}</span>
      <span class="hero__hours" ${t(`${en.visit.everyday} · ${restaurant.hours.everyday}`, `${th.visit.everyday} · ${restaurant.hours.everyday}`)}>${esc(en.visit.everyday)} · ${esc(restaurant.hours.everyday)}</span>
    </div>
  </div>
</section>

<section class="section prop" data-world="night">
  <div class="shell">
    <span class="u-label" ${t(en.proposition.label, th.proposition.label)}>${esc(en.proposition.label)}</span>
    <h2 class="display display--section" ${t(en.proposition.heading, th.proposition.heading)}>${esc(en.proposition.heading)}</h2>
    <p class="u-lede" ${t(en.proposition.body, th.proposition.body)}>${esc(en.proposition.body)}</p>
    <p class="prop__aside" ${t(en.proposition.aside, th.proposition.aside)}>${esc(en.proposition.aside)}</p>
  </div>
</section>

<section class="section garden" id="garden" data-world="night">
  <div class="shell">
    <header class="secthead">
      <span class="u-label" ${t(en.garden.label, th.garden.label)}>${esc(en.garden.label)}</span>
      <h2 class="display display--section" ${t(en.garden.heading, th.garden.heading)}>${esc(en.garden.heading)}</h2>
    </header>
    <div class="garden__grid">
      <figure class="garden__a">${img(garden[0], 'ph')}</figure>
      <div class="garden__copy"><p class="u-lede" ${t(en.garden.body, th.garden.body)}>${esc(en.garden.body)}</p></div>
      <figure class="garden__b">${img(garden[1], 'ph')}</figure>
      <figure class="garden__c">${img(garden[2], 'ph')}</figure>
    </div>
  </div>
</section>

<section class="section counter" id="counter" data-world="day">
  <div class="shell counter__grid">
    <div class="counter__media">${img(counter, 'ph')}</div>
    <div class="counter__text">
      <span class="u-label" ${t(en.counter.label, th.counter.label)}>${esc(en.counter.label)}</span>
      <h2 class="display display--section" ${t(en.counter.heading, th.counter.heading)}>${esc(en.counter.heading)}</h2>
      <p class="u-lede" ${t(en.counter.body, th.counter.body)}>${esc(en.counter.body)}</p>
      <dl class="facts">
        ${en.counter.points.map((p, i) => `<div><dt class="u-label" ${t(p.k, th.counter.points[i].k)}>${esc(p.k)}</dt><dd ${t(p.v, th.counter.points[i].v)}>${esc(p.v)}</dd></div>`).join('')}
      </dl>
    </div>
  </div>
</section>

<section class="section courses-sec" id="courses" data-world="day">
  <div class="shell">
    <header class="secthead secthead--wide">
      <span class="u-label" ${t(en.coursesSection.label, th.coursesSection.label)}>${esc(en.coursesSection.label)}</span>
      <h2 class="display display--section" ${t(en.coursesSection.heading, th.coursesSection.heading)}>${esc(en.coursesSection.heading)}</h2>
      <p class="u-lede" ${t(en.coursesSection.body, th.coursesSection.body)}>${esc(en.coursesSection.body)}</p>
    </header>
    <div class="menu">
      <ul class="menu__list">${courses.map(courseBlock).join('')}</ul>
      <aside class="menu__stage" aria-hidden="true">
        <div class="menu__frame"><img id="stageImg" src="" alt=""></div>
        <p class="menu__caption" id="stageCap"></p>
      </aside>
      <p class="menu__foot" ${t(en.coursesSection.footnote, th.coursesSection.footnote)}>${esc(en.coursesSection.footnote)}</p>
    </div>
  </div>
</section>

<section class="section ala" id="alacarte" data-world="night">
  <div class="shell">
    <header class="secthead secthead--wide">
      <span class="u-label" ${t(en.ala.label, th.ala.label)}>${esc(en.ala.label)}</span>
      <h2 class="display display--section" ${t(en.ala.heading, th.ala.heading)}>${esc(en.ala.heading)}</h2>
      <p class="u-lede" ${t(en.ala.body, th.ala.body)}>${esc(en.ala.body)}</p>
    </header>
    <div class="ala__pending">
      <p class="ala__text" ${t(en.ala.pending, th.ala.pending)}>${esc(en.ala.pending)}</p>
      <dl class="ala__when">
        <dt class="u-label" ${t(en.ala.served, th.ala.served)}>${esc(en.ala.served)}</dt>
        <dd ${t(alaCarte.servedEn, alaCarte.servedTh)}>${esc(alaCarte.servedEn)}</dd>
      </dl>
      <a class="btn" href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener" ${t(en.ala.askOnLine, th.ala.askOnLine)}>${esc(en.ala.askOnLine)}</a>
    </div>
  </div>
</section>

<section class="section warmsec" id="room" data-world="night">
  <div class="shell">
    <header class="secthead secthead--wide">
      <span class="u-label" ${t(en.warmth.label, th.warmth.label)}>${esc(en.warmth.label)}</span>
      <h2 class="display display--section" ${t(en.warmth.heading, th.warmth.heading)}>${esc(en.warmth.heading)}</h2>
      <p class="u-lede" ${t(en.warmth.body, th.warmth.body)}>${esc(en.warmth.body)}</p>
    </header>
  </div>
  <div class="rail rail--warm" data-drift="0">
    <ul class="rail__track">
      ${warmth.map((p) => `<li class="rail__item rail__item--${p.orientation}"><button class="rail__btn" type="button" data-full="${photoId(p.file)}" data-cap-en="${esc(p.altEn)}" data-cap-th="${esc(p.altTh)}">${img(p, 'ph')}</button></li>`).join('')}
    </ul>
  </div>
</section>

<section class="section dark" id="afterdark" data-world="night">
  <div class="dark__bg">${img(afterDark, 'ph', { decorative: true })}</div>
  <div class="shell dark__in">
    <span class="u-label" ${t(en.afterDark.label, th.afterDark.label)}>${esc(en.afterDark.label)}</span>
    <h2 class="display display--section" ${t(en.afterDark.heading, th.afterDark.heading)}>${esc(en.afterDark.heading)}</h2>
    <p class="u-lede" ${t(en.afterDark.body, th.afterDark.body)}>${esc(en.afterDark.body)}</p>
    <p class="dark__hours">
      <span class="u-label" ${t(en.afterDark.hoursLabel, th.afterDark.hoursLabel)}>${esc(en.afterDark.hoursLabel)}</span>
      <span class="dark__time" ${t(`${restaurant.izakaya.days} · ${restaurant.izakaya.hours}`, `${restaurant.izakaya.daysTh} · ${restaurant.izakaya.hours}`)}>${esc(restaurant.izakaya.days)} · ${esc(restaurant.izakaya.hours)}</span>
    </p>
  </div>
</section>

<section class="section gal" id="gallery" data-world="night">
  <div class="shell">
    <header class="secthead">
      <span class="u-label" ${t(en.gallery.label, th.gallery.label)}>${esc(en.gallery.label)}</span>
      <h2 class="display display--section" ${t(en.gallery.heading, th.gallery.heading)}>${esc(en.gallery.heading)}</h2>
    </header>
  </div>
  <div class="rail rail--gal" id="galRail" data-drift="1">
    <ul class="rail__track">
      ${[...gallery, ...gallery].map((p, i) => `<li class="rail__item rail__item--${p.orientation}"${i >= gallery.length ? ' aria-hidden="true"' : ''}><button class="rail__btn" type="button" data-full="${photoId(p.file)}" data-cap-en="${esc(p.altEn)}" data-cap-th="${esc(p.altTh)}">${img(p, 'ph')}</button></li>`).join('')}
    </ul>
  </div>
</section>

<section class="section visit" id="visit" data-world="night">
  <div class="shell">
    <header class="secthead">
      <span class="u-label" ${t(en.visit.label, th.visit.label)}>${esc(en.visit.label)}</span>
      <h2 class="display display--section" ${t(en.visit.heading, th.visit.heading)}>${esc(en.visit.heading)}</h2>
    </header>
    <div class="visit__grid">
      <dl class="facts facts--stack">
        <div><dt class="u-label" ${t(en.visit.addressLabel, th.visit.addressLabel)}>${esc(en.visit.addressLabel)}</dt>
             <dd ${t(restaurant.address.oneLineEn, restaurant.address.oneLineTh)}>${esc(restaurant.address.oneLineEn)}</dd></div>
        <div><dt class="u-label" ${t(en.visit.hoursLabel, th.visit.hoursLabel)}>${esc(en.visit.hoursLabel)}</dt>
             <dd><span ${t(`${en.visit.everyday} · ${restaurant.hours.everyday}`, `${th.visit.everyday} · ${restaurant.hours.everyday}`)}>${esc(en.visit.everyday)} · ${esc(restaurant.hours.everyday)}</span><br>
                 <span class="gold" ${t(`${en.visit.lateNights} · ${restaurant.hours.lateNights}`, `${th.visit.lateNights} · ${restaurant.hours.lateNights}`)}>${esc(en.visit.lateNights)} · ${esc(restaurant.hours.lateNights)}</span></dd></div>
        <div><dt class="u-label" ${t(en.visit.seatingsLabel, th.visit.seatingsLabel)}>${esc(en.visit.seatingsLabel)}</dt>
             <dd>${restaurant.seatings.join('  ·  ')}</dd></div>
        <div><dt class="u-label" ${t(en.visit.parkingLabel, th.visit.parkingLabel)}>${esc(en.visit.parkingLabel)}</dt>
             <dd ${t(en.visit.parkingValue, th.visit.parkingValue)}>${esc(en.visit.parkingValue)}</dd></div>
        <div><dt class="u-label" ${t(en.visit.contactLabel, th.visit.contactLabel)}>${esc(en.visit.contactLabel)}</dt>
             <dd><a href="tel:${restaurant.contact.phoneIntl}">${esc(restaurant.contact.phone)}</a><br>
                 <a href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener">LINE ${esc(restaurant.contact.lineDisplayId)}</a></dd></div>
      </dl>
      <a class="visit__map" href="${restaurant.maps.directions}" target="_blank" rel="noopener" aria-label="${esc(en.visit.mapAria)}">
        <svg viewBox="0 0 800 560" aria-hidden="true">
          <defs><radialGradient id="pg" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="#eeca0e" stop-opacity="0.5"/><stop offset="100%" stop-color="#eeca0e" stop-opacity="0"/></radialGradient></defs>
          <rect width="800" height="560" fill="#0f1926"/>
          <path d="M118 -20 C150 120 96 200 130 300 C160 392 118 470 150 580" stroke="#1b2a3d" stroke-width="46" fill="none"/>
          <g stroke="#2b3f56" stroke-width="1.5" opacity="0.62"><path d="M0 176h800M0 300h800M0 424h800M280 0v560M470 0v560M640 0v560"/></g>
          <g stroke="#3a5372" stroke-width="3" opacity="0.75"><path d="M180 300h620M470 0v560"/></g>
          <path d="M470 300 L470 236 L556 236" stroke="#aa6d15" stroke-width="3.4" fill="none"/>
          <circle cx="556" cy="236" r="62" fill="url(#pg)"/><circle cx="556" cy="236" r="7.5" fill="#eeca0e"/>
          <circle cx="556" cy="236" r="17" fill="none" stroke="#eeca0e" stroke-width="1.2" opacity="0.65"/>
        </svg>
        <span class="visit__pin"><span>${restaurant.geo.lat.toFixed(4)}, ${restaurant.geo.lng.toFixed(4)}</span><span class="gold" ${t(en.visit.mapHint, th.visit.mapHint)}>${esc(en.visit.mapHint)}</span></span>
      </a>
    </div>
  </div>
</section>

<section class="section resv" id="book" data-world="night">
  <div class="shell">
    <header class="secthead secthead--wide">
      <span class="u-label" ${t(en.reserve.label, th.reserve.label)}>${esc(en.reserve.label)}</span>
      <h2 class="display display--section" ${t(en.booking.heading, th.booking.heading)}>${esc(en.booking.heading)}</h2>
      <p class="u-lede" ${t(en.booking.intro, th.booking.intro)}>${esc(en.booking.intro)}</p>
    </header>

    <form class="bk" id="bkForm" novalidate>
      <div class="bk__grid">
        <label class="fld">
          <span class="fld__l" ${t(en.booking.steps[0], th.booking.steps[0])}>${esc(en.booking.steps[0])}</span>
          <input type="date" name="date" required min="${days[0]}" max="${days[days.length - 1]}" value="${days[2]}">
        </label>

        <fieldset class="fld fld--wide">
          <legend class="fld__l" ${t(en.booking.seatingHeading, th.booking.seatingHeading)}>${esc(en.booking.seatingHeading)}</legend>
          <div class="seats">
            ${seatings.map((time, i) => `<label class="seat"><input type="radio" name="seating" value="${time}"${i === 3 ? ' checked' : ''}><span>${time}</span></label>`).join('')}
          </div>
        </fieldset>

        <label class="fld">
          <span class="fld__l" ${t(en.booking.steps[2], th.booking.steps[2])}>${esc(en.booking.steps[2])}</span>
          <select name="course">
            ${courses.map((c) => `<option value="${esc(c.nameEn)}" data-en="${esc(`${c.nameEn} — ${c.count} ${c.unitEn} — ${baht(c.price)}++`)}" data-th="${esc(`${c.nameTh} — ${c.count} ${c.unitTh} — ${baht(c.price)}++`)}">${esc(c.nameEn)} — ${c.count} ${esc(c.unitEn)} — ${baht(c.price)}++</option>`).join('')}
            <option value="undecided" ${t(en.booking.undecided, th.booking.undecided)}>${esc(en.booking.undecided)}</option>
          </select>
        </label>

        <label class="fld">
          <span class="fld__l" ${t(en.booking.partyHeading, th.booking.partyHeading)}>${esc(en.booking.partyHeading)}</span>
          <select name="party">
            ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}"${n === 2 ? ' selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>

        <label class="fld">
          <span class="fld__l">${esc(en.booking.name)} <i class="req" ${t(en.booking.required, th.booking.required)}>${esc(en.booking.required)}</i></span>
          <input type="text" name="name" required autocomplete="name">
        </label>

        <label class="fld">
          <span class="fld__l">${esc(en.booking.phone)} <i class="req" ${t(en.booking.required, th.booking.required)}>${esc(en.booking.required)}</i></span>
          <input type="tel" name="phone" required inputmode="tel" autocomplete="tel" placeholder="08X XXX XXXX">
        </label>

        <label class="fld">
          <span class="fld__l">${esc(en.booking.lineId)} <i class="opt" ${t(en.booking.optional, th.booking.optional)}>${esc(en.booking.optional)}</i></span>
          <input type="text" name="lineId">
        </label>

        <label class="fld fld--wide">
          <span class="fld__l" ${t(en.booking.notes, th.booking.notes)}>${esc(en.booking.notes)}</span>
          <textarea name="notes" rows="3"></textarea>
          <span class="fld__hint" ${t(en.booking.notesHint, th.booking.notesHint)}>${esc(en.booking.notesHint)}</span>
        </label>

        <!-- Left empty by people; filled in by bots. -->
        <div class="hp" aria-hidden="true"><label>Company<input type="text" name="company" tabindex="-1" autocomplete="off"></label></div>
      </div>

      <p class="bk__pending" ${t(en.booking.notConfirmed, th.booking.notConfirmed)}>${esc(en.booking.notConfirmed)}</p>
      <p class="bk__err" id="bkErr" hidden role="alert"></p>

      <div class="bk__acts">
        <button class="btn" type="submit" id="bkSend" ${t(en.booking.submit, th.booking.submit)}>${esc(en.booking.submit)}</button>
        <a class="link" href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener" ${t(en.cta.reserveLine, th.cta.reserveLine)}>${esc(en.cta.reserveLine)}</a>
        <a class="link" href="tel:${restaurant.contact.phoneIntl}">${esc(restaurant.contact.phone)}</a>
      </div>
    </form>

    <div class="bk__done" id="bkDone" hidden>
      <h3 class="display display--course" ${t(en.booking.doneHeading, th.booking.doneHeading)} tabindex="-1">${esc(en.booking.doneHeading)}</h3>
      <p class="bk__ref"><span class="u-label" ${t(en.booking.reference, th.booking.reference)}>${esc(en.booking.reference)}</span><span class="bk__refcode" id="bkRef"></span></p>
      <p class="bk__pending" ${t(en.booking.notConfirmed, th.booking.notConfirmed)}>${esc(en.booking.notConfirmed)}</p>
      <p class="u-lede" ${t(en.booking.doneBody, th.booking.doneBody)}>${esc(en.booking.doneBody)}</p>
      <div class="bk__acts">
        <a class="btn" href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener" ${t(en.booking.doneLine, th.booking.doneLine)}>${esc(en.booking.doneLine)}</a>
        <button class="link" type="button" id="bkAgain" ${t(en.booking.doneAgain, th.booking.doneAgain)}>${esc(en.booking.doneAgain)}</button>
      </div>
    </div>
  </div>
</section>
</main>

<footer class="foot" data-world="night">
  <div class="shell foot__in">
    <div class="foot__brand">
      <span class="mark mark--lg"><img src="${logoUri}" alt="" aria-hidden="true"></span>
      <p class="foot__name">Suan Zen Omakase</p>
      <p class="foot__tag" ${t(en.footer.tagline, th.footer.tagline)}>${esc(en.footer.tagline)}</p>
    </div>
    <div class="foot__col">
      <span class="u-label" ${t(en.visit.addressLabel, th.visit.addressLabel)}>${esc(en.visit.addressLabel)}</span>
      <address ${t(restaurant.address.oneLineEn, restaurant.address.oneLineTh)}>${esc(restaurant.address.oneLineEn)}</address>
      <a href="${restaurant.maps.directions}" target="_blank" rel="noopener" ${t(en.cta.directions, th.cta.directions)}>${esc(en.cta.directions)}</a>
    </div>
    <div class="foot__col">
      <span class="u-label" ${t(en.visit.contactLabel, th.visit.contactLabel)}>${esc(en.visit.contactLabel)}</span>
      <a href="tel:${restaurant.contact.phoneIntl}">${esc(restaurant.contact.phone)}</a>
      <a href="${restaurant.contact.lineUrl}" target="_blank" rel="noopener">LINE ${esc(restaurant.contact.lineDisplayId)}</a>
    </div>
    <div class="foot__col">
      <span class="u-label" ${t(en.footer.followUs, th.footer.followUs)}>${esc(en.footer.followUs)}</span>
      <a href="${restaurant.social.instagram}" target="_blank" rel="noopener">Instagram</a>
      <a href="${restaurant.social.facebook}" target="_blank" rel="noopener">Facebook</a>
      <a href="${restaurant.social.tiktok}" target="_blank" rel="noopener">TikTok</a>
    </div>
  </div>
  <div class="shell foot__base">
    <p>© ${new Date().getFullYear()} Suan Zen Omakase</p>
    <a href="#top" ${t(en.a11y.toTop, th.a11y.toTop)}>${esc(en.a11y.toTop)}</a>
  </div>
</footer>

<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Photograph">
  <button class="lb__scrim" id="lbScrim" type="button" tabindex="-1" aria-hidden="true"></button>
  <div class="lb__stage"><img id="lbImg" src="" alt=""></div>
  <div class="lb__bar">
    <button class="lb__ctl" id="lbClose" type="button" aria-label="${esc(en.gallery.close)}">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    </button>
    <p class="lb__cap" id="lbCap"></p>
    <div class="lb__nav">
      <button class="lb__ctl" id="lbPrev" type="button" aria-label="${esc(en.gallery.prev)}"><svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true"><path d="M6 1L1 6l5 5M1 6h19" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <span class="lb__n" id="lbN"></span>
      <button class="lb__ctl" id="lbNext" type="button" aria-label="${esc(en.gallery.next)}"><svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true"><path d="M14 1l5 5-5 5M19 6H0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
  </div>
</div>

<script>
/* Every photograph, once. Elements carry data-p / data-shot / data-full ids. */
window.SZ_P = ${JSON.stringify(Object.fromEntries(blobs))};
window.SZ_SHEET = ${JSON.stringify(SHEET_URL)};
/* Public by design: it travels inside this page. The rate limit in the Apps
   Script is what actually guards the sheet. */
window.SZ_KEY = ${JSON.stringify(PUBLIC_KEY)};
</script>
<script>
${fs.readFileSync(path.join('scripts', 'artifact.js'), 'utf8')}
</script>
`;

fs.writeFileSync(OUT, html);
const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
console.log(`wrote ${OUT}`);
console.log(`  ${mb} MB   ${mb < 15.5 ? '✓ under the 16MB artifact limit' : '✗ TOO BIG'}`);
console.log(`  ${blobs.size} photographs inlined once each`);
console.log(`  ${courses.length} courses, ${courses.reduce((a, c) => a + (c.dishes || c.menus.flatMap((g) => g.dishes)).length, 0)} dishes`);
