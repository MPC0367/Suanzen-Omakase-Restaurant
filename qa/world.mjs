import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:4600/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; });
for (const id of ["top","garden","counter","courses","alacarte","room","afterdark","gallery","visit"]) {
  await p.evaluate((s) => { const el = document.getElementById(s); if (el) window.scrollTo(0, el.offsetTop + 240); }, id);
  await p.waitForTimeout(900);
  const w = await p.evaluate(() => document.documentElement.dataset.world);
  const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const want = ["counter","courses"].includes(id) ? "day" : "night";
  console.log(`  ${id.padEnd(10)} world=${String(w).padEnd(6)} want=${want.padEnd(6)} ${w===want?"✓":"✗"}  bg=${bg}`);
}
await b.close();
