import { chromium } from "playwright";
const B = "http://localhost:4700/Suanzen-Omakase-Restaurant";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const pass = (n, ok, x = "") => console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`);
await p.goto(B + "/en/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600);
await p.evaluate(async () => { document.documentElement.style.scrollBehavior="auto";
  for (let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} });
await p.mouse.move(10, 10);
await p.waitForTimeout(1200);

for (const [sel, name] of [[".warm", "warmth rail (people)"], [".rail", "night gallery"]]) {
  const a = await p.evaluate((s) => document.querySelector(s)?.scrollLeft ?? -1, sel);
  await p.waitForTimeout(3000);
  const c = await p.evaluate((s) => document.querySelector(s)?.scrollLeft ?? -1, sel);
  pass(`${name} drifts on its own`, c - a > 25, `${Math.round(c - a)}px over 3s`);
}

// the loop must be seamless: track rendered twice
const dup = await p.evaluate(() => {
  const n = document.querySelectorAll(".warm__item").length;
  const clones = document.querySelectorAll('.warm__item[aria-hidden="true"]').length;
  return { n, clones };
});
pass("warmth track duplicated for a seamless loop", dup.clones > 0 && dup.n === dup.clones * 2,
     `${dup.n} items, ${dup.clones} hidden clones`);

// clicking a people photo still opens its lightbox
await p.locator(".warm__btn").first().click();
await p.waitForTimeout(800);
pass("people photo still opens", (await p.locator(".lb.is-open").count()) === 1);
const sz = await p.evaluate(() => { const i = document.querySelector(".lb.is-open img");
  const r = i && i.getBoundingClientRect(); return r ? `${Math.round(r.width)}x${Math.round(r.height)}` : "none"; });
pass("and it is actually enlarged", parseInt(sz) > 500, sz);
await p.keyboard.press("Escape");
await b.close();
