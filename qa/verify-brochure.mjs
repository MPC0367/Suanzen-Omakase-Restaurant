/**
 * The menu platform's contract. This page is the link Suan Zen sends in its
 * LINE OA instead of photographs of the menu, to guests who already mean to
 * come: the menu is the page, nothing else is in the way, it is easy on a
 * phone, it is dark from top to bottom, and it is not offered to search
 * engines.
 *
 * The menu list is type. Dish photographs used to open under each name as the
 * guest scrolled; the restaurant is sending better pictures, so one picture
 * stands for a whole course instead and the list itself carries none.
 *
 *   node qa/verify-brochure.mjs [base]      default http://localhost:4324
 */
import { chromium } from "playwright";
const B = process.argv[2] || "http://localhost:4324";
const b = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
// A freshly launched Chrome can swap its certificate verifier while the first
// https page is loading and fail every request on it, leaving the curtain up.
// A moment's wait lets it settle. Against a local server there is nothing to wait for.
if (B.startsWith("https")) await new Promise((r) => setTimeout(r, 3000));
const errs = [];
let failed = 0;
const pass = (n, ok, x = "") => { if (!ok) failed++; console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const ready = (p) => p.waitForFunction(() => !document.querySelector(".curtain"), null, { timeout: 25000 });
const openCourse = (p) => p.evaluate(() => {
  const o = document.querySelector(".course.is-open");
  return o ? { name: o.querySelector(".course__name")?.textContent.trim(), top: Math.round(o.getBoundingClientRect().top) } : null;
});
/* The night palette, straight from globals.css: whatever the page does, the
   ground stays one of these. Neutral, not olive — these were rgb(11,11,8),
   rgb(20,20,14) and rgb(5,5,4), where green sat level with red and blue below
   both, which at this depth reads as a very dark green on a phone. */
const NIGHT = ["rgb(10, 10, 10)", "rgb(20, 20, 20)", "rgb(5, 5, 5)"];

/* ── desktop ─────────────────────────────────────────────────────────────── */
const d = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
d.on("pageerror", (e) => errs.push("desktop: " + String(e).slice(0, 140)));
await d.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(d);
console.log("desktop");
const ids = await d.$$eval("main > section", (ss) => ss.map((s) => s.id));
pass("the menu is the first thing on the page", ids[0] === "courses", ids.join(" → "));
pass("nothing else in the way: menu, à la carte, visit", ids.join("|") === "courses|alacarte|visit");
pass("the page's heading is the menu's", await d.$eval("h1", (h) => !!h.closest("#courses")).catch(() => false));
pass("the link preview says Menu", (await d.title()).includes("Menu"), await d.title());
const nav = await d.$$eval(".hdr__nav a", (as) => as.map((a) => a.textContent.trim()));
pass("header: Menu and Visit", nav.join("|") === "Menu|Visit", nav.join(" · "));
pass("no form anywhere", (await d.locator("form").count()) === 0);
pass("nothing links to a booking page", (await d.locator('a[href*="/book"]').count()) === 0);
const robots = await d.$eval('meta[name="robots"]', (m) => m.content).catch(() => "none");
pass("not offered to search engines", /noindex,\s*nofollow/.test(robots), robots);
const rootHtml = await (await fetch(B + "/")).text();
pass("the root link (the one in the QR) previews as Menu and is not listed",
     /<title>[^<]*Menu/.test(rootHtml) && /noindex,\s*nofollow/.test(rootHtml),
     (rootHtml.match(/<title>([^<]*)/) || [])[1] || "no title");
// robots.txt keeps /photos/ out of image search, so a preview picture there
// may never show in LINE. The root link must use the one in /og/.
const rootImg = (rootHtml.match(/property="og:image" content="([^"]*)"/) || [])[1] || "";
pass("the root link's preview picture is the /og/ one", /\/og\/suan-zen\.jpg$/.test(rootImg), rootImg || "no og:image");
const nf = await fetch(B + "/404.html");
pass("the 404 page is not listed either", nf.ok && /noindex,\s*nofollow/.test(await nf.text()), `HTTP ${nf.status}`);
await d.screenshot({ path: "qa/shots/platform-desktop.png" });
await d.locator(".hdr__cta").click(); await d.waitForTimeout(700);
const line = await d.locator(".res.is-open .res__line").getAttribute("href").catch(() => null);
pass("Reserve opens the LINE panel", !!line && line.includes("lin.ee"), line || "no panel");
await d.locator(".res__x").click().catch(() => {}); await d.waitForTimeout(500);
const chips = d.locator(".menu__jump .jump");
pass("seven course shortcuts", (await chips.count()) === 7);
const want = (await chips.nth(4).locator(".jump__name").textContent()).trim();
await chips.nth(4).click(); await d.waitForTimeout(1300);
const got = await openCourse(d);
pass("a shortcut opens its course and brings it into view", !!got && got.name === want && got.top >= 0 && got.top < 260,
     got ? `${got.name} at ${got.top}px` : "nothing open");
const acts = await d.$$eval(".visit__acts a", (as) => as.map((a) => a.getAttribute("href")));
pass("visit: Reserve on LINE, call, directions", acts.length === 3 && acts[0].includes("lin.ee") && acts[1].startsWith("tel:"), `${acts.length} actions`);

// Where the guest goes to find the restaurant: Google's own map, not a picture
// of one, and it must take the guest's finger rather than sit under a scrim.
// The embed is lazy — it is only fetched once Visit is in view — so this waits
// for it rather than measuring an empty frame.
await d.evaluate(() => document.getElementById("visit")?.scrollIntoView({ block: "start" }));
await d.waitForTimeout(6000);
const map = await d.evaluate(async () => {
  const f = document.querySelector(".visit__frame");
  if (!f) return { there: false };
  const r = f.getBoundingClientRect();
  const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
  const over = getComputedStyle(document.querySelector(".visit__canvas"), "::after");
  return { there: true, src: f.getAttribute("src") || "", size: `${Math.round(r.width)}×${Math.round(r.height)}`,
           takesThePointer: hit === f, filter: getComputedStyle(f).filter,
           over: over.content === "none" ? "nothing over it" : over.pointerEvents };
});
// The map may be dressed to match the page — the frame is darkened — but
// nothing may be laid over it, and it must be the thing the guest's finger
// lands on.
pass("the map at the bottom is Google's own, with nothing over it, and takes the guest's finger",
     map.there && /maps\.google\.com|google\.com\/maps/.test(map.src) && map.takesThePointer
       && (map.over === "nothing over it" || map.over === "none"),
     map.there ? `${map.size}, centre hits ${map.takesThePointer ? "the map" : "something over it"}, ${map.over}, frame ${map.filter === "none" ? "undarkened" : "darkened"}` : "no map");

// And where a browser refuses embedded pages — an in-app browser, a content
// blocker, a preview that serves only the page's own files — the plan beneath
// becomes the link, so the guest still reaches Google Maps in one tap.
{
  const bl = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
  await bl.route(/google|gstatic/, (r) => r.abort());
  await bl.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(bl);
  await bl.locator(".visit__canvas").scrollIntoViewIfNeeded();
  await bl.evaluate(() => window.scrollBy(0, -60));     // the whole plan on screen, so its middle is a real point
  await bl.waitForTimeout(11000);                      // the frame watches for the map for 8s before standing aside
  const fall = await bl.evaluate(() => {
    const c = document.querySelector(".visit__canvas").getBoundingClientRect();
    const el = document.elementFromPoint(Math.round(c.left + c.width / 2), Math.round(c.top + c.height / 2));
    return { tag: el?.tagName ?? "nothing", href: el?.closest("a")?.getAttribute("href") ?? "none" };
  });
  pass("where the map cannot load, tapping it still opens Google Maps",
       /maps\.google|google\.[a-z.]+\/maps/.test(fall.href), `${fall.tag} → ${fall.href.slice(0, 52)}`);
  await bl.context().close();
}

await d.goto(B + "/th/", { waitUntil: "domcontentloaded" }); await ready(d);
const thNav = await d.$$eval(".hdr__nav a", (as) => as.map((a) => a.textContent.trim()));
pass("Thai: header leads with the menu", thNav[0] === "เมนู", thNav.join(" · "));
pass("Thai: the link preview says เมนู", (await d.title()).includes("เมนู"), await d.title());

/* ── phone ───────────────────────────────────────────────────────────────── */
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
m.on("pageerror", (e) => errs.push("phone: " + String(e).slice(0, 140)));
await m.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(m);
console.log("phone");
// The page opens on finding your course: a course for every age, in a glance.
const fam = await m.locator(".family").boundingBox();
pass("the page opens on a course for every age, all on the first screen", !!fam && fam.y + fam.height <= 844,
     fam ? `the family path ends at ${Math.round(fam.y + fam.height)}px of 844` : "no family path");
await m.screenshot({ path: "qa/shots/platform-phone-top.png" });

await m.evaluate(() => { document.documentElement.style.scrollBehavior = "auto";
  const c = document.querySelectorAll(".course")[0]; scrollTo(0, scrollY + c.getBoundingClientRect().top + 900); });
await m.waitForTimeout(800);
const bar = await m.evaluate(() => ({ top: Math.round(document.querySelector(".menu__jump").getBoundingClientRect().top),
  bottom: Math.round(document.querySelector(".menu__jump").getBoundingClientRect().bottom),
  hdr: Math.round(document.querySelector(".hdr").getBoundingClientRect().bottom) }));
pass("the course bar stays pinned under the header", Math.abs(bar.top - bar.hdr) <= 2, `bar at ${bar.top}px, header ends ${bar.hdr}px`);
const mchips = m.locator(".menu__jump .jump");
const nChips = await mchips.count();
const lit = () => m.$$eval(".menu__jump .jump", (cs) => cs.findIndex((c) => c.classList.contains("is-on")));
const openCount = await m.locator(".course.is-open").count();
pass("one course is open at a time, and the rest are folded away", openCount === 1, `${openCount} of ${nChips} open`);

// Scroll by hand (instantly, so nothing is measured mid-scroll) until a course
// sits just under the pinned bar.
const underBar = (i) => m.evaluate((i) => {
  const under = document.querySelector(".hdr").getBoundingClientRect().height
    + document.querySelector(".menu__jump").getBoundingClientRect().height;
  const c = document.querySelectorAll(".course")[i];
  scrollTo({ top: scrollY + c.getBoundingClientRect().top - under - 8, behavior: "instant" });
}, i);
/* The bar lights the course that is open, on every screen. It used to follow
   the page's scroll instead, because a phone held every course open at once
   and so "open" said nothing; one course at a time is its own answer, and the
   page's scroll is left to the guest. */
await mchips.nth(3).tap(); await m.waitForTimeout(1200);
pass("the bar lights the course that is open", (await lit()) === 3, `lit: ${await lit()}`);
const opened = await m.evaluate(() => [...document.querySelectorAll(".course.is-open")].map((c) => c.id));
pass("…and opening it closed the one before", opened.length === 1, opened.join(", ") || "none open");
await underBar(3); await m.waitForTimeout(500);
pass("scrolling past it does not change which course is lit", (await lit()) === 3, `lit: ${await lit()}`);
const inBar = await m.evaluate(() => {
  const bar = document.querySelector(".menu__jump").getBoundingClientRect();
  const on = document.querySelector(".menu__jump .jump.is-on")?.getBoundingClientRect();
  return !!on && on.left >= bar.left - 1 && on.right <= bar.right + 1;
});
pass("the bar slides to keep the spotlit course in view", inBar);
/* Scrolling never changes what is lit — the open course does. Back at the top
   of the menu the bar still points at the course the guest left open, and
   tapping the first course is what lights the first chip. */
await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(500);
pass("back at the top, the bar still points at the course left open", (await lit()) === 3, `lit: ${await lit()}`);
await mchips.nth(0).tap(); await m.waitForTimeout(1200);
const first = await m.evaluate(() => [...document.querySelectorAll(".course.is-open")].map((c) => c.id));
pass("opening the first course lights it, and closes the one before",
     (await lit()) === 0 && first.join() === "course-zen-kids", `lit: ${await lit()}; open: ${first.join(", ") || "none"}`);

// Tap a course from the top and watch the spotlight all the way there.
const mwant = (await mchips.nth(5).locator(".jump__name").textContent()).trim();
await m.evaluate(() => {
  window.__lit = []; const t0 = performance.now();
  const tick = () => {
    const i = [...document.querySelectorAll(".menu__jump .jump")].findIndex((c) => c.classList.contains("is-on"));
    if (window.__lit[window.__lit.length - 1] !== i) window.__lit.push(i);
    if (performance.now() - t0 < 2600) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await mchips.nth(5).tap(); await m.waitForTimeout(2800);
const seen = await m.evaluate(() => window.__lit);
const landed = await m.evaluate(() => {
  const c = document.querySelectorAll(".course")[5];
  return { name: c.querySelector(".course__name").textContent.trim(), top: Math.round(c.getBoundingClientRect().top),
           bar: Math.round(document.querySelector(".menu__jump").getBoundingClientRect().bottom) };
});
pass("a course tapped from the bar lands just below it", landed.name === mwant && landed.top >= landed.bar - 2 && landed.top < landed.bar + 140,
     `${landed.name} at ${landed.top}px, bar ends ${landed.bar}px`);
pass("the spotlight goes straight to the tapped course", seen.at(-1) === 5 && seen.slice(1).every((i) => i === 5), seen.join(" → "));
await m.screenshot({ path: "qa/shots/platform-phone-pinned.png" });

// ── The menu list is type ───────────────────────────────────────────────────
// Names, numbers and prices. A course's own picture stands above its list;
// nothing opens, and nothing appears as the guest scrolls past.
const listing = await m.evaluate(() => ({
  dishes: document.querySelectorAll(".menu__list .dish").length,
  imagesInLists: document.querySelectorAll(".menu__list .dishes img").length,
  buttonsInLists: document.querySelectorAll(".menu__list .dishes button").length,
  named: [...document.querySelectorAll(".menu__list .dish")].every((d) => (d.querySelector(".dish__name")?.textContent || "").trim().length > 0),
  numbered: [...document.querySelectorAll(".menu__list .dish")].every((d) => /^\d\d$/.test((d.querySelector(".dish__n")?.textContent || "").trim())),
}));
pass("every dish in the menu is a name and its number, and nothing else",
     listing.dishes > 60 && listing.imagesInLists === 0 && listing.buttonsInLists === 0 && listing.named && listing.numbered,
     `${listing.dishes} dishes · ${listing.imagesInLists} pictures · ${listing.buttonsInLists} buttons in the lists`);

/* Every course shows the restaurant's own pictures of it: the five it has sent
   named photographs for show a rail of their dishes, each captioned with the
   dish's name; the other two show the single picture they have. One or the
   other, never both, and never a picture borrowed from another course. */
/* Each course is opened AND brought into view, as tapping it in the bar does
   for a guest. The pictures are loaded lazily — a browser fetches them when
   they come near the screen — so a rail judged while parked far down the page
   would be empty through no fault of the page. */
const pics = await m.evaluate(async () => {
  const out = [];
  for (const c of document.querySelectorAll(".menu__list .course")) {
    const id = c.id.replace("course-", "");
    document.querySelector(`.menu__jump [data-course="${id}"]`)?.click();
    await new Promise((r) => setTimeout(r, 300));
    c.scrollIntoView({ block: "start" });
    const rail = () => [...c.querySelectorAll(".cgal__item:not([aria-hidden]) img")];
    const single = () => [...c.querySelectorAll(".course__photo img")];
    for (let i = 0; i < 40; i++) {                       // give the pictures a moment to arrive
      const all = [...rail(), ...single()];
      if (all.length && all.every((x) => x.complete && x.naturalWidth > 0)) break;
      await new Promise((r) => setTimeout(r, 150));
    }
    out.push({ id, rail: rail().length, single: single().length,
      captioned: [...c.querySelectorAll(".cgal__item:not([aria-hidden]) .cgal__cap")].every((s) => (s.textContent || "").trim().length > 3),
      loaded: [...rail(), ...single()].every((i) => i.complete && i.naturalWidth > 0) });
  }
  return out;
});
const railed = pics.filter((p) => p.rail);
pass("a course whose dishes were photographed shows them all, each named, and they load",
     railed.length === 5 && railed.every((p) => p.rail >= 3 && p.captioned && p.loaded && p.single === 0),
     railed.map((p) => `${p.id} ${p.rail}`).join(", ") || "none");
pass("a course without dish photographs still shows its own single picture",
     pics.filter((p) => !p.rail).every((p) => p.single === 1 && p.loaded),
     pics.filter((p) => !p.rail).map((p) => p.id).join(", ") || "every course has a rail");

// Scrolling the whole menu by hand: nothing opens, closes or moves by itself.
await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(400);
await m.evaluate(() => {
  window.__changed = 0;
  new MutationObserver((rs) => { window.__changed += rs.length; })
    .observe(document.querySelector(".menu__list"), { subtree: true, attributes: true, attributeFilter: ["class", "style"], childList: true });
});
await m.mouse.move(190, 600);
for (let k = 0; k < 40; k++) { await m.mouse.wheel(0, 120); await m.waitForTimeout(50); }
await m.waitForTimeout(600);
const churn = await m.evaluate(() => ({ changed: window.__changed, images: document.querySelectorAll(".menu__list .dishes img").length }));
pass("scrolling the menu by hand opens nothing and stirs nothing", churn.changed === 0 && churn.images === 0,
     `${churn.changed} changes in the list while scrolling past every course`);

// ── It never turns light ────────────────────────────────────────────────────
const grounds = [];
for (const id of ["courses", "alacarte", "visit"]) {
  await m.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: "start" }), id);
  await m.waitForTimeout(700);
  grounds.push(await m.evaluate((s) => ({ at: s, body: getComputedStyle(document.body).backgroundColor,
    world: document.documentElement.dataset.world ?? "none" })));
}
pass("the page is night from top to bottom, and never crosses into daylight",
     grounds.every((g) => NIGHT.includes(g.body) && g.world === "none"),
     grounds.map((g) => `${g.at}: ${g.body}`).join(" · "));
pass("the browser is told the page is dark, so its own scrollbars and carets follow",
     (await m.evaluate(() => getComputedStyle(document.documentElement).colorScheme)) === "dark");

// Back from a course page lands where the guest left the menu.
/* A course's own page is reached from inside the course, so the course has to
   be open first — with one open at a time, everything in a folded course is
   out of reach until the guest opens it, which is the point of the fold. */
await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(300);
await m.locator('.menu__jump [data-course="zen-ichi"]').tap(); await m.waitForTimeout(1200);
await m.locator("#course-zen-ichi .course__acts a.link-arrow").scrollIntoViewIfNeeded(); await m.waitForTimeout(300);
const leftAt = await m.evaluate(() => Math.round(scrollY));
await m.locator("#course-zen-ichi .course__acts a.link-arrow").tap(); await m.waitForTimeout(1800);
pass("a course's own page opens from the menu", /\/courses\/zen-ichi\/?$/.test(new URL(m.url()).pathname.replace(/index\.html$/, "")),
     new URL(m.url()).pathname);
const coursePage = await m.evaluate(() => ({
  picture: document.querySelectorAll(".cdetail__photo img").length,
  loaded: [...document.querySelectorAll(".cdetail__photo img")].every((i) => i.complete && i.naturalWidth > 0),
  imagesInList: document.querySelectorAll(".cdetail__list img").length,
  dishes: document.querySelectorAll(".dish").length,
}));
pass("a course page lists its dishes in type, with no picture among them",
     coursePage.dishes > 0 && coursePage.imagesInList === 0,
     `${coursePage.dishes} dishes · ${coursePage.imagesInList} pictures in the list`);
await m.goBack(); await m.waitForTimeout(2000);
const backAt = await m.evaluate(() => Math.round(scrollY));
pass("Back from a course page comes back to where the guest was", Math.abs(backAt - leftAt) <= 120, `left at ${leftAt}px, came back to ${backAt}px`);

// A link straight to #visit opens at Visit, not by racing the whole menu past from the top.
const dv = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
await dv.goto(B + "/en/#visit", { waitUntil: "load" });
const early = await dv.evaluate(() => Math.round(document.getElementById("visit").getBoundingClientRect().top));
await dv.waitForTimeout(1500);
const later = await dv.evaluate(() => Math.round(document.getElementById("visit").getBoundingClientRect().top));
// (It may settle a few px as the header compacts; racing the menu past would be thousands.)
pass("a link straight to #visit opens at Visit, without racing the menu past", Math.abs(early - later) <= 40 && Math.abs(later) < 140,
     `Visit at ${early}px on load, ${later}px after`);
await dv.context().close();

// The narrowest phones still in use (320px) get the page without sideways scrolling.
for (const loc of ["en", "th"]) {
  const np = await (await b.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true })).newPage();
  np.on("pageerror", (e) => errs.push("320px: " + String(e).slice(0, 140)));
  await np.goto(`${B}/${loc}/`, { waitUntil: "domcontentloaded" }); await ready(np);
  const w = await np.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  pass(`at 320px wide, /${loc}/ doesn't scroll sideways`, w.sw <= w.cw, `${w.sw}px of content in ${w.cw}px`);
  await np.context().close();
}

