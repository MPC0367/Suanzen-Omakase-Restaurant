import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "qa/shots";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:4700/Suanzen-Omakase-Restaurant";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
const failed = [];
page.on("requestfailed", (r) => failed.push(r.url().slice(-70)));
page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url().slice(-70)); });
let sheetHit = null;
page.on("request", (r) => { if (r.url().includes("script.google.com")) sheetHit = r.method(); });
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });

const step = async (label) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/flow_${label}.png` });
  console.log("  ✓", label);
};

await page.goto(BASE + "/en/book/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
console.log("booking flow:");

// 1 — a date three days out
const days = page.locator(".cal__day:not(.is-closed)");
await days.nth(3).click();
await step("1_date");
await page.getByRole("button", { name: /Continue/i }).click();

// 2 — a seating
await page.waitForTimeout(300);
const seats = page.locator(".seat:not(.is-off)");
console.log("  seatings offered:", await seats.count());
await seats.first().click();
await step("2_seating");
await page.getByRole("button", { name: /Continue/i }).click();

// 3 — a course
await page.waitForTimeout(300);
await page.locator(".pick").first().click();
await step("3_course");
await page.getByRole("button", { name: /Continue/i }).click();

// 4 — party size
await page.waitForTimeout(300);
await page.locator(".party__n").nth(1).click();
await step("4_party");
await page.getByRole("button", { name: /Continue/i }).click();

// 5 — validation must bite before it lets us through
await page.waitForTimeout(300);
await page.getByRole("button", { name: /Continue/i }).click();
await page.waitForTimeout(300);
const shownErrors = await page.locator(".bk__err").allTextContents();
console.log("  blocked empty contact:", shownErrors.length > 0, shownErrors);
await step("5_contact_errors");

// a bad phone must also be refused
await page.locator('input[type="text"]').first().fill("Nat Suanpong");
await page.locator('input[type="tel"]').fill("12345");
await page.getByRole("button", { name: /Continue/i }).click();
await page.waitForTimeout(300);
console.log("  blocked bad phone:", (await page.locator(".bk__err").count()) > 0);

await page.locator('input[type="tel"]').fill("081 234 5678");
await page.locator("textarea").fill("BUILT-SITE TEST — safe to delete");
await page.getByRole("button", { name: /Continue/i }).click();

// 6 — review, then send
await page.waitForTimeout(400);
await step("6_review");
await page.getByRole("button", { name: /Send request/i }).click();
await page.waitForTimeout(2000);

const ref = await page.locator(".bk__refcode").textContent().catch(() => null);
const heading = await page.locator(".bk--done h2").textContent().catch(() => null);
console.log("  confirmation:", heading, "| reference:", ref);
await step("7_done");

console.log("\n  posted to Apps Script:", sheetHit || "NO — it fell back to LINE");
console.log("  failed requests:", failed.length ? failed.slice(0, 6) : "none");
console.log(errs.length ? "  JS errors: " + errs.join("\n  ") : "  no JS errors");

await browser.close();
