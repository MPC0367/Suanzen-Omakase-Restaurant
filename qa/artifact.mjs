import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on("pageerror", e => errs.push("pageerror: " + String(e).slice(0, 130)));
p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 130)); });

await p.goto("http://localhost:4600/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);

const shot = async (n) => p.screenshot({ path: `qa/shots/art_${n}.png` });

// images resolved?
console.log("images with a real src :", await p.evaluate(() =>
  [...document.querySelectorAll('img')].filter(i => i.currentSrc && i.naturalWidth > 20).length));
console.log("images still empty     :", await p.evaluate(() =>
  [...document.querySelectorAll('img')].filter(i => !i.getAttribute('src')).length));
console.log("courses                :", await p.locator(".course").count());
console.log("dishes in open course  :", await p.locator(".course.is-open .dish").count());
await shot("hero");

// menu: open Zen Yon, hover a dish
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.getElementById('courses').offsetTop + 180); });
await p.waitForTimeout(700);
await p.locator(".course__btn").nth(4).click();
await p.waitForTimeout(700);
const before = await p.locator("#stageImg").getAttribute("src");
await p.locator(".course.is-open .dish.has-photo").first().hover();
await p.waitForTimeout(700);
const after = await p.locator("#stageImg").getAttribute("src");
console.log("hover changes stage    :", before !== after, "| caption:", await p.locator("#stageCap").innerText());
await shot("menu");

// gallery drift + lightbox
await p.evaluate(() => window.scrollTo(0, document.getElementById('gallery').offsetTop + 200));
await p.mouse.move(5, 5);   // the rail pauses while pointed at — step away first
await p.waitForTimeout(1000);
const g1 = await p.evaluate(() => document.getElementById('galRail').scrollLeft);
await p.waitForTimeout(2200);
const g2 = await p.evaluate(() => document.getElementById('galRail').scrollLeft);
console.log("gallery drifts         :", g2 > g1, `(${Math.round(g1)} -> ${Math.round(g2)})`);
await p.locator("#galRail .rail__btn").first().click();
await p.waitForTimeout(700);
console.log("lightbox opens         :", await p.locator("#lb:not([hidden])").count() === 1, "|", await p.locator("#lbN").innerText());
await shot("lightbox");
await p.keyboard.press("Escape"); await p.waitForTimeout(400);

// language
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
await p.locator("#lang").click(); await p.waitForTimeout(900);
console.log("lang after toggle      :", await p.evaluate(() => document.documentElement.lang));
console.log("hero headline (th)     :", (await p.locator(".hero__h").innerText()).replace(/\n/g, " / "));
await shot("thai");
await p.locator("#lang").click(); await p.waitForTimeout(600);

console.log(errs.length ? "\nERRORS:\n  " + errs.join("\n  ") : "\nno JS errors");
await b.close();
