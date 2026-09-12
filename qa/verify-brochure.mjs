/**
 * The menu platform's contract. This page is the link Suan Zen sends in its
 * LINE OA instead of photographs of the menu, to guests who already mean to
 * come: the menu is the page, nothing else is in the way, it is easy on a
 * phone, and it is not offered to search engines.
 *
 *   node qa/verify-brochure.mjs [base]      default http://localhost:4324
 */
import { chromium } from "playwright";
const B = process.argv[2] || "http://localhost:4324";
const b = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const errs = [];
let failed = 0;
const pass = (n, ok, x = "") => { if (!ok) failed++; console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const ready = (p) => p.waitForFunction(() => !document.querySelector(".curtain"), null, { timeout: 25000 });
const openCourse = (p) => p.evaluate(() => {
  const o = document.querySelector(".course.is-open");
  return o ? { name: o.querySelector(".course__name")?.textContent.trim(), top: Math.round(o.getBoundingClientRect().top) } : null;
});

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
pass("on a phone every course is already open", openCount === nChips, `${openCount} of ${nChips} open`);

// Scroll by hand (instantly, so nothing is measured mid-scroll) until a course
// sits just under the pinned bar.
const underBar = (i) => m.evaluate((i) => {
  const under = document.querySelector(".hdr").getBoundingClientRect().height
    + document.querySelector(".menu__jump").getBoundingClientRect().height;
  const c = document.querySelectorAll(".course")[i];
  scrollTo({ top: scrollY + c.getBoundingClientRect().top - under - 8, behavior: "instant" });
}, i);
await underBar(3); await m.waitForTimeout(500);
pass("scrolling down spotlights the course being read", (await lit()) === 3, `spotlit: ${await lit()}`);
const inBar = await m.evaluate(() => {
  const bar = document.querySelector(".menu__jump").getBoundingClientRect();
  const on = document.querySelector(".menu__jump .jump.is-on")?.getBoundingClientRect();
  return !!on && on.left >= bar.left - 1 && on.right <= bar.right + 1;
});
pass("the bar slides to keep the spotlit course in view", inBar);
await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(500);
pass("back at the top, the first course is spotlit", (await lit()) === 0, `spotlit: ${await lit()}`);

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

// ── The spotlight ────────────────────────────────────────────────────────────
// On a phone the middle of the screen rests on one dish at a time, as a
// pointer would: that dish is lit, its photograph (where it has one) slides
// open beneath it, and when the middle moves on, the one before closes. The
// dish at the middle must never move while a photograph above it closes.
const coverOf = () => Math.max(document.querySelector(".hdr").getBoundingClientRect().bottom,
                               document.querySelector(".menu__jump")?.getBoundingClientRect().bottom ?? 0);
const LINE = `((() => { const c = (${coverOf.toString()})(); return c + (innerHeight - c) * 0.45; })())`;
const litDish = (p) => p.evaluate(() => [...document.querySelectorAll(".dish.is-lit")].map((d) => d.dataset.uid));
const opened = (p) => p.evaluate(() => [...document.querySelectorAll(".dish.is-shown:not(.is-leaving)")].map((d) => d.dataset.uid));
const shownAll = (p) => p.evaluate(() => [...document.querySelectorAll(".dish.is-shown")].map((d) => d.dataset.uid));
const atMiddle = (p) => p.evaluate(`document.elementFromPoint(innerWidth / 2, ${LINE})?.closest("li.dish")?.dataset.uid ?? null`);
// Bring a dish's name to the middle as a tapped link would (not the guest's own scrolling), in two steps.
const toMiddle = async (p, uid, off = 0) => {
  await p.evaluate(() => document.body.click());
  for (let i = 0; i < 2; i++) {
    await p.evaluate(`(() => { const r = document.querySelector('[data-uid="${uid}"] .dish__btn').getBoundingClientRect();
      scrollTo({ top: scrollY + (r.top + r.bottom) / 2 - ${LINE} + ${off}, behavior: "instant" }); })()`);
    await p.waitForTimeout(350);
  }
  await p.waitForTimeout(400);                             // it lights and opens once the page rests
};
// One jump that puts a dish at the middle, then how far whatever is at the
// middle moves on the screen, measured after each frame is drawn, for `ms`.
const jumpAndWatch = async (p, uid, ms = 900) => {
  await p.evaluate(() => document.body.click());
  await p.evaluate(`(() => { const r = document.querySelector('[data-uid="${uid}"] .dish__btn').getBoundingClientRect();
    scrollTo({ top: scrollY + (r.top + r.bottom) / 2 - ${LINE}, behavior: "instant" }); })()`);
  await p.waitForTimeout(80);
  return p.evaluate(`new Promise((done) => {
    const el = document.elementFromPoint(innerWidth / 2, ${LINE}); const tops = []; const t0 = performance.now();
    const ch = new MessageChannel();
    ch.port1.onmessage = () => { tops.push(el.getBoundingClientRect().top);
      if (performance.now() - t0 < ${ms}) requestAnimationFrame(() => ch.port2.postMessage(0));
      else done(Math.round((Math.max(...tops) - Math.min(...tops)) * 10) / 10); };
    requestAnimationFrame(() => ch.port2.postMessage(0)); })`);
};
const uids = await m.evaluate(() => {
  const c = document.querySelectorAll(".course");
  const first = c[1].querySelector(".dish.has-photo");
  return {
    plain: c[0].querySelectorAll(".dish")[3].dataset.uid,                               // Zen Kids has no photographs
    sashimi: first.dataset.uid,                                                          // Zen Ichi: Suan Zen sashimi
    next: first.nextElementSibling.dataset.uid,                                          // the dish after it
    trio: [...c[2].querySelectorAll(".dish.has-photo")].map((d) => d.dataset.uid),       // Zen Ni's three, close together
  };
});

await toMiddle(m, uids.plain);
const litPlain = await litDish(m);
pass("the dish at the middle of the screen is lit, and only that one",
     litPlain.length === 1 && litPlain[0] === uids.plain && (await atMiddle(m)) === uids.plain, litPlain.join(", "));
pass("a dish with no photograph of its own opens nothing", (await shownAll(m)).length === 0);

await toMiddle(m, uids.sashimi);
const drop = await m.evaluate((u) => {
  const li = document.querySelector(`[data-uid="${u}"]`), img = li.querySelector(".dish__drop img");
  return { name: Math.round(li.querySelector(".dish__btn").getBoundingClientRect().bottom),
           top: img ? Math.round(img.getBoundingClientRect().top) : null, loaded: !!img && img.complete && img.naturalWidth > 0 };
}, uids.sashimi);
pass("a lit dish with its own photograph slides it open beneath its name",
     JSON.stringify(await opened(m)) === JSON.stringify([uids.sashimi]) && drop.loaded && drop.top >= drop.name && drop.top <= drop.name + 14,
     `photo at ${drop.top}px, under a name ending at ${drop.name}px`);

const movedOn = await jumpAndWatch(m, uids.next);
pass("when the middle moves on, the photo before closes, and the dish now at the middle doesn't move",
     (await shownAll(m)).length === 0 && JSON.stringify(await litDish(m)) === JSON.stringify([uids.next]) && movedOn <= 2,
     `moved ${movedOn}px while the photo above closed`);
const movedBack = await jumpAndWatch(m, uids.sashimi);
pass("back up: the photo at the middle opens beneath it, and nothing at the middle moves",
     JSON.stringify(await opened(m)) === JSON.stringify([uids.sashimi]) && movedBack <= 2, `moved ${movedBack}px while it opened`);

await toMiddle(m, uids.trio[0], -220);
await m.mouse.move(190, 600);
let most = 0; const litSeen = new Set();
for (let k = 0; k < 45; k++) {
  await m.mouse.wheel(0, 30); await m.waitForTimeout(70);
  most = Math.max(most, (await shownAll(m)).length);
  (await litDish(m)).forEach((u) => litSeen.add(u));
}
await m.waitForTimeout(600);
pass("scrolling by hand through three photographs close together, only one is ever open",
     most <= 1 && uids.trio.every((u) => litSeen.has(u)), `at most ${most} open; ${litSeen.size} dishes lit on the way`);

await toMiddle(m, uids.plain, 260);
await m.locator(`[data-uid="${uids.plain}"] .dish__btn`).tap(); await m.waitForTimeout(1600);
pass("tapping a dish glides it to the middle, where it lights", JSON.stringify(await litDish(m)) === JSON.stringify([uids.plain]));
await m.locator(`[data-uid="${uids.sashimi}"] .dish__btn`).scrollIntoViewIfNeeded(); await m.waitForTimeout(300);
await m.locator(`[data-uid="${uids.sashimi}"] .dish__btn`).tap(); await m.waitForTimeout(1600);
const tapOpen = await opened(m);
await m.locator(`[data-uid="${uids.sashimi}"] .dish__btn`).tap(); await m.waitForTimeout(700);
pass("…a dish with a photograph opens there, and a second tap closes it",
     JSON.stringify(tapOpen) === JSON.stringify([uids.sashimi]) && (await shownAll(m)).length === 0, `opened: ${tapOpen.join(", ")}`);

await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(500);
await m.mouse.move(190, 600); await m.mouse.wheel(0, 20); await m.waitForTimeout(300);   // the guest has been scrolling by hand…
await m.evaluate(() => {
  window.__sweep = new Set();
  new MutationObserver(() => document.querySelectorAll(".dish.is-shown, .dish.is-lit").forEach((d) => window.__sweep.add(d.dataset.uid)))
    .observe(document.querySelector(".menu__list"), { subtree: true, attributes: true, attributeFilter: ["class"] });
});
await mchips.nth(5).tap(); await m.waitForTimeout(2800);                                    // …then taps a course far down the bar
const sweep = await m.evaluate(() => {
  const c = document.querySelectorAll(".course")[5], here = c.id.replace("course-", "");
  return { touched: [...window.__sweep].filter((u) => !u.startsWith(here)).length, top: Math.round(c.getBoundingClientRect().top),
           bar: Math.round(document.querySelector(".menu__jump").getBoundingClientRect().bottom) };
});
pass("a shortcut sweeping past dishes lights and opens none of them on the way, and still lands",
     sweep.touched === 0 && sweep.top >= sweep.bar - 2 && sweep.top < sweep.bar + 140,
     `${sweep.touched} lit or opened on the way; course at ${sweep.top}px, bar ends ${sweep.bar}px`);

// An iPhone has no scroll anchoring: the page holds the middle still itself,
// and never while a fling glides on — a photograph above the middle fades out
// at once and keeps its place until the page rests, then slides shut.
const ip = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
ip.on("pageerror", (e) => errs.push("iphone-like: " + String(e).slice(0, 140)));
await ip.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(ip);
await ip.addStyleTag({ content: "html,body{overflow-anchor:none !important}" });
await toMiddle(ip, uids.sashimi);
const ipMoved = await jumpAndWatch(ip, uids.next);
pass("on an iPhone (no scroll anchoring), the photo before closes once the page rests, and the dish at the middle doesn't move",
     (await shownAll(ip)).length === 0 && ipMoved <= 2, `moved ${ipMoved}px while the photo above closed`);
await toMiddle(ip, uids.trio[0], -220);
await ip.mouse.move(190, 600);
let onlyLitShows = true, waited = false, mostOpen = 0;
for (let k = 0; k < 45; k++) {
  await ip.mouse.wheel(0, 30); await ip.waitForTimeout(70);
  const s = await ip.evaluate(() => [...document.querySelectorAll(".dish.is-shown")].map((d) => ({ lit: d.classList.contains("is-lit"), leaving: d.classList.contains("is-leaving") })));
  mostOpen = Math.max(mostOpen, s.length);
  if (s.some((x) => x.leaving)) waited = true;
  if (s.some((x) => !x.lit && !x.leaving)) onlyLitShows = false;   // an open picture that is neither lit nor fading
}
await ip.waitForTimeout(800);
const ipRest = (await shownAll(ip)).length;
pass("…while the page moves, only the lit dish shows its picture (one waits at most); at rest only it is open",
     onlyLitShows && mostOpen <= 2 && ipRest <= 1,
     `${waited ? "photos above faded and waited" : "none had to wait"}; at most ${mostOpen} open while moving, ${ipRest} at rest`);
// Flinging across photo dishes: what the guest sees must not move — measured
// after each frame is drawn, with the page's own corrective scrolls discounted.
const flingSeen = await (async () => {
  await toMiddle(ip, uids.trio[0], -300);
  await ip.evaluate(`(() => { window.__own = 0; window.__seen = 0;
    const sb = window.scrollBy.bind(window), st = window.scrollTo.bind(window);
    window.scrollBy = function () { const y0 = scrollY; sb.apply(window, arguments); window.__own += scrollY - y0; };
    window.scrollTo = function () { const y0 = scrollY; st.apply(window, arguments); window.__own += scrollY - y0; };
    const line = ${LINE}; let el = null, top = 0, y = 0, own = 0; const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      const hit = document.elementFromPoint(innerWidth / 2, ${LINE});
      const e = hit?.closest("li.dish") || hit; const t = e ? e.getBoundingClientRect().top : 0;
      const mine = (scrollY - y) - (window.__own - own);
      if (e === el && el) window.__seen = Math.max(window.__seen, Math.abs((t - top) + mine));
      el = e; top = t; y = scrollY; own = window.__own;
      requestAnimationFrame(() => ch.port2.postMessage(0));
    };
    requestAnimationFrame(() => ch.port2.postMessage(0)); })()`);
  const cdp = await ip.context().newCDPSession(ip);
  for (let k = 0; k < 5; k++) {
    await cdp.send("Input.synthesizeScrollGesture", { x: 190, y: 700, yDistance: -400 - k * 60, speed: 2500 + k * 800, gestureSourceType: "touch", preventFling: false });
    await ip.waitForTimeout(800);
  }
  await ip.waitForTimeout(1200);
  return Math.round(await ip.evaluate(() => window.__seen));
})();
pass("flinging across photo dishes moves nothing the guest didn't move", flingSeen <= 3, `worst ${flingSeen}px over five flings`);
await ip.context().close();

// From adversarial testing of the spotlight.
let ip2;
// Watch one element's place on screen, after each frame is drawn, for `ms`.
const watchEl = (p, sel, ms = 1000) => p.evaluate(`new Promise((done) => {
  const el = document.querySelector('${sel}'); const tops = []; const t0 = performance.now(); const ch = new MessageChannel();
  ch.port1.onmessage = () => { tops.push(el.getBoundingClientRect().top);
    if (performance.now() - t0 < ${ms}) requestAnimationFrame(() => ch.port2.postMessage(0));
    else done(Math.round((Math.max(...tops) - Math.min(...tops)) * 10) / 10); };
  requestAnimationFrame(() => ch.port2.postMessage(0)); })`);
const more = await m.evaluate(() => {
  const c = [...document.querySelectorAll(".course")], by = (k) => c.find((x) => x.id === `course-zen-${k}`);
  const sanPhotos = [...by("san").querySelectorAll(".dish.has-photo")];
  const sweet = by("sweet").querySelector(".dish.has-photo");
  return { sanLast: sanPhotos.at(-1).dataset.uid, sweet: sweet.dataset.uid, sweetNext: sweet.nextElementSibling?.dataset.uid,
           niFirst: by("ni").querySelector(".dish.has-photo").dataset.uid };
});
for (const [label, p] of [["", m], ["on an iPhone, ", ip2 = await (async () => {
  const x = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  x.on("pageerror", (e) => errs.push("iphone-like 2: " + String(e).slice(0, 140)));
  await x.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(x);
  await x.addStyleTag({ content: "html,body{overflow-anchor:none !important}" });
  return x;
})()]]) {
  // The middle comes to rest in the gap between a course's dishes and its Reserve row.
  await toMiddle(p, more.sanLast);
  await p.evaluate(() => document.body.click());
  await p.evaluate(`(() => { const a = document.querySelector("#course-zen-san .course__acts").getBoundingClientRect();
    scrollTo({ top: scrollY + a.top - ${LINE} - 30, behavior: "instant" }); })()`);
  const gapMoved = await watchEl(p, "#course-zen-san .course__acts", 1000);
  pass(`${label}resting between a course's dishes and its Reserve row, the photo above closes and nothing moves`,
       (await shownAll(p)).length === 0 && gapMoved <= 2, `Reserve row moved ${gapMoved}px`);
  // A short list, where a whole group fits on the screen.
  await toMiddle(p, more.sweet);
  const sweetMoved = await jumpAndWatch(p, more.sweetNext);
  pass(`${label}in a short list (Zen Sweet), the photo before closes and the dish at the middle doesn't move`,
       (await shownAll(p)).length === 0 && sweetMoved <= 2, `moved ${sweetMoved}px`);
}
await ip2.context().close();

// A shortcut tapped while a photo is open above where it goes: it lands, and stays.
await toMiddle(m, more.niFirst);
await mchips.nth(6).tap(); await m.waitForTimeout(2600);
const chipLand = await m.evaluate(() => { const c = document.querySelector("#course-zen-sweet").getBoundingClientRect().top,
  bar = document.querySelector(".menu__jump").getBoundingClientRect().bottom; return Math.round(c - bar); });
const chipStay = await watchEl(m, "#course-zen-sweet", 800);
pass("a shortcut tapped with a photo open above where it goes lands under the bar, and stays",
     chipLand >= -2 && chipLand < 140 && chipStay <= 2, `heading ${chipLand}px under the bar; moved ${chipStay}px after`);

// A thumb resting on the boundary between two dishes doesn't make them flicker.
await toMiddle(m, uids.plain);
await m.evaluate(`(() => { const r = document.querySelector('[data-uid="${uids.plain}"] .dish__btn').getBoundingClientRect();
  scrollTo({ top: scrollY + r.bottom - ${LINE}, behavior: "instant" }); })()`);
await m.waitForTimeout(400);
await m.evaluate(() => { window.__flips = 0; let last = document.querySelector(".dish.is-lit")?.dataset.uid;
  new MutationObserver(() => { const now = document.querySelector(".dish.is-lit")?.dataset.uid; if (now !== last) { window.__flips++; last = now; } })
    .observe(document.querySelector(".menu__list"), { subtree: true, attributes: true, attributeFilter: ["class"] }); });
await m.mouse.move(190, 600);
for (let k = 0; k < 16; k++) { await m.mouse.wheel(0, k % 2 ? -3 : 3); await m.waitForTimeout(90); }
await m.waitForTimeout(400);
const flips = await m.evaluate(() => window.__flips);
pass("a thumb trembling on the boundary between two dishes doesn't make them flicker", flips <= 1, `${flips} changes of lit dish over 16 tremors`);

// Back from a course page lands where the guest left the menu, lighting nothing on the way.
// (Zen Ichi's last dish at the middle, so its "View Zen Ichi" link is on screen to tap as it is.)
const ichiLast = await m.evaluate(() => [...document.querySelectorAll("#course-zen-ichi .dish")].at(-1).dataset.uid);
await toMiddle(m, ichiLast);
const before = await atMiddle(m);
await m.locator(`#course-zen-ichi .course__acts a.link-arrow`).tap(); await m.waitForTimeout(1500);
await m.mouse.move(190, 600);
for (let k = 0; k < 5; k++) { await m.mouse.wheel(0, 120); await m.waitForTimeout(80); }
await m.goBack(); await m.waitForTimeout(2200);
const after = await atMiddle(m);
pass("Back from a course page comes back to the same dish at the middle", after === before, `${before} → ${after}`);

// From the recheck of the rebuilt spotlight.
// 1. On an iPhone a fast fling that only brushes a photo dish never bounces back to it.
{
  const fp = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  fp.on("pageerror", (e) => errs.push("iphone fling: " + String(e).slice(0, 140)));
  await fp.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(fp);
  await fp.addStyleTag({ content: "html,body{overflow-anchor:none !important}" });
  const yon10 = await fp.evaluate(() => [...document.querySelectorAll("#course-zen-yon .dish.has-photo")].at(-1).dataset.uid);
  await toMiddle(fp, yon10, -60);                                       // its name 60px below the middle
  await fp.evaluate(() => { window.__seq = []; new MutationObserver(() => { const u = document.querySelector(".dish.is-lit")?.dataset.uid;
    if (u && window.__seq.at(-1) !== u) window.__seq.push(u); }).observe(document.querySelector(".menu__list"), { subtree: true, attributes: true, attributeFilter: ["class"] }); });
  const cdp = await fp.context().newCDPSession(fp);
  await cdp.send("Input.synthesizeScrollGesture", { x: 190, y: 700, yDistance: -300, speed: 3000, gestureSourceType: "touch" });
  await fp.waitForTimeout(1500);
  const seq = await fp.evaluate(() => window.__seq);
  const back = seq.filter((u, i) => seq.indexOf(u) < i).length;
  pass("on an iPhone, a fast fling across a photo dish never bounces back to it", back === 0, seq.join(" > ") || "nothing lit");
  // 2. …and a shortcut tapped just after the page comes to rest still glides and lands.
  await toMiddle(fp, yon10);
  await fp.mouse.move(190, 600);
  for (let k = 0; k < 12; k++) { await fp.mouse.wheel(0, 40); await fp.waitForTimeout(40); }   // by hand: it waits, faded
  await fp.waitForTimeout(200);                                          // the page rests, it slides shut
  await fp.locator(".menu__jump .jump").nth(1).tap(); await fp.waitForTimeout(2600);
  const fpLand = await fp.evaluate(() => Math.round(document.querySelector("#course-zen-ichi").getBoundingClientRect().top
    - document.querySelector(".menu__jump").getBoundingClientRect().bottom));
  pass("on an iPhone, a shortcut tapped just after the page comes to rest still glides there", fpLand >= -2 && fpLand < 140, `heading ${fpLand}px under the bar`);
  await fp.context().close();
}

// 4. A photo's slide ends at its true height: no snap as it finishes.
{
  await m.evaluate(() => document.body.click());
  const u = uids.trio[0];
  for (let i = 0; i < 2; i++) {
    await m.evaluate(`(() => { const r = document.querySelector('[data-uid="${u}"] .dish__btn').getBoundingClientRect();
      scrollTo({ top: scrollY + (r.top + r.bottom) / 2 - ${LINE} + ${i ? 0 : 400}, behavior: "instant" }); })()`);
    await m.waitForTimeout(i ? 280 : 400);
  }
  const mid = await m.evaluate((u) => document.querySelector(`[data-uid="${u}"] .dish__drop`).style.height, u);   // mid-slide: the target, in px
  await m.waitForTimeout(700);
  const fin = await m.evaluate((u) => { const d = document.querySelector(`[data-uid="${u}"] .dish__drop`); return { style: d.style.height, h: d.getBoundingClientRect().height }; }, u);
  pass("a photo's slide ends at its true height, with no snap as it finishes",
       fin.style === "auto" && Math.abs(parseFloat(mid) - fin.h) <= 1, `slid to ${mid}, rests at ${fin.h.toFixed(1)}px`);
}

// 6. A shortcut tapped while the lit dish's photo is still opening lands where it should.
{
  await toMiddle(m, uids.plain);
  await m.evaluate(() => document.body.click());
  await m.evaluate(`(() => { const r = document.querySelector('[data-uid="${uids.trio[0]}"] .dish__btn').getBoundingClientRect();
    scrollTo({ top: scrollY + (r.top + r.bottom) / 2 - ${LINE}, behavior: "instant" }); })()`);
  await m.waitForTimeout(230);                                          // at rest it lights and starts opening…
  await mchips.nth(5).tap(); await m.waitForTimeout(2600);              // …and a shortcut is tapped mid-slide
  const midLand = await m.evaluate(() => Math.round(document.querySelector("#course-zen-yon").getBoundingClientRect().top
    - document.querySelector(".menu__jump").getBoundingClientRect().bottom));
  pass("a shortcut tapped while a photo is still opening lands where it should", midLand >= -2 && midLand < 20, `heading ${midLand}px under the bar`);
}

// 3. At the very bottom of a course page, the photo above closing moves nothing.
{
  const cp = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  cp.on("pageerror", (e) => errs.push("course page: " + String(e).slice(0, 140)));
  await cp.goto(B + "/en/courses/zen-yon/", { waitUntil: "domcontentloaded" }); await ready(cp);
  const last = await cp.evaluate(() => [...document.querySelectorAll(".dish.has-photo")].at(-1).dataset.uid);
  await toMiddle(cp, last);
  await cp.evaluate(() => document.body.click());
  await cp.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  const footMoved = await watchEl(cp, "footer", 1000);
  pass("at the very bottom of a course page, the photo above closing moves nothing", (await shownAll(cp)).length === 0 && footMoved <= 2,
       `footer moved ${footMoved}px`);
  await cp.context().close();
}

// 5. With reduced motion an open photo still fits its picture (it follows it, rather than a fixed height).
{
  const rm = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" })).newPage();
  rm.on("pageerror", (e) => errs.push("reduced motion: " + String(e).slice(0, 140)));
  await rm.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(rm);
  await toMiddle(rm, uids.trio[0]);
  const rmFit = await rm.evaluate((u) => { const d = document.querySelector(`[data-uid="${u}"] .dish__drop`);
    return { style: d.style.height, gap: Math.round(d.scrollHeight - d.getBoundingClientRect().height) }; }, uids.trio[0]);
  pass("with reduced motion, an open photo fits its picture", rmFit.style === "auto" && Math.abs(rmFit.gap) <= 1, `height ${rmFit.style}, ${rmFit.gap}px cut off`);
  await rm.context().close();
}

// On a tablet the dishes sit in two columns, and folding one photo re-balances
// them: a fold there must still move nothing on screen.
const tp = await (await b.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true })).newPage();
tp.on("pageerror", (e) => errs.push("tablet: " + String(e).slice(0, 140)));
await tp.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(tp);
await tp.addStyleTag({ content: "html,body{overflow-anchor:none !important}" });
await tp.locator(".course").nth(1).locator(".dish.has-photo .dish__btn").first().tap(); await tp.waitForTimeout(900);
const tBefore = await tp.evaluate(() => {
  const list = document.querySelector(".dish.is-shown").closest(".dishes");
  scrollTo({ top: scrollY + list.getBoundingClientRect().bottom + 250, behavior: "instant" });   // the whole list well past
  const c = Math.max(document.querySelector(".hdr").getBoundingClientRect().bottom,
                     document.querySelector(".menu__jump").getBoundingClientRect().bottom);
  window.__tref = [...document.querySelectorAll(".dish__name, .course__name")].find((el) => el.getBoundingClientRect().top > c + 20);
  return Math.round(window.__tref.getBoundingClientRect().top);
});
await tp.waitForTimeout(900);
const tAfter = await tp.evaluate(() => Math.round(window.__tref.getBoundingClientRect().top));
const tOpen = await tp.locator(".dish.is-shown").count();
pass("on a tablet (two columns of dishes), a fold moves nothing on screen", tOpen === 0 && Math.abs(tAfter - tBefore) <= 2,
     `${tOpen ? "still open; " : ""}reading position moved ${tAfter - tBefore}px`);
