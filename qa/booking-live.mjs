import { chromium } from "playwright";
import fs from "node:fs";
fs.mkdirSync("qa/shots", { recursive: true });
const BASE = "https://mpc0367.github.io/Suanzen-Omakase-Restaurant";

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
page.on("pageerror", e => errs.push(String(e).slice(0, 160)));
let posted = null;
page.on("request", r => { if (r.url().includes("script.google.com")) posted = { m: r.method(), ct: r.headers()["content-type"] }; });

const panel = async () => (await page.locator(".bk").first().innerText().catch(() => "")).replace(/\s+/g, " ");
const cont = async () => { await page.getByRole("button", { name: /Continue/i }).first().click(); await page.waitForTimeout(1500); };

await page.goto(BASE + "/en/book/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);                      // matches the probe that worked

// The day is a <label> wrapping a hidden radio. Check the radio itself so the
// click does not depend on label-hydration timing.
await page.locator('.cal__day:not(.is-closed) input[name="date"]').nth(3).check({ force: true });
await page.waitForTimeout(900);
console.log("  date chosen:", await page.locator('input[name="date"]:checked').getAttribute("value"));
await cont();
console.log("step 2:", (await panel()).slice(60, 150));

const seats = page.locator(".seat:not(.is-off)");
console.log("  selectable seatings:", await seats.count());
await page.locator('.seat:not(.is-off) input').first().check({ force: true });
await page.waitForTimeout(700); await cont();

const picks = page.locator(".pick");
console.log("  courses offered   :", await picks.count());
await page.locator('.pick input').first().check({ force: true });
await page.waitForTimeout(700); await cont();

const party = page.locator(".party__n");
console.log("  party sizes       :", await party.count());
await page.locator('.party__n').nth(1).click();
await page.waitForTimeout(700); await cont();

await page.locator('input[type="text"]').first().fill("PRODUCTION CHECK");
await page.locator('input[type="tel"]').fill("081 234 5678");
await page.locator("textarea").fill("Live-site check — delete this row");
await cont();

await page.getByRole("button", { name: /Send request/i }).click();
await page.waitForTimeout(8000);

const ref  = await page.locator(".bk__refcode").textContent().catch(() => null);
const head = await page.locator(".bk--done h2").textContent().catch(() => null);
console.log("\n  posted to Apps Script:", posted ? `${posted.m} ${posted.ct}` : "NOTHING SENT");
console.log("  confirmation :", head, "| reference:", ref);
await page.screenshot({ path: "qa/shots/live_done.png" });
console.log(errs.length ? "  JS errors: " + errs.join(" | ") : "  no JS errors");
await browser.close();
