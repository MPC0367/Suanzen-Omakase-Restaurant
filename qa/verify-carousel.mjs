import { chromium } from "playwright";
const B = "http://localhost:4700/Suanzen-Omakase-Restaurant";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
const pass = (n, ok, x = "") => console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`);

await p.goto(B + "/en/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600);
await p.evaluate(() => { document.documentElement.style.scrollBehavior="auto";
  document.querySelector(".social")?.scrollIntoView({ block: "center" }); });
await p.waitForTimeout(9000);

const cards = await p.locator(".igcar__track .live").count();
pass("carousel holds every post", cards === 12, `${cards} cards`);

const left = p.locator(".igcar__btn").first(), right = p.locator(".igcar__btn").last();
pass("left arrow disabled at the start", await left.isDisabled());
pass("right arrow live at the start", !(await right.isDisabled()));

const x0 = await p.evaluate(() => document.querySelector(".igcar__track").scrollLeft);
await right.click(); await p.waitForTimeout(1200);
const x1 = await p.evaluate(() => document.querySelector(".igcar__track").scrollLeft);
pass("right arrow advances the rail", x1 > x0 + 100, `${Math.round(x0)} -> ${Math.round(x1)}`);
pass("left arrow becomes live", !(await left.isDisabled()));

await left.click(); await p.waitForTimeout(1200);
const x2 = await p.evaluate(() => document.querySelector(".igcar__track").scrollLeft);
pass("left arrow goes back", x2 < x1 - 100, `${Math.round(x1)} -> ${Math.round(x2)}`);

// lazy: only what has been near the viewport is embedded
const embedded = await p.locator(".igcar__track .live--embedded").count();
pass("cards embed as they come into view", embedded > 0 && embedded < 12, `${embedded}/12 so far`);

// see more
await p.waitForTimeout(2500);
const moreBtns = await p.locator(".live__more").count();
pass("a see-more appears on clipped captions", moreBtns > 0, `${moreBtns} card(s) offer it`);
if (moreBtns) {
  const card = p.locator(".live").filter({ has: p.locator(".live__more") }).first();
  const h0 = (await card.locator(".live__frame").boundingBox()).height;
  await card.locator(".live__more").click();
  await p.waitForTimeout(900);
  const h1 = (await card.locator(".live__frame").boundingBox()).height;
  pass("see-more reveals the rest of the caption", h1 > h0 + 40, `${Math.round(h0)}px -> ${Math.round(h1)}px`);
  await card.locator(".live__more").click();
  await p.waitForTimeout(700);
  const h2 = (await card.locator(".live__frame").boundingBox()).height;
  pass("and folds it back", Math.abs(h2 - h0) < 20, `back to ${Math.round(h2)}px`);
}
await b.close();