await m.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(m);
await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(400);
await m.locator(".burger").tap(); await m.waitForTimeout(900);
const sheet = await m.$$eval(".sheet__nav a", (as) => as.map((a) => ({ t: a.textContent.replace(/[0-9]/g, "").trim(), h: Math.round(a.getBoundingClientRect().height) })));
pass("phone menu: Menu and Visit", sheet.map((s) => s.t).join("|") === "Menu|Visit", sheet.map((s) => s.t).join(" · "));
pass("phone menu: links are at least 44px tall", sheet.every((s) => s.h >= 44), sheet.map((s) => s.h + "px").join(", "));
pass("phone menu: Reserve on LINE", (await m.locator('.sheet a[href*="lin.ee"]').count()) >= 1);

// The Visit link reloads the page at #visit (/en → /en/#visit). With every
// course showing from the first paint, it has to land on Visit itself.
await m.goto(B + "/en/#visit", { waitUntil: "domcontentloaded" }); await ready(m); await m.waitForTimeout(2000);
const visit = await m.evaluate(() => ({ top: Math.round(document.getElementById("visit").getBoundingClientRect().top),
  hdr: Math.round(document.querySelector(".hdr").getBoundingClientRect().height) }));
pass("a link to #visit lands on Visit", Math.abs(visit.top) <= visit.hdr + 10, `Visit at ${visit.top}px, header ${visit.hdr}px`);

