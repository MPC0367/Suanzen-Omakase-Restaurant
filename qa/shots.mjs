import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "qa/shots";
fs.mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:4321";

const viewports = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  phone: { width: 390, height: 844 },
};

const targets = process.argv[2]
  ? [process.argv[2]]
  : ["/en", "/th", "/en/book", "/th/book", "/en/instagram", "/th/instagram"];

const sizes = process.argv[3] ? [process.argv[3]] : Object.keys(viewports);

const browser = await chromium.launch();

for (const size of sizes) {
  const ctx = await browser.newContext({
    viewport: viewports[size],
    deviceScaleFactor: 1,
    locale: "en-GB",
  });
  const page = await ctx.newPage();

  const problems = [];
  page.on("console", (m) => {
    if (m.type() === "error") problems.push("console: " + m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => problems.push("pageerror: " + String(e).slice(0, 160)));

  for (const path of targets) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    // Let the threshold finish and reveals settle.
    await page.waitForTimeout(path.includes("instagram") ? 22000 : 2200);
    // Walk the page so every reveal fires before the full-page capture.
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 350));
    });

    const name = path.replace(/\//g, "_") || "_root";
    await page.screenshot({ path: `${OUT}/${size}${name}.png`, fullPage: true });

    // Horizontal overflow is the classic responsive failure — check it here
    // rather than hoping it shows up in a screenshot.
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      const wide = [...document.querySelectorAll("body *")]
        .filter((el) => el.getBoundingClientRect().right > de.clientWidth + 1)
        .slice(0, 5)
        .map((el) => el.tagName + "." + String(el.className).slice(0, 40));
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, wide };
    });
    if (overflow.scrollW > overflow.clientW + 1) {
      problems.push(`overflow ${path}: ${overflow.scrollW}>${overflow.clientW} ${JSON.stringify(overflow.wide)}`);
    }
  }

  if (problems.length) console.log(`\n[${size}] issues:\n  ` + problems.join("\n  "));
  else console.log(`[${size}] clean`);

  await ctx.close();
}

await browser.close();
console.log("\nshots in " + OUT);
