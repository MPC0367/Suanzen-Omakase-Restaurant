import { chromium } from "playwright";
const B = "http://localhost:4700/Suanzen-Omakase-Restaurant";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const pass = (n, ok, x = "") => console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`);

// 1 · present in the server HTML with the logo, before any JS
const html = await (await fetch(B + "/en/")).text();
pass("curtain ships in the HTML", html.includes('class="curtain'));
pass("it carries the restaurant's logo", /curtain__mark[\s\S]{0,400}logo-512\.jpg/.test(html));

// 2 · on first load: visible, then lifts, and never blocks a click
await p.goto(B + "/en/", { waitUntil: "domcontentloaded" });
const early = await p.evaluate(() => {
  const c = document.querySelector(".curtain");
  return c ? { op: getComputedStyle(c).opacity, pe: getComputedStyle(c).pointerEvents } : null;
});
pass("visible on first paint", early && early.op === "1", early ? `opacity ${early.op}` : "absent");
pass("never takes pointer events", early && early.pe === "none");

const t0 = Date.now();
await p.waitForFunction(() => !document.querySelector(".curtain"), null, { timeout: 6000 }).catch(() => {});
pass("lifts on its own", !(await p.locator(".curtain").count()), `gone at ${Date.now() - t0}ms`);

// nav must be clickable immediately
await p.goto(B + "/en/", { waitUntil: "domcontentloaded" });
const navOk = await p.evaluate(() => {
  const a = document.querySelector(".hdr__nav a"); if (!a) return false;
  const r = a.getBoundingClientRect();
  const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return !!top && (a.contains(top) || top === a);
});
pass("navigation clickable while the curtain is up", navOk);

// 3 · on a move between pages
await p.waitForTimeout(1600);
await p.locator('a[href$="/en/book/"]').first().click();
await p.waitForTimeout(120);
pass("raised when moving to another page", (await p.locator(".curtain").count()) === 1);

// 4 · on the change of language
await p.waitForTimeout(1800);
await p.locator(".lang").click();
await p.waitForTimeout(120);
pass("raised when switching Thai / English", (await p.locator(".curtain").count()) === 1);
await p.waitForTimeout(1600);
pass("lands on the Thai page", p.url().includes("/th/"), p.url().split("Restaurant")[1]);
await b.close();
