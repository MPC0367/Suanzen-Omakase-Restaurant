import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:4321/en", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
for (const [name, sel, off] of [["counter", "#counter", -60], ["courses", "#courses", 260], ["afterdark", "#after-dark", -40], ["visit", "#visit", -60]]) {
  await p.evaluate(([s, o]) => window.scrollTo(0, document.querySelector(s).offsetTop + o), [sel, off]);
  await p.waitForTimeout(1400);
  const world = await p.evaluate(() => document.documentElement.dataset.world);
  await p.screenshot({ path: `qa/shots/vp_${name}.png` });
  console.log(name, "world=" + world);
}
await b.close();
