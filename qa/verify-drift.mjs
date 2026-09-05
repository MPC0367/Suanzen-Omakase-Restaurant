import { chromium } from "playwright";
const B = "http://localhost:4700/Suanzen-Omakase-Restaurant";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(B + "/en/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
await p.locator(".rail").first().scrollIntoViewIfNeeded();
await p.mouse.move(20, 20);
await p.waitForTimeout(1200);

const drift = async (label) => {
  const a = await p.evaluate(() => document.querySelector(".rail").scrollLeft);
  await p.waitForTimeout(3000);
  const c = await p.evaluate(() => document.querySelector(".rail").scrollLeft);
  console.log(`  ${label}: ${Math.round(c - a)}px over 3s`);
  return c - a;
};
const before = await drift("baseline drift");

// press inside the rail, move only 2px (under the capture threshold), release far outside
const box = await p.locator(".rail").first().boundingBox();
await p.mouse.move(box.x + 200, box.y + 60);
await p.mouse.down();
await p.mouse.move(box.x + 202, box.y + 60);
await p.mouse.move(box.x + 202, box.y - 120);   // off the top of the rail
await p.mouse.up();                              // released outside it
await p.mouse.move(20, 20);
await p.waitForTimeout(1000);

const after = await drift("after releasing off the rail");
console.log(`\n  ${after > 20 ? "PASS" : "FAIL"}  autoscroll survives a release outside the rail (was 0px for ever)`);
await b.close();