// …and there, where an opening photo would re-balance the columns, none opens by itself.
await tp.mouse.move(380, 700);
for (let k = 0; k < 30; k++) { await tp.mouse.wheel(0, 80); await tp.waitForTimeout(60); }
await tp.waitForTimeout(600);
pass("on a tablet (two columns), scrolling by hand opens no photo by itself", (await tp.locator(".dish.is-shown").count()) === 0);
await tp.context().close();

// A phone held sideways keeps one column: the lit dish's photograph is kept
// to a height that fits the screen under the header and the course bar.
const ls = await (await b.newContext({ viewport: { width: 667, height: 375 }, hasTouch: true, isMobile: true })).newPage();
ls.on("pageerror", (e) => errs.push("landscape: " + String(e).slice(0, 140)));
await ls.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(ls);
const lsCols = await ls.evaluate(() => getComputedStyle(document.querySelector(".dishes")).columnCount);
await toMiddle(ls, uids.trio[2]);                                   // Zen Ni's Uni shokupan: a tall photograph
const fit = await ls.evaluate(`(() => { const li = document.querySelector('[data-uid="${uids.trio[2]}"]');
  return { open: li.classList.contains("is-shown"), h: Math.round(li.querySelector(".dish__drop").getBoundingClientRect().height),
           room: Math.round(innerHeight - (${coverOf.toString()})()) }; })()`);
