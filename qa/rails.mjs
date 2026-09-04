import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs=[]; p.on("pageerror", e=>errs.push(String(e).slice(0,110)));
await p.goto("http://localhost:4321/en", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2800);
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; });

for (const [name, sec, btn] of [["warmth","room",".warm__btn"],["gallery","gallery",".rail__btn"]]) {
  await p.evaluate((s)=>window.scrollTo(0, document.getElementById(s).offsetTop + 260), sec);
  await p.waitForTimeout(1100);
  await p.locator(btn).first().click({ timeout: 4000 }).catch(e=>console.log(name,"click threw"));
  await p.waitForTimeout(700);
  const openCount = await p.locator(".lb.is-open").count();
  const cap = await p.locator(".lb__cap").innerText().catch(()=> "");
  console.log(`${name.padEnd(8)} click opens lightbox: ${openCount===1}   caption: "${cap.slice(0,58)}"`);
  // arrow key navigation
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(450);
  const cap2 = await p.locator(".lb__cap").innerText().catch(()=> "");
  console.log(`         arrow advances: ${cap2 !== cap}`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(450);
  console.log(`         escape closes: ${(await p.locator(".lb.is-open").count())===0}`);
}
console.log(errs.length ? "JS errors: "+errs.join(" | ") : "no JS errors");
await b.close();
