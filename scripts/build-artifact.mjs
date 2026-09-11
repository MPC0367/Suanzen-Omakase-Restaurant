/**
 * The menu page as one self-contained HTML file, for publishing as an Artifact.
 *
 * An artifact cannot load a Next.js app's code in pieces, so this renders the
 * same page by hand from the same content files: the menu first, à la carte,
 * and the Visit block — the link Suan Zen sends in its LINE OA. Photographs are
 * inlined once each. Google Maps cannot be embedded in an artifact, so the
 * Visit block draws its own map and links out to Google for directions.
 *
 *   node scripts/optimise-for-artifact.mjs && node scripts/build-artifact.mjs [out.html]
 */
import fs from 'node:fs';
import path from 'node:path';
import { courses, dict, restaurant, alaCarte } from './read-content.mjs';

const PHOTO_DIR = '/tmp/artifact-photos';
const OUT = process.argv[2] || '/tmp/suan-zen-menu.html';

/* ── images ─────────────────────────────────────────────────────────────────
   Each photograph is written into the file exactly once and referenced by a
   short id; several dish photographs repeat across courses. */
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
const logoUri =
  'data:image/jpeg;base64,' +
  fs.readFileSync('public/brand/logo-512.jpg').toString('base64');

/* ── helpers ───────────────────────────────────────────────────────────────── */
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Bilingual text: renders English, carries Thai for the toggle. */
const t = (en, th) => `data-en="${esc(en)}" data-th="${esc(th || en)}"`;

const en = dict.en, th = dict.th;
const baht = (n) => '฿' + n.toLocaleString('en-US');
const line = restaurant.contact.lineUrl;

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

  return `<li class="course${i === 0 ? ' is-open' : ''}" id="course-${i}" data-key="${i}" data-stage="${stage}" data-name-en="${esc(c.nameEn)}" data-name-th="${esc(c.nameTh)}">
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
        <a class="btn" href="${line}" target="_blank" rel="noopener" ${t(en.cta.reserveLine, th.cta.reserveLine)}>${esc(en.cta.reserveLine)}</a>
        <span class="course__total" ${t(`${c.count} ${c.unitEn}`, `${c.count} ${c.unitTh}`)}>${c.count} ${esc(c.unitEn)}</span>
      </div>
    </div>
  </div>
</li>`;
};

/* The course shortcuts: every course and its price, one tap from the top. */
const chips = courses.map((c, i) => `<button class="jump${i === 0 ? ' is-on' : ''}" type="button" data-course="${i}">
  <span class="jump__name" ${t(c.nameEn, c.nameTh)}>${esc(c.nameEn)}</span><span class="jump__price">${baht(c.price)}</span>
</button>`).join('');

