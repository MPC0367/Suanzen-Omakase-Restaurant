import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:4321/en#courses", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.getElementById('courses').offsetTop + 200); });
await p.waitForTimeout(800);
// open Zen Yon (most photographed)
await p.locator(".course__btn").nth(4).click();
await p.waitForTimeout(800);
const list = p.locator(".course.is-open .dish.has-photo");
const n = await list.count();
console.log("Zen Yon dishes with photos:", n);
const seen = [];
for (let i = 0; i < Math.min(n, 6); i++) {
  const name = await list.nth(i).innerText();
  await list.nth(i).hover();
  await p.waitForTimeout(700);
  const src = await p.locator(".menu__img").getAttribute("src").catch(()=>null);
  const cap = await p.locator(".menu__caption").innerText().catch(()=>'');
  const file = (src||'').match(/([0-9a-f]{12})\.jpg/)?.[1] || 'none';
  seen.push(file);
  console.log(`  ${name.replace(/\n/g,' ').slice(0,34).padEnd(36)} -> ${file}  cap="${cap}"`);
}
console.log("distinct images shown:", new Set(seen).size, "of", seen.length);
await p.screenshot({ path: "qa/shots/menu_hover.png" });
await b.close();
