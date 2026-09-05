import { chromium } from "playwright";
import fs from "node:fs";
fs.mkdirSync("qa/shots", { recursive: true });
const B = "http://localhost:4700/Suanzen-Omakase-Restaurant";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const bad = [];
p.on("response", r => { if (r.status() >= 400) bad.push(r.status() + " " + r.url().replace(B, "")); });

await p.goto(B + "/en/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.screenshot({ path: "qa/shots/built_hero.png" });

// scroll the whole page so every lazy image is asked for
await p.evaluate(async () => {
  document.documentElement.style.scrollBehavior = "auto";
  for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
});
await p.waitForTimeout(2500);
await p.screenshot({ path: "qa/shots/built_full.png", fullPage: true });

const imgs = await p.evaluate(() => {
  const a = [...document.images];
  return { total: a.length, broken: a.filter(i => i.complete && i.naturalWidth === 0).length };
});
const styled = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
console.log("images on page :", imgs.total, "| broken:", imgs.broken);
console.log("body background:", styled, "(transparent/white would mean CSS failed)");
console.log("failed requests:", bad.length ? bad.slice(0, 8) : "none");
await b.close();