// Turning a tablet, or widening the window, past the desktop width keeps the
// course being read open and in view.
/* Opened, not merely scrolled to: with one course open at a time, scrolling
   past a course opens nothing, so the course being read is the one the guest
   opened. */
await m.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(m);
await m.locator(".menu__jump .jump").nth(4).tap(); await m.waitForTimeout(1200);
await m.setViewportSize({ width: 1440, height: 900 }); await m.waitForTimeout(1000);
const wide = await m.evaluate(() => {
  const cs = [...document.querySelectorAll(".course")];
  return { open: cs.flatMap((c, i) => (c.classList.contains("is-open") ? [i] : [])),
           top: Math.round(cs[4].getBoundingClientRect().top) };
});
pass("widening to a desktop keeps the course being read, in view", wide.open.join() === "4" && wide.top >= 0 && wide.top < 450,
     `open: ${wide.open.join(", ")}; that course at ${wide.top}px`);

/* Before the script runs (a slow phone, a slow network), the page must already
   show what the script will settle on: one course open, the same one, on every
   width. When the two disagree, a course opens or folds late — above the guest
   if they have started reading — and a link straight to #visit lands somewhere
   else. globals.css hides [hidden] with !important, which once made the phone
   rule inert while the #visit check above still passed on timing alone. */
