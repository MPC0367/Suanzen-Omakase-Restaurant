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

// The dish photos, in the course the bar just brought into view (it has both kinds).
const c5 = m.locator(".course").nth(5);
await c5.locator(".dish:not(.has-photo) .dish__btn").first().tap(); await m.waitForTimeout(700);
pass("a dish with no photo of its own shows no picture", (await c5.locator(".dish:not(.has-photo) .dish__shot").count()) === 0);
await c5.locator(".dish.has-photo .dish__btn").first().tap(); await m.waitForTimeout(1000);
pass("a dish with its own photo opens it", (await c5.locator(".dish.has-photo.is-shown .dish__shot img").count()) === 1);

// An opened photo folds away once the guest scrolls past it, either way, and
// nothing on screen jumps when it does. iPhones have no scroll anchoring, so
// these run with it switched off, and with the page's own smooth scrolling on.
await m.addStyleTag({ content: "html,body{overflow-anchor:none !important}" });
await m.evaluate(() => { document.documentElement.style.scrollBehavior = ""; });
const shots = () => m.locator(".dish.is-shown .dish__shot").count();
const before = await m.evaluate(() => {
  const bar = document.querySelector(".menu__jump").getBoundingClientRect().bottom;
  const r = document.querySelector(".dish.is-shown").getBoundingClientRect();
  scrollTo({ top: scrollY + r.bottom - bar + 200, behavior: "instant" });        // 200px past it
  window.__ref = [...document.querySelectorAll(".dish__name, .course__name")]
    .find((el) => el.getBoundingClientRect().top > bar + 20);
  return Math.round(window.__ref.getBoundingClientRect().top);
});
await m.waitForTimeout(800);
const after = await m.evaluate(() => Math.round(window.__ref.getBoundingClientRect().top));
pass("an opened photo folds away once scrolled past", (await shots()) === 0);
pass("nothing on screen moves when it folds", Math.abs(after - before) <= 2, `reading position moved ${after - before}px`);
await c5.locator(".dish.has-photo .dish__btn").first().tap(); await m.waitForTimeout(900);
await m.evaluate(() => {
  const r = document.querySelector(".dish.is-shown").getBoundingClientRect();
  scrollTo({ top: scrollY + r.top - innerHeight - 300, behavior: "instant" });   // back up, past it
});
await m.waitForTimeout(600);
pass("it folds away when scrolled back up past it too", (await shots()) === 0);
await c5.locator(".dish.has-photo .dish__btn").first().tap(); await m.waitForTimeout(900);
await m.evaluate(() => scrollBy({ top: 60, behavior: "instant" })); await m.waitForTimeout(600);
pass("it stays open while any of it is on screen", (await shots()) === 1);

// A photo opened before the course bar has pinned itself must not fold while
// any of it is still on screen (it once did, on a measurement taken at open).
await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(600);
await m.locator(".course:has(.dish.has-photo)").first().locator(".dish.has-photo .dish__btn").first().tap(); await m.waitForTimeout(900);
let early = null, folded = false;
for (let k = 0; k < 90 && !folded; k++) {
  const outOfSight = await m.evaluate(() => {
    scrollBy({ top: 30, behavior: "instant" });
    const li = document.querySelector(".dish.is-shown");
    const c = Math.max(document.querySelector(".hdr").getBoundingClientRect().bottom,
                       document.querySelector(".menu__jump").getBoundingClientRect().bottom);
    return li ? li.getBoundingClientRect().bottom <= c : null;
  });
  await m.waitForTimeout(260);
  if (!(await shots())) { folded = true; if (!outOfSight) early = k; }
}
pass("a photo opened before the bar pins folds only once out of sight", folded && early === null,
     !folded ? "never folded" : early === null ? "" : `folded while still visible, step ${early}`);

// Closing a course with a photo open in it must not leave anything switched off.
await m.locator(".course").nth(1).locator(".dish.has-photo .dish__btn").first().tap(); await m.waitForTimeout(900);
await m.locator(".course").nth(1).locator(".course__btn").tap(); await m.waitForTimeout(700);
await m.evaluate(() => scrollBy({ top: 5, behavior: "instant" })); await m.waitForTimeout(500);
const anchorStyle = await m.evaluate(() => document.documentElement.style.overflowAnchor);
pass("closing a course with a photo open leaves scrolling as it was", anchorStyle === "", `overflow-anchor inline: '${anchorStyle}'`);
await m.locator(".course").nth(1).locator(".course__btn").tap(); await m.waitForTimeout(500);

// Scrolling by hand opens each dish's own photo as the dish reaches the middle
// of the screen, with the picture landing in the middle, and folds it away again
// once scrolled past. A tapped shortcut sweeping past the same dishes opens none.
const coverOf = () => Math.max(document.querySelector(".hdr").getBoundingClientRect().bottom,
                               document.querySelector(".menu__jump").getBoundingClientRect().bottom);
