/**
 * The menu page as an Artifact — the real static export, packaged to run from
 * an artifact's own address, for looking at the site on a phone before it is
 * pushed. It is the same page, the same code and the same behaviour as the
 * site, so what it shows is what will go live.
 *
 *   node scripts/export.mjs --base "" && node scripts/artifact-from-export.mjs
 *
 * writes .artifact/ (gitignored): the pages on one level — index.html is /en/,
 * th.html is /th/, en-zen-ichi.html is /en/courses/zen-ichi/ … — the scripts,
 * styles, fonts and photographs they use, and files.json, the map to publish
 * them with (index.html is the page itself; files.json lists the rest).
 *
 * What changes on the way, and why:
 * - The site addresses its own files from the root (/_next/…, /photos/…); an
 *   artifact serves only relative addresses. They are made relative, which is
 *   why the pages sit on one level. Next.js's own script path is set in two
 *   places, and only those two are changed; its other internal paths are left
 *   alone.
 * - Links between the pages are root addresses too, and Next.js would fetch
 *   them in the background to navigate. A small script in each page takes
 *   those clicks and opens the flattened page instead; the links' own handlers
 *   (closing the phone menu) still run.
 * - The Japanese display face comes in 244 slices of characters, of which the
 *   page uses Latin and a few kanji. Only the font slices holding a character
 *   the pages use are kept, and the page stops preloading the rest: otherwise
 *   the package is over an artifact's 255-file limit, and a phone asks for
 *   hundreds of files that are not there.
 * - Route folders named [locale] and [slug] become locale and slug, and
 *   _next/ becomes next/: an artifact reserves top-level names beginning "_".
 */
import fs from "node:fs";
import path from "node:path";

const SRC = "out";
const DEST = ".artifact";

const fail = (m) => { console.error(m); process.exit(1); };
if (!fs.existsSync(`${SRC}/en/index.html`)) fail('No out/en/index.html. Run: node scripts/export.mjs --base ""');
if (!fs.readFileSync(`${SRC}/en/index.html`, "utf8").includes('src="/_next/')) {
  fail('out/ was built for a sub-path. Rebuild for a domain root: node scripts/export.mjs --base ""');
}

fs.rmSync(DEST, { recursive: true, force: true });

const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const flat = (f) => f.replace(/\[(\w+)\]/g, "$1");                 // [locale] → locale
// An artifact reserves top-level names that start with "_", so _next/ ships as next/.
const put = (f) => {
  const p = path.join(DEST, flat(f).replace(/^_next\//, "next/"));
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
};
const write = (f, s) => fs.writeFileSync(put(f), s);
const copy = (f) => fs.copyFileSync(path.join(SRC, f), put(f));
const unbracket = (s) => s.replace(/%5B(\w+)%5D/g, "$1");           // the same, in addresses

/* ── The pages, on one level ─────────────────────────────────────────────── */
const slugs = fs.readdirSync(`${SRC}/en/courses`).filter((s) => fs.existsSync(`${SRC}/en/courses/${s}/index.html`));
const pages = { "/en/": "index.html", "/th/": "th.html" };
for (const s of slugs) for (const l of ["en", "th"]) pages[`/${l}/courses/${s}/`] = `${l}-${s}.html`;
const sourceOf = (route) => `${route.slice(1)}index.html`;
const otherLang = (route) => route.replace(/^\/(en|th)\//, (_, l) => `/${l === "en" ? "th" : "en"}/`);

/* ── Fonts: only the slices that hold a character the pages use ──────────────
   Client components carry their words in the scripts, so those count too. */
const chunks = walk(`${SRC}/_next/static/chunks`).map((f) => path.relative(SRC, f));
const used = new Set();
const decode = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
for (const f of [...Object.keys(pages).map(sourceOf), ...chunks.filter((c) => c.endsWith(".js"))]) {
  for (const ch of decode(read(f))) used.add(ch.codePointAt(0));
}
const covers = (range) => range.split(",").some((part) => {
  let [lo, hi] = part.trim().replace(/^u\+/i, "").split("-");
  if (lo.includes("?")) { hi = lo.replace(/\?/g, "f"); lo = lo.replace(/\?/g, "0"); }
  const a = parseInt(lo, 16), b = parseInt(hi ?? lo, 16);
  for (const cp of used) if (cp >= a && cp <= b) return true;
  return false;
});

const media = new Set();    // files under _next/static/media the styles use
const assets = new Set();   // photos/, brand/, og/ files the pages and scripts use
let faces = 0, kept = 0;
for (const f of walk(`${SRC}/_next/static/css`).map((x) => path.relative(SRC, x))) {
  const css = read(f)
    .replace(/@font-face\{[^}]*\}/g, (face) => {
      faces++;
      const range = face.match(/unicode-range:([^;}]+)/);
      if (range && !covers(range[1])) return "";
      kept++;
      return face;
    })
    .replace(/url\(\/_next\/static\/media\/([^)]+)\)/g, (_, file) => { media.add(file); return `url(../media/${file})`; })
    .replace(/url\(\/((?:photos|brand|og)\/[^)]+)\)/g, (_, p) => { assets.add(p); return `url(../../../${p})`; });
  write(f, css);
}
for (const file of media) copy(`_next/static/media/${file}`);

