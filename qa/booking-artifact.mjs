import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0,120)));
let posted = null;
p.on("request", r => { if (r.url().includes("script.google.com")) posted = { method: r.method(), ct: r.headers()["content-type"], body: r.postData() }; });

await p.goto("http://localhost:4600/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.getElementById('book').offsetTop - 40); });
await p.waitForTimeout(800);
console.log("form present     :", await p.locator("#bkForm").count() === 1);
await p.screenshot({ path: "qa/shots/art_book.png" });

// validation must bite first
await p.locator("#bkSend").click(); await p.waitForTimeout(500);
console.log("blocks empty name:", await p.locator("#bkErr:not([hidden])").count() === 1, "|", await p.locator("#bkErr").innerText());
await p.fill('input[name="name"]', "Nat Suanpong");
await p.locator("#bkSend").click(); await p.waitForTimeout(400);
console.log("blocks bad phone :", (await p.locator("#bkErr").innerText()).includes("mobile"));

// real submit against the live endpoint
await p.fill('input[name="phone"]', "081 234 5678");
await p.fill('textarea[name="notes"]', "Written by the artifact test — safe to delete.");
await p.locator("#bkSend").click();
await p.waitForTimeout(6000);

console.log("\nrequest sent     :", posted ? `${posted.method} content-type=${posted.ct}` : "NONE");
if (posted) console.log("payload          :", posted.body.slice(0, 150));
const done = await p.locator("#bkDone:not([hidden])").count();
console.log("confirmation     :", done === 1 ? "shown, ref " + await p.locator("#bkRef").innerText() : "not shown");
if (!done) console.log("error shown      :", await p.locator("#bkErr").innerText());
console.log(errs.length ? "JS errors: " + errs.join(" | ") : "no JS errors");
await b.close();
