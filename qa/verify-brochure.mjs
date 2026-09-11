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
const first = await m.locator(".course__btn").first().boundingBox();
pass("the first course is on the first screen", !!first && first.y + first.height <= 844,
     first ? `its header ends at ${Math.round(first.y + first.height)}px of 844` : "no course");
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
