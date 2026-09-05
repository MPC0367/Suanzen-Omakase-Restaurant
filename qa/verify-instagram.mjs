import { chromium } from "playwright";
const B = "http://localhost:4700/Suanzen-Omakase-Restaurant";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const pass = (n, ok, x = "") => console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`);

// home teaser
await p.goto(B + "/en/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600);
await p.evaluate(async () => { document.documentElement.style.scrollBehavior="auto";
  const el=document.querySelector(".social"); el?.scrollIntoView(); await new Promise(r=>setTimeout(r,400)); });
await p.waitForTimeout(1800);
const teaser = await p.evaluate(() => [...document.querySelectorAll(".social__rail img")]
  .map(i => ({ src: i.currentSrc.split("/").pop(), ok: i.complete && i.naturalWidth > 0 })));
pass("home teaser shows real photographs", teaser.length === 3 && teaser.every(t => t.ok),
     teaser.map(t => t.src).join(", ") || "no <img> at all");
await p.screenshot({ path: "qa/shots/social.png", clip: { x: 0, y: 0, width: 1440, height: 900 } }).catch(()=>{});

// the instagram page
await p.goto(B + "/en/instagram/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3000);
const page2 = await p.evaluate(() => ({
  blockquotes: document.querySelectorAll("blockquote.instagram-media").length,
  iframes: document.querySelectorAll("iframe").length,
  cards: document.querySelectorAll(".ig__card, .igcard, [class*='ig']").length,
  bodyLen: document.body.innerText.trim().length,
}));
console.log("  instagram page:", JSON.stringify(page2));
await b.close();
