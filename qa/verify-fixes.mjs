import { chromium } from "playwright";
const B = "http://localhost:4700/Suanzen-Omakase-Restaurant";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const pass = (n, ok, extra = "") => console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${extra ? "  — " + extra : ""}`);

await p.goto(B + "/en/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
await p.evaluate(async () => { document.documentElement.style.scrollBehavior="auto";
  for (let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} });
await p.waitForTimeout(1500);

// 1 · after-dark gap
const gap = await p.evaluate(() => {
  const h = document.querySelector("#after-dark h2"); const l = document.querySelector("#after-dark .u-lede");
  if (!h || !l) return null;
  return Math.round((l.getBoundingClientRect().top - h.getBoundingClientRect().bottom) * 10) / 10;
});
pass("after-dark heading/body no longer collide", gap !== null && gap > 5, `gap ${gap}px (was 0)`);

// 2 · rail images not natively draggable
const drag = await p.evaluate(() => {
  const i = document.querySelector(".rail img") || document.querySelector(".warm img");
  return i ? getComputedStyle(i).webkitUserDrag || "unset" : "no img";
});
pass("rail photos refuse the browser's image drag", drag === "none", `-webkit-user-drag: ${drag}`);

// 3 · gallery drag then click opens the lightbox
await p.locator(".rail").first().scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
const box = await p.locator(".rail__btn").first().boundingBox();
let opened = 0, panned = 0;
for (let t = 0; t < 4; t++) {
  const before = await p.evaluate(() => document.querySelector(".rail").scrollLeft);
  await p.mouse.move(box.x + 120, box.y + 80);
  await p.mouse.down();
  for (let i = 1; i <= 20; i++) { await p.mouse.move(box.x + 120 - i * 12, box.y + 80); await p.waitForTimeout(8); }
  await p.mouse.up();
  await p.waitForTimeout(350);
  const after = await p.evaluate(() => document.querySelector(".rail").scrollLeft);
  if (Math.abs(after - before) > 60) panned++;
  await p.locator(".rail__btn").first().click({ timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(600);
  if (await p.locator(".lb.is-open").count()) { opened++; await p.keyboard.press("Escape"); await p.waitForTimeout(400); }
}
pass("rail pans with the mouse", panned >= 3, `${panned}/4 (was 2/8)`);
pass("click after a drag still opens the lightbox", opened >= 3, `${opened}/4 (was 2/8)`);

// 4 · lightbox actually enlarges
await p.locator(".rail__btn").first().click();
await p.waitForTimeout(900);
const size = await p.evaluate(() => { const i = document.querySelector(".lb.is-open img");
  const r = i && i.getBoundingClientRect(); return r ? `${Math.round(r.width)}x${Math.round(r.height)}` : "none"; });
pass("lightbox enlarges the photo", parseInt(size) > 600, `${size} (was 300x200)`);

// 5 · clicking the surround closes it
await p.mouse.click(40, 40); await p.waitForTimeout(600);
pass("click outside closes the lightbox", (await p.locator(".lb.is-open").count()) === 0);

// 6 · warmth lightbox takes focus and traps Tab
await p.locator(".warm__btn").first().scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
await p.locator(".warm__btn").first().click(); await p.waitForTimeout(800);
const focused = await p.evaluate(() => document.activeElement?.className || "");
await p.keyboard.press("Tab"); await p.waitForTimeout(200);
const inLb = await p.evaluate(() => !!document.activeElement?.closest(".lb"));
pass("warmth lightbox takes focus", focused.includes("lb__"), `activeElement: ${focused.slice(0,24)}`);
pass("warmth lightbox traps Tab", inLb);
await p.keyboard.press("Escape");

// 7 · burger links reach 44px
const m = await b.newContext({ viewport: { width: 390, height: 844 } });
const mp = await m.newPage();
await mp.goto(B + "/en/", { waitUntil: "domcontentloaded" }); await mp.waitForTimeout(2500);
await mp.locator(".burger").click(); await mp.waitForTimeout(900);
const small = await mp.evaluate(() => [...document.querySelectorAll(".sheet__nav a")]
  .map(a => Math.round(a.getBoundingClientRect().height)).filter(h => h < 44));
pass("burger links meet 44px", small.length === 0, small.length ? `still small: ${small}` : "all >= 44px");
await b.close();
