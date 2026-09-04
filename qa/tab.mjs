import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:4321/en", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
const seen = [];
for (let i = 0; i < 22; i++) {
  await p.keyboard.press("Tab");
  seen.push(await p.evaluate(() => {
    const a = document.activeElement;
    if (!a) return "none";
    const inHidden = a.closest(".res, .sheet");
    return `${a.tagName}.${String(a.className).slice(0, 24)}${inHidden ? "  <-- INSIDE OVERLAY" : ""}`;
  }));
}
console.log("first 22 tab stops:");
seen.forEach((s, i) => console.log(` ${String(i + 1).padStart(2)} ${s}`));
console.log("\nstops inside a closed overlay:", seen.filter(s => s.includes("INSIDE OVERLAY")).length);
await b.close();
