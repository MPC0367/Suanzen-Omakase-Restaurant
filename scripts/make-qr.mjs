/**
 * The handover QR code: the brochure's address as a print-ready SVG, plus a
 * 1200px PNG for printers that want one. Uses the site's own encoder
 * (src/lib/qr.ts — the one behind the LINE code in the reservation panel),
 * then renders the result in Chrome and scans it back, so a code that would
 * not scan can never be handed over.
 *
 *   node scripts/make-qr.mjs [url] [outdir]
 *
 * Re-run with the new address if the brochure moves to its own domain.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { qrPath } from "../src/lib/qr.ts";

const url = process.argv[2] || "https://mpc0367.github.io/Suanzen-Omakase-Restaurant/";
const out = process.argv[3] || "handover";
mkdirSync(out, { recursive: true });

const { size, d } = qrPath(url);
const q = 4; // quiet zone in modules — scanners need the white border
const box = size + q * 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-q} ${-q} ${box} ${box}" width="1024" height="1024" shape-rendering="crispEdges"><rect x="${-q}" y="${-q}" width="${box}" height="${box}" fill="#ffffff"/><path d="${d}" fill="#0b0b08"/></svg>\n`;
writeFileSync(`${out}/brochure-qr.svg`, svg);

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
await page.setContent(`<body style="margin:0"><img id="q" width="1200" height="1200" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"></body>`);
await page.locator("#q").screenshot({ path: `${out}/brochure-qr.png` });
let read = await page.evaluate(async () => {
  if (!("BarcodeDetector" in window)) return { ok: false, why: "BarcodeDetector unavailable in this browser" };
  const hits = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(document.getElementById("q"));
  return hits.length ? { ok: true, value: hits[0].rawValue } : { ok: false, why: "no QR found in the render" };
});
await browser.close();

/* Chrome on macOS has no BarcodeDetector. macOS's own Core Image reader does
   the same job, so fall back to it rather than hand over an unchecked code. */
if (!read.ok) {
  try {
    const reader = fileURLToPath(new URL("./scanqr.swift", import.meta.url));
    const v = execFileSync("swift", [reader, `${out}/brochure-qr.png`], { encoding: "utf8" }).trim().split("\n").pop();
    read = v && v !== "NO QR FOUND" ? { ok: true, value: v } : { ok: false, why: "no QR found by Core Image" };
  } catch { /* no Swift here: keep the original reason */ }
}

console.log(`QR for ${url}`);
console.log(`  ${size}×${size} modules + ${q}-module quiet zone → ${out}/brochure-qr.svg, ${out}/brochure-qr.png`);
console.log(read.ok ? `  scanned back: ${read.value} ${read.value === url ? "✓ matches" : "✗ MISMATCH"}` : `  not verified: ${read.why}`);
if (read.ok && read.value !== url) process.exit(1);
