import { chromium } from "playwright";

const BASE = "http://localhost:4321";
const pages = ["/en", "/th", "/en/book", "/en/instagram"];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

/** Relative luminance → contrast ratio, per WCAG. */
const lum = ([r, g, b]) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

for (const path of pages) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const report = await page.evaluate(() => {
    const out = { headings: [], noAlt: [], noName: [], small: [], lang: document.documentElement.lang };

    document.querySelectorAll("h1,h2,h3,h4").forEach((h) => {
      out.headings.push(Number(h.tagName[1]));
    });

    // alt="" is the correct markup for a decorative image; only a MISSING
    // attribute is a defect. Flagging empty alt makes the check untrustworthy.
    document.querySelectorAll("img").forEach((i) => {
      if (!i.hasAttribute("alt")) out.noAlt.push(i.currentSrc.slice(-40));
    });

    document.querySelectorAll("a,button,[role=tab]").forEach((el) => {
      // textContent, not innerText: innerText is rendering-aware and returns ""
      // for anything inside a visibility:hidden overlay, which flags every
      // control in the closed mobile sheet as nameless.
      const name = (
        el.textContent || el.getAttribute("aria-label") || el.getAttribute("title") || ""
      ).trim();
      if (!name && el.offsetParent !== null) {
        out.noName.push(el.tagName + "." + String(el.className).slice(0, 30));
      }
      const r = el.getBoundingClientRect();
      if (el.offsetParent !== null && r.width > 0 && (r.height < 44 || r.width < 24)) {
        out.small.push(
          `${el.tagName}.${String(el.className).slice(0, 26)} ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
      }
    });

    // Sample the real rendered colours of the main text pairs.
    const swatch = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const bg = (function findBg(node) {
        while (node && node !== document.documentElement) {
          const c = getComputedStyle(node).backgroundColor;
          if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
          node = node.parentElement;
        }
        return getComputedStyle(document.body).backgroundColor;
      })(el);
      const parse = (c) => c.match(/\d+/g).slice(0, 3).map(Number);
      return { sel, fg: parse(cs.color), bg: parse(bg), size: cs.fontSize };
    };

    out.pairs = [".u-lede", ".u-label", ".foot__tag", ".tile__date", ".bk__hint", ".igbar__count"]
      .map(swatch)
      .filter(Boolean);
    return out;
  });

  // Heading order: no level should jump by more than one.
  let jumps = [];
  report.headings.reduce((prev, cur) => {
    if (prev && cur > prev + 1) jumps.push(`${prev}->${cur}`);
    return cur;
  }, 0);

  const low = report.pairs
    .map((p) => ({ ...p, r: ratio(p.fg, p.bg) }))
    .filter((p) => p.r < 4.5)
    .map((p) => `${p.sel} ${p.r.toFixed(2)}:1 @${p.size}`);

  console.log(`\n${path}  (lang=${report.lang})`);
  console.log("  headings:", report.headings.join(","), jumps.length ? "JUMPS " + jumps : "order ok");
  console.log("  images without alt:", report.noAlt.length ? report.noAlt : "none");
  console.log("  controls without a name:", report.noName.length ? report.noName : "none");
  console.log("  under 44px tall:", report.small.length ? [...new Set(report.small)].slice(0, 6) : "none");
  console.log("  contrast under 4.5:1:", low.length ? low : "none");
}

await browser.close();
