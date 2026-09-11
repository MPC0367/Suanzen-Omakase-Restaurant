/**
 * The brochure's contract: menu first, one-way, unlisted, easy on a phone.
 *   node qa/verify-brochure.mjs [base]      default http://localhost:4324
 */
import { chromium } from "playwright";
const B = process.argv[2] || "http://localhost:4324";
const b = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const errs = [];
let failed = 0;
const pass = (n, ok, x = "") => { if (!ok) failed++; console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const ready = (p) => p.waitForFunction(() => !document.querySelector(".curtain"), null, { timeout: 25000 });

/* ── desktop ─────────────────────────────────────────────────────────────── */
const d = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
d.on("pageerror", (e) => errs.push("desktop: " + String(e).slice(0, 140)));
await d.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(d);
console.log("desktop");
const nav = await d.$$eval(".hdr__nav a", (as) => as.map((a) => a.textContent.trim()));
pass("header nav is three stops", nav.join("|") === "Menu|Gallery|Visit", nav.join(" · "));
pass("no form anywhere", (await d.locator("form").count()) === 0);
pass("nothing links to a booking page", (await d.locator('a[href*="/book"]').count()) === 0);
const robots = await d.$eval('meta[name="robots"]', (m) => m.content).catch(() => "none");
pass("asks search engines not to list it", /noindex/.test(robots), robots);
const ids = await d.$$eval("main > section", (ss) => ss.map((s) => s.id || s.classList[1] || s.classList[0]));
pass("the menu comes straight after the opening", ids[1] === "courses", ids.slice(0, 4).join(" → "));
const cta = await d.$eval(".hero__acts a", (a) => ({ href: a.getAttribute("href"), text: a.textContent.trim() }));
pass("the opening's main button goes to the menu", cta.href.endsWith("#courses"), `"${cta.text}"`);
await d.locator(".hdr__cta").click(); await d.waitForTimeout(700);
const line = await d.locator(".res.is-open .res__line").getAttribute("href").catch(() => null);
pass("Reserve opens the LINE panel", !!line && line.includes("lin.ee"), line || "no panel");
await d.locator(".res__x").click().catch(() => {}); await d.waitForTimeout(500);

const chips = d.locator(".menu__jump .jump");
pass("seven course shortcuts", (await chips.count()) === 7);
await d.evaluate(() => document.getElementById("courses").scrollIntoView()); await d.waitForTimeout(600);
const want = (await chips.nth(4).locator(".jump__name").textContent()).trim();
await chips.nth(4).click(); await d.waitForTimeout(1300);
const got = await d.evaluate(() => {
  const o = document.querySelector(".course.is-open");
  return o ? { name: o.querySelector(".course__name")?.textContent.trim(), top: Math.round(o.getBoundingClientRect().top) } : null;
});
pass("a shortcut opens its course and brings it into view", !!got && got.name === want && got.top >= 0 && got.top < 240,
     got ? `${got.name} at ${got.top}px` : "nothing open");
await d.screenshot({ path: "qa/shots/brochure-menu-desktop.png" });
await d.evaluate(() => scrollTo(0, 0)); await d.waitForTimeout(500);
await d.screenshot({ path: "qa/shots/brochure-hero-desktop.png" });

await d.goto(B + "/th/", { waitUntil: "domcontentloaded" }); await ready(d);
const thNav = await d.$$eval(".hdr__nav a", (as) => as.map((a) => a.textContent.trim()));
const thCta = await d.$eval(".hero__acts a", (a) => a.textContent.trim());
pass("Thai: nav leads with the menu", thNav[0] === "เมนู", thNav.join(" · "));
pass("Thai: opening button", thCta === "ดูเมนู", thCta);

/* ── phone ───────────────────────────────────────────────────────────────── */
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
m.on("pageerror", (e) => errs.push("phone: " + String(e).slice(0, 140)));
await m.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await ready(m);
console.log("phone");
await m.screenshot({ path: "qa/shots/brochure-hero-phone.png" });
await m.locator(".burger").tap(); await m.waitForTimeout(900);
const sheet = await m.$$eval(".sheet__nav a", (as) => as.map((a) => a.textContent.replace(/[0-9]/g, "").trim()));
pass("phone menu: three stops", sheet.length === 3, sheet.join(" · "));
pass("phone menu: Reserve on LINE", (await m.locator('.sheet a[href*="lin.ee"]').count()) >= 1);
await m.locator(".burger").tap(); await m.waitForTimeout(700);

await m.evaluate(() => document.getElementById("courses").scrollIntoView()); await m.waitForTimeout(900);
const open = m.locator(".course.is-open");
await open.locator(".dish:not(.has-photo) .dish__btn").first().tap(); await m.waitForTimeout(700);
pass("phone: a dish with no photo of its own shows no picture", (await open.locator(".dish:not(.has-photo) .dish__shot").count()) === 0);
await open.locator(".dish.has-photo .dish__btn").first().tap(); await m.waitForTimeout(1000);
pass("phone: a dish with its own photo opens it", (await open.locator(".dish.has-photo.is-shown .dish__shot img").count()) === 1);
await m.screenshot({ path: "qa/shots/brochure-menu-phone.png" });

console.log(errs.length ? "  JS errors:\n    " + errs.join("\n    ") : "  no JS errors");
await b.close();
process.exit(failed ? 1 : 0);
