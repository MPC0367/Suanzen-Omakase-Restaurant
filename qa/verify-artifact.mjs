/**
 * Does the artifact package work? Run against .artifact/ served locally:
 *
 *   python3 -m http.server 4326 --directory .artifact
 *   node qa/verify-artifact.mjs http://localhost:4326
 *
 * An artifact page is published inside a skeleton of its own (doctype, head
 * with a charset, viewport and small reset, then body), so every check runs
 * twice: on index.html as built, and on a copy wrapped the same way.
 */
import fs from "node:fs";
import { chromium } from "playwright";

const B = (process.argv[2] || "http://localhost:4326").replace(/\/$/, "");
let failed = 0;
const pass = (name, ok, note = "") => {
  if (!ok) failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
};

// The package's own limits and the page's title.
const files = JSON.parse(fs.readFileSync(".artifact/files.json", "utf8"));
const index = fs.readFileSync(".artifact/index.html", "utf8");
const count = Object.keys(files).length + 1;
pass("the package fits an artifact: at most 255 files", count <= 255, `${count} files`);
pass("the page's title is in its first 8 KB", /<title>[^<]+<\/title>/.test(index.slice(0, 8192)));

const SKELETON = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>:root{color-scheme:light}body{margin:0;font:14px system-ui,sans-serif;background:#faf9f7}img{max-width:100%}[hidden]{display:none!important}</style></head><body>`;
fs.writeFileSync(".artifact/_wrapped.html", `${SKELETON}${index}</body></html>`);

const b = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
try {
  for (const [label, page0] of [["as built", "index.html"], ["wrapped as an artifact", "_wrapped.html"]]) {
    console.log(label);
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const m = await ctx.newPage();
    const errs = [], missing = [];
    m.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
    // A failed load is checked by address below (a browser's own favicon
    // request, which an artifact answers itself, never reaches the page).
    m.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource")) errs.push(msg.text().slice(0, 160));
    });
    m.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(B)) missing.push(r.url().replace(B, "")); });

    await m.goto(`${B}/${page0}`, { waitUntil: "load" }); await m.waitForTimeout(2500);
    pass("the page comes to life (the menu's script has run)", (await m.locator(".menu.is-live").count()) === 1);
    pass("every course is open on a phone", (await m.locator(".course.is-open").count()) === 7);
    const fontsOk = await m.evaluate(async () => {
      await document.fonts.ready;
      const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, ""));
      return ["Shippori Mincho", "IBM Plex Sans Thai"].every((f) => loaded.some((l) => l.startsWith(f)));
    });
    pass("the site's own fonts load", fontsOk);
    pass("the logo shows", await m.evaluate(() => { const i = document.querySelector(".hdr img"); return !!i && i.complete && i.naturalWidth > 0; }));

    // The finder.
    await m.locator(".finder__open").tap(); await m.waitForTimeout(300);
    await m.locator(".finder__a", { hasText: "A child" }).tap(); await m.waitForTimeout(500);
    pass("the finder answers", (await m.locator(".finder__name").textContent())?.trim() === "Zen Kids");

    // A photo opening by itself mid-screen as it is scrolled there by hand.
    await m.evaluate(() => {
      const li = document.querySelectorAll(".course")[1].querySelector(".dish.has-photo");
      const r = li.querySelector(".dish__btn").getBoundingClientRect();
      scrollTo({ top: scrollY + r.top - innerHeight + 40, behavior: "instant" });
      li.dataset.auto = "1";
    });
    await m.waitForTimeout(400); await m.mouse.move(180, 600);
    let open = false;
    for (let k = 0; k < 60 && !open; k++) {
      await m.mouse.wheel(0, 30); await m.waitForTimeout(80);
      open = (await m.locator('[data-auto="1"].is-shown').count()) === 1;
    }
    await m.waitForTimeout(900);
    pass("a dish photo opens by itself as it is scrolled to the middle, and shows", open &&
      await m.evaluate(() => { const i = document.querySelector('[data-auto="1"] .dish__shot img'); return !!i && i.complete && i.naturalWidth > 0; }));

    // The phone menu's #visit link: lands on Visit, and the menu closes.
    await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(300);
    await m.locator(".burger").tap(); await m.waitForTimeout(700);
    await m.locator(".sheet__nav a").nth(1).tap(); await m.waitForTimeout(1600);
    const visit = await m.evaluate(() => ({
      top: Math.round(document.getElementById("visit").getBoundingClientRect().top),
      sheet: document.querySelector(".sheet").classList.contains("is-open"),
      url: location.pathname.split("/").pop(),
    }));
    pass("the phone menu's Visit link lands on Visit, on the same page, and closes the menu",
      Math.abs(visit.top) < 140 && !visit.sheet && visit.url === page0, `Visit at ${visit.top}px; ${visit.url}`);

    // A course page, and back.
    await m.evaluate(() => document.querySelector('a[href="/en/courses/zen-ichi/"]').scrollIntoView({ block: "center" }));
    await m.waitForTimeout(300);
    await m.locator('a[href="/en/courses/zen-ichi/"]').first().tap(); await m.waitForTimeout(2500);
    pass("a course's own page opens", m.url().endsWith("/en-zen-ichi.html") && (await m.locator("h1").textContent())?.trim() === "Zen Ichi", m.url().replace(B, ""));
    await m.locator('.cdetail a[href="/en/#courses"]').tap(); await m.waitForTimeout(2500);
    pass("…and All courses comes back to the menu", m.url().replace(B, "").startsWith("/index.html#courses"), m.url().replace(B, ""));

    // Thai.
    await m.locator(".lang").tap(); await m.waitForTimeout(2500);
    pass("the language switch opens the Thai page", m.url().endsWith("/th.html") &&
      (await m.locator("h1").first().textContent())?.includes("คอร์สไหนเหมาะกับคุณ"), m.url().replace(B, ""));

    pass("no file the page asks for is missing", missing.length === 0, [...new Set(missing)].slice(0, 5).join(", "));
    pass("no script errors", errs.length === 0, errs.slice(0, 3).join(" | "));
    await ctx.close();
  }
} finally {
  await b.close();
  fs.rmSync(".artifact/_wrapped.html", { force: true });
}
console.log(failed ? `\n${failed} FAILED` : "\nall passed");
process.exit(failed ? 1 : 0);
