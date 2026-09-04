import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on("pageerror", e => errs.push(String(e).slice(0,140)));
await p.goto("http://localhost:4321/en#courses", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.getElementById('courses').offsetTop + 200); });
await p.waitForTimeout(1000);

const rows = await p.locator(".course").count();
console.log("course rows:", rows);
const open0 = await p.locator(".course").first().getAttribute("class");
console.log("first course open by default:", open0.includes("is-open"));

// count dishes in the open course
const dishes = await p.locator(".course.is-open .dish").count();
console.log("dishes visible in open course:", dishes);

// hover a dish that has a photo, check the stage image changes
const before = await p.locator(".menu__img").getAttribute("src").catch(()=>null);
const withPhoto = p.locator(".course.is-open .dish.has-photo").first();
const n = await p.locator(".course.is-open .dish.has-photo").count();
console.log("dishes with their own photo in this course:", n);
await withPhoto.hover();
await p.waitForTimeout(900);
const after = await p.locator(".menu__img").getAttribute("src").catch(()=>null);
console.log("stage image changed on hover:", before !== after, "\n  before:", (before||'').slice(-28), "\n  after :", (after||'').slice(-28));
await p.screenshot({ path: "qa/shots/menu_hover.png" });

// open a different course
await p.locator(".course__btn").nth(4).click();
await p.waitForTimeout(900);
const openCount = await p.locator(".course.is-open").count();
const yonDishes = await p.locator(".course.is-open .dish").count();
console.log("after clicking Zen Yon — open courses:", openCount, "dishes:", yonDishes);
await p.evaluate(() => window.scrollBy(0, -260));
await p.waitForTimeout(500);
await p.screenshot({ path: "qa/shots/menu_yon.png" });
console.log(errs.length ? "JS errors: " + errs.join(" | ") : "no JS errors");
await b.close();
