import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:4321/en#gallery", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
console.log(await p.evaluate(() => {
  const el = document.querySelector('.rail');
  return JSON.stringify({
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    hidden: document.hidden,
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    scrollable: el.scrollWidth > el.clientWidth,
    overflowX: getComputedStyle(el).overflowX,
  }, null, 1);
}));
await b.close();
