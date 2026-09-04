import { chromium } from "playwright";
const b = await chromium.launch();
for (const [name, vw, vh] of [["desk", 1440, 900], ["phone", 390, 844]]) {
  const p = await (await b.newContext({ viewport: { width: vw, height: vh } })).newPage();
  const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 110)));
  await p.goto("http://localhost:4600/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600);
  await p.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 500));
  });
  // horizontal overflow?
  const of = await p.evaluate(() => {
    const de = document.documentElement;
    const wide = [...document.querySelectorAll('body *')]
      .filter(el => el.getBoundingClientRect().right > de.clientWidth + 2)
      .slice(0, 4).map(el => el.tagName + '.' + String(el.className).slice(0, 30));
    return { s: de.scrollWidth, c: de.clientWidth, wide };
  });
  console.log(`[${name}] overflow: ${of.s > of.c + 2 ? 'YES ' + JSON.stringify(of.wide) : 'none'}  errors: ${errs.length || 'none'}`);
  await p.screenshot({ path: `qa/shots/art_${name}_full.png`, fullPage: true });
  await p.close();
}
await b.close();