await m.evaluate(() => document.querySelectorAll(".dish.is-shown .dish__btn").forEach((x) => x.click()));
await m.waitForTimeout(400);
const autoName = await m.evaluate(() => {
  const li = document.querySelector(".course.is-open .dish.has-photo");
  const r = li.querySelector(".dish__btn").getBoundingClientRect();
  scrollTo({ top: scrollY + r.top - innerHeight + 40, behavior: "instant" });   // its name just up from the bottom edge
  li.dataset.auto = "1";
  return li.querySelector(".dish__name").textContent.trim();
});
await m.waitForTimeout(500);
await m.mouse.move(180, 600);
let autoAt = null;
for (let k = 0; k < 60 && !autoAt; k++) {
  await m.mouse.wheel(0, 30); await m.waitForTimeout(80);
  autoAt = await m.evaluate(`(${(() => {
    const li = document.querySelector('[data-auto="1"]');
    if (!li.classList.contains("is-shown")) return null;
    return { step: true };
  }).toString()})()`);
}
await m.waitForTimeout(1200);   // the page settles and the picture loads
const centred = autoAt && await m.evaluate(`(() => {
  const coverOf = ${coverOf.toString()};
  const s = document.querySelector('[data-auto="1"] .dish__shot').getBoundingClientRect();
  return { off: Math.round((s.top + s.bottom) / 2 - (coverOf() + innerHeight) / 2), h: Math.round(s.height) };
})()`);
pass("scrolling by hand opens a dish's photo as it reaches the middle of the screen", !!autoAt, autoAt ? autoName : `${autoName}: never opened`);
pass("…with the picture in the middle of the screen", !!centred && Math.abs(centred.off) <= 70,
     centred ? `${centred.off}px from the middle, ${centred.h}px tall` : "");
for (let k = 0; k < 80; k++) {
  await m.mouse.wheel(0, 60); await m.waitForTimeout(60);
  const past = await m.evaluate(`(() => { const coverOf = ${coverOf.toString()};
    return document.querySelector('[data-auto="1"]').getBoundingClientRect().bottom <= coverOf() - 40; })()`);
  if (past) break;
}
await m.waitForTimeout(1000);
pass("…and folds it away again once scrolled past", (await m.locator('[data-auto="1"].is-shown').count()) === 0);
await m.evaluate(() => document.querySelectorAll(".dish.is-shown .dish__btn").forEach((x) => x.click()));
await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(600);
await m.mouse.wheel(0, 10); await m.waitForTimeout(300);       // the guest has been scrolling by hand…
await mchips.nth(5).tap(); await m.waitForTimeout(2800);       // …then taps a course far down the bar
const swept = await m.evaluate(() => {
  const c = document.querySelectorAll(".course")[5];
  return { open: document.querySelectorAll(".dish.is-shown").length, top: Math.round(c.getBoundingClientRect().top),
           bar: Math.round(document.querySelector(".menu__jump").getBoundingClientRect().bottom) };
});
pass("a shortcut sweeping past dishes opens none of their photos, and still lands", swept.open === 0 && swept.top >= swept.bar - 2 && swept.top < swept.bar + 140,
     `${swept.open} open; course at ${swept.top}px, bar ends ${swept.bar}px`);

// Scrolling back up past a dish opens nothing: the part below its name is what
// the guest has just read, and a picture opening there would shove it down.
await m.evaluate(() => {
  const r = document.querySelectorAll(".course")[2].querySelector(".dish.has-photo .dish__btn").getBoundingClientRect();
  scrollTo({ top: scrollY + r.top - 150, behavior: "instant" });   // Zen Ni's first photo dish near the top, above its line
});
await m.waitForTimeout(600); await m.mouse.move(180, 600);
for (let k = 0; k < 16; k++) { await m.mouse.wheel(0, -40); await m.waitForTimeout(70); }
await m.waitForTimeout(500);
pass("scrolling back up past photo dishes opens none of them", (await m.locator(".dish.is-shown").count()) === 0,
     `${await m.locator(".dish.is-shown").count()} open`);

// Bring an element to a given distance under the header and course bar. In two
// steps: the page below settles as it comes into view, so a single jump from
// far away can land off.
const placeAt = async (selectorJs, below) => {
  // A jump by the test, like a tapped shortcut's: not the guest scrolling by hand.
  await m.evaluate(() => document.body.click());
  for (let i = 0; i < 2; i++) {
    await m.evaluate(`(() => { const coverOf = ${coverOf.toString()}; const el = ${selectorJs};
      scrollTo({ top: scrollY + el.getBoundingClientRect().top - coverOf() - ${below}, behavior: "instant" }); })()`);
    await m.waitForTimeout(350);
  }
};

// A photo opened by a tap pushes the dishes below it down without any
// scrolling; the next small scroll must not pop one of them open off the middle.
const tapShift = await m.evaluate(() => {
  const [first, second] = [...document.querySelectorAll(".course")[2].querySelectorAll(".dish.has-photo")];
  first.dataset.tapfirst = "1"; second.dataset.shift = "1";
  return [first, second].map((li) => li.querySelector(".dish__name").textContent.trim());
});
await placeAt(`document.querySelector('[data-tapfirst="1"] .dish__btn')`, 30);
const shiftSetup = await m.evaluate(`(() => { const coverOf = ${coverOf.toString()};
  return Math.round(document.querySelector('[data-shift="1"] .dish__btn').getBoundingClientRect().bottom - coverOf()); })()`);