for (const [w, h, want] of [[390, 844, 1], [1440, 900, 1]]) {
  const pc = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 1024, hasTouch: w < 1024 });
  const pp = await pc.newPage();
  await pp.route("**/_next/static/**/*.js", (r) => r.abort());
  await pp.goto(B + "/en/", { waitUntil: "load" }); await pp.waitForTimeout(500);
  const shown = await pp.$$eval(".course__panel", (ps) => ps.filter((x) => getComputedStyle(x).display !== "none").length);
  pass(`before the script runs, ${w}px shows ${want === 1 ? "one course" : "every course"}`, shown === want, `${shown} of 7 showing`);
  await pc.close();
}

console.log("desktop, again");
await d.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(d);
await d.locator(".menu__jump .jump").nth(2).click(); await d.waitForTimeout(900);
const dOpen = await d.locator(".course.is-open").count();
pass("a desktop keeps one course open at a time", dOpen === 1, `${dOpen} open`);
/* The open course carries the restaurant's pictures of it — a rail of its
   dishes where they were photographed, its single picture otherwise — and
   nothing stands in a column beside the menu, as a photograph stage once did. */
const dPics = await d.evaluate(() => ({
  rail: document.querySelectorAll(".course.is-open .cgal__item:not([aria-hidden]) img").length,
  single: document.querySelectorAll(".course.is-open .course__photo img").length,
  beside: document.querySelectorAll(".menu__stage, .menu__frame, .menu__img").length,
}));
pass("on a desktop the open course shows its own pictures, and nothing stands beside the menu",
     (dPics.rail > 0) !== (dPics.single > 0) && dPics.beside === 0,
     `${dPics.rail} in the rail, ${dPics.single} single`);

console.log(errs.length ? "  JS errors:\n    " + errs.join("\n    ") : "  no JS errors");
await b.close();
process.exit(failed ? 1 : 0);
