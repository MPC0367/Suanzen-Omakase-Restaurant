import { chromium } from "playwright";
import fs from "node:fs";
fs.mkdirSync("qa/shots", { recursive: true });
const BASE = process.argv[2] || "https://mpc0367.github.io/Suanzen-Omakase-Restaurant";

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
let posted = null;
page.on("request", (r) => { if (r.url().includes("script.google.com")) posted = { m: r.method(), ct: r.headers()["content-type"] }; });

const step = async () => (await page.locator(".bk").first().innerText().catch(() => ""))
  .replace(/\s+/g, " ").match(/STEP (\d) OF 6/)?.[1];

/* Hydration has to finish before a click means anything, and it is not a fixed
   duration. Poll: click, check the step moved, retry. */
const advanceFrom = async (n, pick) => {
  for (let attempt = 0; attempt < 25; attempt++) {
    await pick();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /Continue|Send request/i }).first().click().catch(() => {});
    await page.waitForTimeout(700);
    const s = await step();
    if (s !== n) return s;
    await page.waitForTimeout(500);
  }
  throw new Error(`stuck on step ${n}`);
};

await page.goto(BASE + "/en/book/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

await advanceFrom("1", () => page.locator(".cal__day:not(.is-closed)").nth(3).click());
console.log("  ✓ date");
await advanceFrom("2", () => page.locator(".seat:not(.is-off)").first().click());
console.log("  ✓ seating");
await advanceFrom("3", () => page.locator(".pick").first().click());
console.log("  ✓ course");
await advanceFrom("4", () => page.locator(".party__n").nth(1).click());
console.log("  ✓ guests");
await advanceFrom("5", async () => {
  await page.locator('input[type="text"]').first().fill("PRODUCTION CHECK");
  await page.locator('input[type="tel"]').fill("081 234 5678");
  await page.locator("textarea").fill("Final live check — delete this row");
});
console.log("  ✓ contact");

await page.getByRole("button", { name: /Send request/i }).click();
await page.waitForTimeout(9000);

const ref  = await page.locator(".bk__refcode").textContent().catch(() => null);
const head = await page.locator(".bk--done h2").textContent().catch(() => null);
console.log("\n  posted to Apps Script :", posted ? `${posted.m} ${posted.ct}` : "NOTHING SENT");
console.log("  confirmation          :", head, "| reference:", ref);
console.log(errs.length ? "  JS errors: " + errs.join(" | ") : "  no JS errors");
await browser.close();
