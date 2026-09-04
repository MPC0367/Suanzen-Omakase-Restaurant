import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs=[]; p.on("pageerror", e=>errs.push(String(e).slice(0,120)));
await p.goto("http://localhost:4321/en#gallery", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600);
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.getElementById('gallery').offsetTop + 200); });
await p.waitForTimeout(1200);

const read = () => p.evaluate(() => {
  const el = document.querySelector('.rail');
  return { left: Math.round(el.scrollLeft), width: el.scrollWidth, items: el.querySelectorAll('.rail__item').length };
});
const a = await read();
await p.waitForTimeout(2500);
const bb = await read();
console.log('items rendered (2x for the loop):', a.items);
console.log('scrollLeft drifted:', a.left, '->', bb.left, bb.left > a.left ? 'MOVING' : 'NOT MOVING');

// hover should hold it
await p.locator('.rail').hover();
await p.waitForTimeout(300);
const c1 = await read();
await p.waitForTimeout(1800);
const c2 = await read();
console.log('paused while hovered:', Math.abs(c2.left - c1.left) < 3, `(${c1.left} -> ${c2.left})`);

// move away, it resumes
await p.mouse.move(20, 20);
await p.waitForTimeout(1800);
const d = await read();
console.log('resumed after leaving:', d.left !== c2.left);

// click still opens the lightbox
await p.locator('.rail__btn').first().click();
await p.waitForTimeout(700);
const lb = await p.locator('.lb.is-open').count();
console.log('click opens lightbox:', lb === 1);
const held = await read();
await p.waitForTimeout(1500);
const held2 = await read();
console.log('paused while lightbox open:', Math.abs(held2.left - held.left) < 3);
await p.keyboard.press('Escape');
await p.waitForTimeout(600);
console.log('escape closes:', (await p.locator('.lb.is-open').count()) === 0);
console.log(errs.length ? 'JS errors: '+errs.join(' | ') : 'no JS errors');
await b.close();