pass("on a phone held sideways, the lit dish's photograph fits the screen", fit.open && fit.h <= fit.room,
     `columns ${lsCols}; photo ${fit.h}px in ${fit.room}px`);
await ls.context().close();

// On a phone held sideways past 768px (two columns: tap to open), a tapped photo fits the screen too.
const sw = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage();
sw.on("pageerror", (e) => errs.push("sideways tap: " + String(e).slice(0, 140)));
await sw.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(sw);
const tall = `#course-zen-ni .dish.has-photo:nth-of-type(1)`;
const swUid = await sw.evaluate(() => [...document.querySelector("#course-zen-ni").querySelectorAll(".dish.has-photo")].at(-1).dataset.uid);
await sw.locator(`[data-uid="${swUid}"] .dish__btn`).scrollIntoViewIfNeeded();
await sw.locator(`[data-uid="${swUid}"] .dish__btn`).tap(); await sw.waitForTimeout(800);
const swFit = await sw.evaluate(`(() => { const s = document.querySelector('[data-uid="${swUid}"] .dish__shot img'); const c = (${coverOf.toString()})();
  return { h: s ? Math.round(s.getBoundingClientRect().height) : null, room: Math.round(innerHeight - c) }; })()`);
pass("tap-to-open on a phone held sideways (two columns): the photo fits the screen", swFit.h !== null && swFit.h <= swFit.room, `photo ${swFit.h}px in ${swFit.room}px`);
// Turned to portrait and back, that tapped photo doesn't come back by itself.
await sw.setViewportSize({ width: 390, height: 844 }); await sw.waitForTimeout(700);
await sw.setViewportSize({ width: 844, height: 390 }); await sw.waitForTimeout(700);
pass("turning the phone to portrait and back doesn't bring back a photo tapped open before",
     !(await sw.evaluate((u) => document.querySelector(`[data-uid="${u}"]`).classList.contains("is-shown"), swUid)));
