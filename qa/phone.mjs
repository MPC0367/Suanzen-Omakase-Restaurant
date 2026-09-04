import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
for (const [name, url, scroll] of [
  ["hero", "/en", 0],
  ["hero_th", "/th", 0],
  ["book", "/en/book", 0],
  ["ig", "/en/instagram", 300],
]) {
  await p.goto("http://localhost:4321" + url, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(url.includes("instagram") ? 9000 : 2600);
  if (scroll) await p.evaluate((y) => window.scrollTo(0, y), scroll);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `qa/shots/ph_${name}.png` });
  console.log("captured", name);
}
await b.close();