await m.locator(".course").nth(2).locator(".dish.has-photo .dish__btn").first().tap(); await m.waitForTimeout(700);
await m.mouse.move(180, 600); await m.mouse.wheel(0, 30); await m.waitForTimeout(500);
const popped = (await m.locator('[data-shift="1"].is-shown').count()) === 1;
let shiftOpen = null;
for (let k = 0; k < 60 && !shiftOpen; k++) {
  await m.mouse.wheel(0, 30); await m.waitForTimeout(80);
  if ((await m.locator('[data-shift="1"].is-shown').count()) === 1) {
    await m.waitForTimeout(900);
    shiftOpen = await m.evaluate(`(() => { const coverOf = ${coverOf.toString()};
      const s = document.querySelector('[data-shift="1"] .dish__shot').getBoundingClientRect();
      return Math.round((s.top + s.bottom) / 2 - (coverOf() + innerHeight) / 2); })()`);
  }
}
pass("a photo opened by a tap doesn't pop the next one open off the middle", !popped && shiftOpen !== null && Math.abs(shiftOpen) <= 70,
     `${tapShift.join(" → ")} (its name ${shiftSetup}px under the bar before the tap): ${popped ? "popped open on a 30px nudge" : shiftOpen === null ? "never opened" : `opened ${shiftOpen}px from the middle`}`);

// Photos in two courses folding away together give back both their heights.
// A finger resting on the glass holds every fold; when it lifts, each photo out
// of sight folds at the same moment — here Zen Ichi's and Zen Ni's.
await m.evaluate(() => document.querySelectorAll(".dish.is-shown .dish__btn").forEach((x) => x.click()));
await m.waitForTimeout(400);
for (const ci of [1, 2]) {
  await placeAt(`document.querySelectorAll(".course")[${ci}].querySelector(".dish.has-photo .dish__btn")`, 40);
  await m.evaluate((ci) => document.querySelectorAll(".course")[ci].querySelector(".dish.has-photo .dish__btn").click(), ci);
  await m.waitForTimeout(400);
  if (ci === 1) await m.evaluate(() => window.dispatchEvent(new Event("touchstart")));   // the finger goes down
}
const multiBefore = await m.evaluate(`(() => { const coverOf = ${coverOf.toString()};
  const open = [...document.querySelectorAll(".dish.is-shown")];
  const lowest = Math.max(...open.map((li) => li.getBoundingClientRect().bottom));
  scrollTo({ top: scrollY + lowest - coverOf() + 300, behavior: "instant" });   // both out of sight above
  return open.length;
})()`);
await m.waitForTimeout(500);                                                     // still held: nothing folds
const heldOpen = await m.locator(".dish.is-shown").count();
const multiTop = await m.evaluate(`(() => { const coverOf = ${coverOf.toString()};
  window.__mref = [...document.querySelectorAll(".dish__name, .course__name")].find((el) => el.getBoundingClientRect().top > coverOf() + 20);
  window.dispatchEvent(new Event("touchend"));                                   // the finger lifts
  return Math.round(window.__mref.getBoundingClientRect().top); })()`);
await m.waitForTimeout(1000);
const multiAfter = await m.evaluate(() => ({ open: document.querySelectorAll(".dish.is-shown").length, top: Math.round(window.__mref.getBoundingClientRect().top) }));
const multiBefore_ = { n: multiBefore, top: multiTop };
pass("photos in two courses folding together move nothing on screen",
     multiBefore_.n === 2 && heldOpen === 2 && multiAfter.open === 0 && Math.abs(multiAfter.top - multiBefore_.top) <= 2,
     `${multiBefore_.n} open, ${heldOpen} held under the finger → ${multiAfter.open}; reading position moved ${multiAfter.top - multiBefore_.top}px`);

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

// A phone held sideways keeps one column, but a photo there is taller than
// the screen: it would open with its name at the top edge and run on for
// screens, so none opens by itself (a tap still opens it).
const ls = await (await b.newContext({ viewport: { width: 667, height: 375 }, hasTouch: true, isMobile: true })).newPage();
ls.on("pageerror", (e) => errs.push("landscape: " + String(e).slice(0, 140)));
await ls.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(ls);
const lsCols = await ls.evaluate(() => getComputedStyle(document.querySelector(".dishes")).columnCount);
await ls.mouse.move(330, 250);
for (let k = 0; k < 60; k++) { await ls.mouse.wheel(0, 120); await ls.waitForTimeout(50); }
await ls.waitForTimeout(500);
pass("on a phone held sideways, a photo too tall for the screen doesn't open by itself",
     (await ls.locator(".dish.is-shown").count()) === 0, `dish columns: ${lsCols}`);
await ls.context().close();

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