await sw.context().close();

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

// 7. On a tablet (two columns), a tapped dish stays under the finger as the columns re-balance.
{
  const tb = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage();
  tb.on("pageerror", (e) => errs.push("tablet tap: " + String(e).slice(0, 140)));
  await tb.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(tb);
  const right = await tb.evaluate(() => {
    const photos = [...document.querySelectorAll(".dish.has-photo")];
    const r = photos.find((d) => d.getBoundingClientRect().left > innerWidth / 2 - 20);
    return r ? r.dataset.uid : null;
  });
  let tbMoved = null;
  if (right) {
    for (let i = 0; i < 2; i++) {
      await tb.evaluate((u) => { const r = document.querySelector(`[data-uid="${u}"] .dish__btn`).getBoundingClientRect();
        scrollTo({ top: scrollY + r.top - 150, behavior: "instant" }); }, right);
      await tb.waitForTimeout(350);
    }
    const t0 = await tb.evaluate((u) => document.querySelector(`[data-uid="${u}"] .dish__btn`).getBoundingClientRect().top, right);
    await tb.locator(`[data-uid="${right}"] .dish__btn`).tap(); await tb.waitForTimeout(600);
    const t1 = await tb.evaluate((u) => document.querySelector(`[data-uid="${u}"] .dish__btn`).getBoundingClientRect().top, right);
    tbMoved = Math.round((t1 - t0) * 10) / 10;
  }
  pass("on a tablet, a tapped dish in the right-hand column stays under the finger", tbMoved !== null && Math.abs(tbMoved) <= 2,
       right ? `${right} moved ${tbMoved}px` : "no right-column photo dish found");
  await tb.context().close();
}