/* ── the page ──────────────────────────────────────────────────────────────── */
const html = `<title>Suan Zen Menu</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500&family=Noto+Serif+Thai:wght@400;500&family=IBM+Plex+Sans+Thai:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
${fs.readFileSync(path.join('scripts', 'artifact.css'), 'utf8')}
</style>

<a class="skip" href="#main" ${t(en.a11y.skip, th.a11y.skip)}>${esc(en.a11y.skip)}</a>

<!-- The seal as the page opens. Played by CSS alone, so it lifts even if the
     script never runs; the script replays it on each change of language. -->
<div class="curtain is-up" id="curtain" aria-hidden="true">
  <span class="mark curtain__mark"><img src="${logoUri}" alt=""></span>
</div>

<header class="hdr" id="hdr">
  <div class="hdr__in">
    <a class="hdr__brand" href="#courses" aria-label="Suan Zen Omakase">
      <span class="mark"><img src="${logoUri}" alt="" aria-hidden="true"></span>
      <span class="wordmark"><span>Suan</span><span class="gold">Zen</span></span>
    </a>
    <nav class="hdr__nav" aria-label="Primary">
      <a href="#courses" ${t(en.nav.menu, th.nav.menu)}>${esc(en.nav.menu)}</a>
      <a href="#visit" ${t(en.nav.visit, th.nav.visit)}>${esc(en.nav.visit)}</a>
    </nav>
    <div class="hdr__end">
      <button class="lang" id="lang" type="button" aria-label="เปลี่ยนเป็นภาษาไทย">ไทย</button>
      <a class="btn hdr__cta" href="${line}" target="_blank" rel="noopener" ${t(en.cta.reserveLine, th.cta.reserveLine)}>${esc(en.cta.reserveLine)}</a>
      <button class="burger" id="burger" type="button" aria-expanded="false" aria-label="${esc(en.a11y.openMenu)}"><span></span><span></span></button>
    </div>
  </div>
</header>

<div class="sheet" id="sheet" aria-hidden="true">
  <nav class="sheet__nav" aria-label="${esc(en.nav.menu)}">
    <a href="#courses"><span ${t(en.nav.menu, th.nav.menu)}>${esc(en.nav.menu)}</span></a>
    <a href="#visit"><span ${t(en.nav.visit, th.nav.visit)}>${esc(en.nav.visit)}</span></a>
  </nav>
  <a class="btn" href="${line}" target="_blank" rel="noopener" ${t(en.cta.reserveLine, th.cta.reserveLine)}>${esc(en.cta.reserveLine)}</a>
  <a class="link sheet__tel" href="tel:${restaurant.contact.phoneIntl}"><span ${t(en.cta.call, th.cta.call)}>${esc(en.cta.call)}</span> · ${esc(restaurant.contact.phone)}</a>
</div>

<main id="main">

<section class="section courses-sec courses-sec--top" id="courses" data-world="day">
  <div class="shell">
    <header class="secthead secthead--wide menu-intro">
      <span class="u-label" ${t(en.coursesSection.label, th.coursesSection.label)}>${esc(en.coursesSection.label)}</span>
      <h1 class="display menu-intro__h" ${t(en.coursesSection.heading, th.coursesSection.heading)}>${esc(en.coursesSection.heading)}</h1>
      <p class="u-lede" ${t(en.coursesSection.body, th.coursesSection.body)}>${esc(en.coursesSection.body)}</p>
    </header>
    <div class="menu">
      <nav class="menu__jump" aria-label="${esc(en.coursesSection.jumpLabel)}">${chips}</nav>
      <ul class="menu__list">${courses.map(courseBlock).join('')}</ul>
      <aside class="menu__stage" aria-hidden="true">
        <div class="menu__frame"><img id="stageImg" src="" alt=""></div>
        <p class="menu__caption" id="stageCap"></p>
      </aside>
      <p class="menu__foot" ${t(en.coursesSection.footnote, th.coursesSection.footnote)}>${esc(en.coursesSection.footnote)}</p>
    </div>
  </div>
</section>

<section class="section ala" id="alacarte" data-world="day">
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
      <a class="btn" href="${line}" target="_blank" rel="noopener" ${t(en.ala.askOnLine, th.ala.askOnLine)}>${esc(en.ala.askOnLine)}</a>
    </div>
  </div>
</section>

<section class="section visit" id="visit" data-world="night">
  <div class="shell">
    <header class="secthead">
      <span class="u-label" ${t(en.visit.label, th.visit.label)}>${esc(en.visit.label)}</span>
      <h2 class="display display--section" ${t(en.visit.heading, th.visit.heading)}>${esc(en.visit.heading)}</h2>
    </header>
    <div class="visit__grid">
      <div class="visit__info">
        <dl class="facts facts--stack">
          <div><dt class="u-label" ${t(en.visit.addressLabel, th.visit.addressLabel)}>${esc(en.visit.addressLabel)}</dt>
               <dd ${t(restaurant.address.oneLineEn, restaurant.address.oneLineTh)}>${esc(restaurant.address.oneLineEn)}</dd></div>
          <div><dt class="u-label" ${t(en.visit.hoursLabel, th.visit.hoursLabel)}>${esc(en.visit.hoursLabel)}</dt>
               <dd><span ${t(`${en.visit.everyday} · ${restaurant.hours.everyday}`, `${th.visit.everyday} · ${restaurant.hours.everyday}`)}>${esc(en.visit.everyday)} · ${esc(restaurant.hours.everyday)}</span><br>
                   <span class="gold" ${t(`${en.visit.lateNights} · ${restaurant.hours.lateNights}`, `${th.visit.lateNights} · ${restaurant.hours.lateNights}`)}>${esc(en.visit.lateNights)} · ${esc(restaurant.hours.lateNights)}</span></dd></div>
          <div><dt class="u-label" ${t(en.visit.seatingsLabel, th.visit.seatingsLabel)}>${esc(en.visit.seatingsLabel)}</dt>
               <dd class="tnum">${restaurant.seatings.join('  ·  ')}</dd></div>
          <div><dt class="u-label" ${t(en.visit.parkingLabel, th.visit.parkingLabel)}>${esc(en.visit.parkingLabel)}</dt>
               <dd ${t(en.visit.parkingValue, th.visit.parkingValue)}>${esc(en.visit.parkingValue)}</dd></div>
        </dl>
        <div class="visit__acts">
          <a class="btn" href="${line}" target="_blank" rel="noopener" ${t(en.cta.reserveLine, th.cta.reserveLine)}>${esc(en.cta.reserveLine)}</a>
          <a class="link" href="tel:${restaurant.contact.phoneIntl}"><span ${t(en.cta.call, th.cta.call)}>${esc(en.cta.call)}</span> · ${esc(restaurant.contact.phone)}</a>
          <a class="link" href="${restaurant.maps.directions}" target="_blank" rel="noopener" ${t(en.cta.directions, th.cta.directions)}>${esc(en.cta.directions)}</a>
        </div>
      </div>
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
        <span class="visit__pin"><span class="tnum">${restaurant.geo.lat.toFixed(4)}, ${restaurant.geo.lng.toFixed(4)}</span><span class="gold" ${t(en.visit.mapHint, th.visit.mapHint)}>${esc(en.visit.mapHint)}</span></span>
      </a>
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
      <a href="${line}" target="_blank" rel="noopener">LINE ${esc(restaurant.contact.lineDisplayId)}</a>
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
    <a href="#courses" ${t(en.a11y.toTop, th.a11y.toTop)}>${esc(en.a11y.toTop)}</a>
  </div>
</footer>

<script>
/* Every photograph, once. Elements carry data-p / data-shot / data-stage ids. */
window.SZ_P = ${JSON.stringify(Object.fromEntries(blobs))};
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