/* ── Addresses to the site's own files, made relative ────────────────────── */
const relAssets = (s) => s.replace(/(?<=["'(])\/((?:photos|brand|og)\/[\w.-]+)/g, (_, p) => { assets.add(p); return p; });

let publicPath = 0;
for (const f of chunks) {
  if (!f.endsWith(".js")) { copy(f); continue; }
  let js = read(f)
    .replace(/\.p="\/_next\/"/g, () => { publicPath++; return '.p="next/"'; })
    .replace(/(__webpack_public_path__\(""\+\w+\+")\/_next\/("\))/g, (_, a, b) => { publicPath++; return `${a}next/${b}`; })
    .replace(/(path__\(""\+\w+\+")\/_next\/("\))/g, (_, a, b) => { publicPath++; return `${a}next/${b}`; });
  // An artifact refuses a text file holding U+FFFD, the replacement character,
  // written out. Next.js's polyfills use it in strings, where the escape means the same.
  write(f, unbracket(relAssets(js)).replaceAll("�", "\\ufffd"));
}
if (publicPath < 2) fail(`Expected to find Next.js's script path in two places, found ${publicPath}. The export changed; check this script.`);

/* ── The pages ───────────────────────────────────────────────────────────── */
function nav(pages, here, other) {
  // Next.js fetches linked pages ahead of time to navigate to them quickly.
  // Here the flattened pages are opened instead, so those fetches get an
  // answer at once rather than failing against the artifact's server: an
  // ordinary web page, which Next.js takes as "nothing to prepare" (a static
  // export reads text/plain as page data, so that type would be parsed).
  var fetch0 = window.fetch;
  window.fetch = function (input) {
    var u = typeof input === "string" ? input : (input && input.url) || String(input);
    if (/[?&]_rsc=/.test(u)) return Promise.resolve(new Response("", { status: 200, headers: { "content-type": "text/html" } }));
    return fetch0.apply(this, arguments);
  };
  var slash = function (p) { return /\/$/.test(p) ? p : p + "/"; };
  var route = function (href) {
    if (!href || href.charAt(0) !== "/" || href.charAt(1) === "/") return null;
    var hash = "", i = href.indexOf("#");
    if (i >= 0) { hash = href.slice(i); href = href.slice(0, i); }
    var q = href.indexOf("?");
    if (q >= 0) href = href.slice(0, q);
    var p = slash(href);
    return pages[p] ? { file: pages[p], hash: hash === "#" ? "" : hash, same: p === here } : null;
  };
  window.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !e.target.closest) return;
    if (e.target.closest("button.lang")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      try { sessionStorage.setItem("sz-y", String(window.scrollY)); } catch (_) {}
      location.href = pages[other];
      return;
    }
    var a = e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    var r = route(a.getAttribute("href"));
    if (!r) return;
    e.preventDefault();   // Next.js leaves a link alone once its click is prevented
    if (!r.same) { location.href = r.file + r.hash; return; }
    setTimeout(function () {   // after the link's own handlers, as a normal link would
      if (!r.hash) return window.scrollTo({ top: 0, behavior: "smooth" });
      var el = document.getElementById(r.hash.slice(1));
      if (location.hash !== r.hash) location.hash = r.hash;
      else if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  }, true);
  try {
    var y = sessionStorage.getItem("sz-y");
    if (y) {
      sessionStorage.removeItem("sz-y");
      window.addEventListener("load", function () { setTimeout(function () { window.scrollTo(0, +y); }, 80); });
    }
  } catch (_) {}
}

for (const [route, file] of Object.entries(pages)) {
  let h = read(sourceOf(route))
    .replace(/^<!DOCTYPE html>/i, "")
    // React's data arrives as a run of string pieces, cut anywhere (a hint can
    // straddle two). The browser joins them in order anyway; joining them here
    // first lets each hint below be found whole.
    .replaceAll('"])</script><script>self.__next_f.push([1,"', "")
    // The font preloads, in the head and as hints in React's data: kept slices
    // load from the styles anyway, and dropped ones are not in the package.
    .replace(/<link[^>]*as="font"[^>]*>/g, "")
    .replace(/:HL\[\\"\/_next\/static\/media\/[^"\\]+\\",\\"font\\",\{[^}]*\}\]\\n/g, "")
    .replace(/(?<=["'(])\/_next\//g, "next/")
    .replace(/(?<=["'(])\/(?=(?:icon|apple-icon)\.png)/g, "");
  h = unbracket(relAssets(h));
  h = h.replace("</head>", `<script>(${nav.toString()})(${JSON.stringify(pages)},${JSON.stringify(route)},${JSON.stringify(otherLang(route))})</script></head>`);
  fs.writeFileSync(path.join(DEST, file), h);
}
for (const p of assets) if (fs.existsSync(path.join(SRC, p))) copy(p);
for (const f of ["icon.png", "apple-icon.png"]) if (fs.existsSync(path.join(SRC, f))) copy(f);

/* ── The map to publish with, and the limits it has to fit ───────────────── */
const files = {};
for (const f of walk(DEST).map((x) => path.relative(DEST, x)).sort()) {
  if (f !== "index.html") files[f] = path.join(DEST, f);
}
fs.writeFileSync(path.join(DEST, "files.json"), JSON.stringify(files, null, 2));

const sizes = Object.values(files).concat(path.join(DEST, "index.html")).map((f) => fs.statSync(f).size);
const total = sizes.reduce((a, b) => a + b, 0);
console.log(`Artifact package in ${DEST}/`);
console.log(`  pages: ${Object.keys(pages).length} · font faces kept: ${kept} of ${faces} (${media.size} files) · photographs and brand files: ${assets.size}`);
console.log(`  ${sizes.length} files, ${(total / 1e6).toFixed(1)} MB; the largest ${(Math.max(...sizes) / 1e6).toFixed(1)} MB`);
if (sizes.length > 255) fail("Over the artifact limit of 255 files.");
if (total > 64e6) fail("Over the artifact limit of 64 MB.");
if (Math.max(...sizes) > 15e6) fail("A file is over the artifact limit of 15 MB.");
