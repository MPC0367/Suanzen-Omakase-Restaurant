import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:4321/en", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3000);
await p.evaluate(async () => { document.documentElement.style.scrollBehavior='auto';
  for (let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} });
await p.waitForTimeout(800);
const r = await p.evaluate(() => {
  const out = { missingAttr: [], emptyAlt: [], withAlt: 0 };
  document.querySelectorAll('img').forEach(i => {
    if (!i.hasAttribute('alt')) out.missingAttr.push(i.currentSrc.slice(-30) + ' | ' + i.className);
    else if (i.alt.trim() === '') out.emptyAlt.push(i.currentSrc.slice(-30) + ' | ' + i.className);
    else out.withAlt++;
  });
  return out;
});
console.log('images WITH real alt   :', r.withAlt);
console.log('images with alt=""     :', r.emptyAlt.length, '(valid when decorative)');
r.emptyAlt.slice(0,10).forEach(x=>console.log('   ', x));
console.log('images MISSING the attr:', r.missingAttr.length, '<- a real defect');
r.missingAttr.forEach(x=>console.log('   ', x));
await b.close();