// The narrowest phones still in use (320px) get the page without sideways scrolling.
for (const loc of ["en", "th"]) {
  const np = await (await b.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true })).newPage();
  np.on("pageerror", (e) => errs.push("320px: " + String(e).slice(0, 140)));
  await np.goto(`${B}/${loc}/`, { waitUntil: "domcontentloaded" }); await ready(np);
  const w = await np.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  pass(`at 320px wide, /${loc}/ doesn't scroll sideways`, w.sw <= w.cw, `${w.sw}px of content in ${w.cw}px`);
  await np.context().close();
}

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
await m.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(m);
await underBar(4); await m.waitForTimeout(500);
await m.setViewportSize({ width: 1440, height: 900 }); await m.waitForTimeout(1000);
const wide = await m.evaluate(() => {
  const cs = [...document.querySelectorAll(".course")];
  return { open: cs.flatMap((c, i) => (c.classList.contains("is-open") ? [i] : [])),
           top: Math.round(cs[4].getBoundingClientRect().top) };
});
pass("widening to a desktop keeps the course being read, in view", wide.open.join() === "4" && wide.top >= 0 && wide.top < 450,
     `open: ${wide.open.join(", ")}; that course at ${wide.top}px`);

// Before the script runs (a slow phone, a slow network), a phone must already
// show every course, so nothing opens late above the guest; a desktop, one.
// globals.css hides [hidden] with !important, which once made this rule inert
// while the #visit check above still passed on timing alone.
for (const [w, h, want] of [[390, 844, 7], [1440, 900, 1]]) {
  const pc = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 1024, hasTouch: w < 1024 });
  const pp = await pc.newPage();
  await pp.route("**/_next/static/**/*.js", (r) => r.abort());
  await pp.goto(B + "/en/", { waitUntil: "load" }); await pp.waitForTimeout(500);
  const shown = await pp.$$eval(".course__panel", (ps) => ps.filter((x) => getComputedStyle(x).display !== "none").length);
  pass(`before the script runs, ${w}px shows ${want === 1 ? "one course" : "every course"}`, shown === want, `${shown} of 7 showing`);
  await pc.close();
}

console.log("desktop, again");
await d.locator(".menu__jump .jump").nth(2).click(); await d.waitForTimeout(900);
const dOpen = await d.locator(".course.is-open").count();
pass("a desktop keeps one course open at a time", dOpen === 1, `${dOpen} open`);

console.log(errs.length ? "  JS errors:\n    " + errs.join("\n    ") : "  no JS errors");
await b.close();
process.exit(failed ? 1 : 0);
