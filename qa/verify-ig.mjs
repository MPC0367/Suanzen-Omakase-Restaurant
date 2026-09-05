import { chromium } from "playwright";
const B = "http://localhost:4700/Suanzen-Omakase-Restaurant";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const pass = (n, ok, x = "") => console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`);

// ── the journal grid ──────────────────────────────────────────────────────
await p.goto(B + "/en/instagram/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3000);
const before = await p.evaluate(() => document.querySelectorAll("iframe").length);
await p.evaluate(async () => { document.documentElement.style.scrollBehavior="auto";
  for (let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} });
await p.waitForTimeout(12000);
const after = await p.evaluate(() => ({
  iframes: document.querySelectorAll("iframe").length,
  gridPosts: document.querySelectorAll(".iggrid .live").length,
  gridEmbedded: document.querySelectorAll(".iggrid .live--embedded").length,
  gridFallback: document.querySelectorAll(".iggrid .live--fallback").length,
}));
pass("archive posts embed as you scroll", after.gridEmbedded > 0,
     `${after.gridEmbedded}/${after.gridPosts} embedded, ${after.gridFallback} fell back`);
pass("they load lazily, not all at once", before < after.iframes, `${before} before scrolling, ${after.iframes} after`);
await p.screenshot({ path: "qa/shots/ig-grid.png" });

// ── the home teaser ───────────────────────────────────────────────────────
await p.goto(B + "/en/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600);
await p.evaluate(async () => { document.documentElement.style.scrollBehavior="auto";
  document.querySelector(".social")?.scrollIntoView({ block: "center" }); });
await p.waitForTimeout(11000);
const teaser = await p.evaluate(() => ({
  posts: document.querySelectorAll(".social__rail .live").length,
  embedded: document.querySelectorAll(".social__rail .live--embedded").length,
}));
pass("home teaser shows real Instagram posts", teaser.embedded > 0, `${teaser.embedded}/${teaser.posts} embedded`);
await p.locator(".social").screenshot({ path: "qa/shots/social.png" });
await b.close();
