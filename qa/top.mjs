import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:4321/en", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3200);
await p.screenshot({ path: "qa/shots/vp_hero.png" });
// scroll to the warmth section
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; const el=document.getElementById('room'); if(el) window.scrollTo(0, el.offsetTop + 320); });
await p.waitForTimeout(1400);
await p.screenshot({ path: "qa/shots/vp_warmth.png" });
await p.evaluate(() => { const el=document.getElementById('alacarte'); if(el) window.scrollTo(0, el.offsetTop - 40); });
await p.waitForTimeout(1000);
await p.screenshot({ path: "qa/shots/vp_ala.png" });
console.log("captured");
await b.close();
