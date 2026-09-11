import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs=[]; p.on("pageerror", e=>errs.push(String(e).slice(0,120)));
p.on("console", m=>{ if(m.type()==="error") errs.push("console: "+m.text().slice(0,120)); });
const BASE="http://localhost:4400";

await p.goto(BASE+"/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);
console.log("root redirects to:", new URL(p.url()).pathname);

await p.goto(BASE+"/en/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3000);
console.log("photos loaded:", await p.evaluate(() => [...document.querySelectorAll('img')].filter(i=>i.naturalWidth>50).length));
console.log("hero alt:", (await p.locator('.hero__media img').first().getAttribute('alt') || '').slice(0,50));

// courses still open and hover
await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,document.getElementById('courses').offsetTop+200)});
await p.waitForTimeout(900);
await p.locator('.course__btn').nth(4).click(); await p.waitForTimeout(700);
console.log("course dropdown dishes:", await p.locator('.course.is-open .dish').count());

// gallery autoscroll
await p.evaluate(()=>window.scrollTo(0,document.getElementById('gallery').offsetTop+200));
await p.waitForTimeout(1200);
const a=await p.evaluate(()=>document.querySelector('.rail').scrollLeft);
await p.waitForTimeout(2200);
const c=await p.evaluate(()=>document.querySelector('.rail').scrollLeft);
console.log("gallery drifting:", c>a, `(${Math.round(a)} -> ${Math.round(c)})`);
await p.locator('.rail__btn').first().click(); await p.waitForTimeout(700);
console.log("gallery click opens:", (await p.locator('.lb.is-open').count())===1);
await p.keyboard.press('Escape');

// reserving goes straight to LINE — the brochure has no form anywhere
console.log("LINE links on the page:", await p.locator('a[href*="lin.ee"]').count());
console.log("forms on the page:", await p.locator("form").count());
console.log(errs.length ? "\nERRORS: "+errs.join(" | ") : "\nno JS/console errors");
await b.close();
