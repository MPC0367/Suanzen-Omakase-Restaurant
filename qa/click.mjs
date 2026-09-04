import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on("console", m => { if (m.type()==="error") console.log("console error:", m.text().slice(0,120)); });
await p.goto("http://localhost:4321/en#gallery", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600);
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.getElementById('gallery').offsetTop + 200); });
await p.waitForTimeout(1200);

// what is actually on top at the button's centre?
const info = await p.evaluate(() => {
  const btn = document.querySelector('.rail__btn');
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  const stack = document.elementsFromPoint(cx, cy).slice(0,5).map(e => e.tagName+'.'+String(e.className).slice(0,26));
  return { rect: {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, stack, inView: r.top>=0 && r.bottom<=innerHeight };
});
console.log('button rect:', JSON.stringify(info.rect), 'fully in view:', info.inView);
console.log('stack at centre:', info.stack);

// click it directly through the DOM to isolate the handler from pointer geometry
await p.evaluate(() => document.querySelector('.rail__btn').click());
await p.waitForTimeout(600);
console.log('lightbox after programmatic click:', await p.locator('.lb.is-open').count());
await p.keyboard.press('Escape'); await p.waitForTimeout(400);

// now a real user click
await p.locator('.rail__btn').first().click({ timeout: 5000 }).catch(e => console.log('click threw:', String(e).slice(0,90)));
await p.waitForTimeout(700);
console.log('lightbox after real click:', await p.locator('.lb.is-open').count());
await b.close();
