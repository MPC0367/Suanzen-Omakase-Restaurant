/**
 * The Simplified Chinese edition, the language selector, and the room behind
 * the page — their contract.
 *
 *   node qa/verify-zh.mjs [base]    default http://localhost:4328/Suanzen-Omakase-Restaurant
 *
 * Run against the static export built for the project's base path
 * (node scripts/export.mjs --base /Suanzen-Omakase-Restaurant), served so the
 * pages sit under /Suanzen-Omakase-Restaurant/ exactly as on GitHub Pages.
 * Screenshots go to qa/shots/zh/.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium, webkit } from "playwright";
import { dict, advisorCopyZh, zhValues } from "./zh-content.mjs";

const B = (process.argv[2] || "http://localhost:4328/Suanzen-Omakase-Restaurant").replace(/\/$/, "");
const BASE_PATH = new URL(B).pathname.replace(/\/$/, "");
const SITE = "https://mpc0367.github.io" + BASE_PATH;   // what the build writes into canonical and hreflang
const SHOTS = "qa/shots/zh";
fs.mkdirSync(SHOTS, { recursive: true });

const SLUGS = ["zen-kids", "zen-ichi", "zen-ni", "zen-san", "zen-boss", "zen-yon", "zen-sweet"];
const ZH_PAGES = ["/zh/", ...SLUGS.map((s) => `/zh/courses/${s}/`)];
const VIEWPORTS = { "320": [320, 568], "390": [390, 844], "768": [768, 1024], "1440": [1440, 900] };
const IMAGE_HOSTS = /googleusercontent\.com|ggpht\.com|fbcdn\.net|cdninstagram\.com|scontent[.-]|lemon8|wongnai|tripadvisor/i;
// The wash as specified. Browsers write it back in their own shorthand — 0%
// as 0px, the closing 100% left off — so both sides are put in that form.
// The room at 30 20 10 0 0 0 0 10 20 30 % in ten even steps down the screen.
const GRADIENT = "linear-gradient(rgba(10, 10, 10, 0.7) 0%, rgba(10, 10, 10, 0.8) 11.11%, rgba(10, 10, 10, 0.9) 22.22%, rgb(10, 10, 10) 33.33%, rgb(10, 10, 10) 66.67%, rgba(10, 10, 10, 0.9) 77.78%, rgba(10, 10, 10, 0.8) 88.89%, rgba(10, 10, 10, 0.7) 100%)";
// WebKit also writes 22.22% back as 22.219999%, so stops are compared to two places.
const plain = (g) => g.replace(/\s+0(px|%)(?=[,)])/g, " 0%").replace(/\s+100%\)$/, ")").replace(/^linear-gradient\(to bottom,\s*/, "linear-gradient(")
  .replace(/(\d+\.\d+)%/g, (_, n) => `${Number(n).toFixed(2)}%`);

let failed = 0;
const errs = [];
const pass = (n, ok, x = "") => { if (!ok) failed++; console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const ready = (p) => p.waitForFunction(() => !document.querySelector(".curtain"), null, { timeout: 25000 });
const watch = (p, label) => {
  p.on("pageerror", (e) => errs.push(`${label}: ${String(e).slice(0, 160)}`));
  p.on("console", (m) => { if (m.type() === "error") errs.push(`${label} console: ${m.text().slice(0, 160)}`); });
};

/* WCAG relative luminance and contrast. */
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/* ── 1 · Every Chinese page: there, marked, unlisted, and linked to the others ── */
console.log("pages and metadata");
{
  const bad = [];
  for (const p of ZH_PAGES) {
    const r = await fetch(B + p);
    const h = await r.text();
    const want = `${SITE}${p}`;
    if (r.status !== 200) bad.push(`${p} HTTP ${r.status}`);
    if (!h.includes('<html lang="zh-CN"')) bad.push(`${p} not lang zh-CN`);
    if (!h.includes('<meta name="robots" content="noindex, nofollow"/>')) bad.push(`${p} not noindex, nofollow`);
    if (!h.includes(`<link rel="canonical" href="${want}"/>`)) bad.push(`${p} canonical`);
    const rest = p.slice(3);
    for (const [hl, l] of [["en", "en"], ["th", "th"], ["zh-CN", "zh"], ["x-default", "en"]]) {
      if (!h.includes(`<link rel="alternate" hrefLang="${hl}" href="${SITE}/${l}${rest}"/>`)) bad.push(`${p} hreflang ${hl}`);
    }
    if (!h.includes('<meta property="og:locale" content="zh_CN"/>')) bad.push(`${p} og:locale`);
    if (!h.includes('<meta property="og:locale:alternate" content="en_US"/>') || !h.includes('<meta property="og:locale:alternate" content="th_TH"/>')) bad.push(`${p} og:locale:alternate`);
    if (/⟦|\bundefined\b|\bNaN\b|\[object Object\]/.test(h.replace(/<script[\s\S]*?<\/script>/g, ""))) bad.push(`${p} shows undefined / NaN / a placeholder`);
    if (IMAGE_HOSTS.test(h)) bad.push(`${p} names an outside image host`);
  }
  pass(`all ${ZH_PAGES.length} Chinese pages: 200, zh-CN, noindex, canonical, hreflang en/th/zh-CN/x-default, og:locale zh_CN`, bad.length === 0, bad.join("; "));

  const home = await (await fetch(B + "/zh/")).text();
  pass("title, description and preview picture text as specified",
    home.includes("<title>Suan Zen Omakase — 菜单</title>")
    && home.includes('<meta name="description" content="Suan Zen Omakase 套餐菜单：7款套餐、完整菜品与价格。可通过 LINE 预约。"/>')
    && home.includes('<meta property="og:image:alt" content="Suan Zen Omakase，暖武里府"/>'));

  const others = [];
  for (const p of ["/en/", "/th/", "/en/courses/zen-ni/", "/th/courses/zen-ni/"]) {
    const h = await (await fetch(B + p)).text();
    if (!h.includes(`hrefLang="zh-CN" href="${SITE}/zh${p.slice(3)}"`)) others.push(p);
  }
  pass("the English and Thai pages point at their Chinese copy", others.length === 0, others.join(", "));

  const root = await (await fetch(B + "/")).text();
  pass("the root page offers 简体中文 and sends Chinese browsers to /zh/",
    root.includes(`href="${BASE_PATH}/zh/"`) && root.includes("简体中文") && /hans/.test(root) && /hant\|tw\|hk\|mo/.test(root));
  const stub = await (await fetch(B + "/courses/zen-ni/")).text();
  pass("a course link without a language can forward to /zh/", /\/courses\/zen-ni\/' \+ location\.search/.test(stub) && /hans/.test(stub));

  // The export itself, not just what a page happens to load.
  const hits = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const f of walk("out").filter((f) => /\.(html|css|js|txt)$/.test(f))) {
    if (IMAGE_HOSTS.test(fs.readFileSync(f, "utf8"))) hits.push(f);
  }
  pass("nothing in the export hotlinks a Google, Facebook, Instagram or listing-site picture", hits.length === 0, hits.slice(0, 4).join(", "));
}

const b = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());

/* ── 2 · Every word a Chinese guest reads is Chinese, or meant to be Latin ── */
console.log("no English left behind");
{
  // Latin text the Chinese edition keeps on purpose: course and brand names,
  // Japanese dish names the restaurant has not given a Chinese form for, and
  // the like — every such string in the content, as the editors left it.
  const allowed = new Set([...zhValues, ...Object.values(dict.zh).flatMap(function all(v) {
    return typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(all) : v && typeof v === "object" ? Object.values(v).flatMap(all) : [];
  }), ...advisorCopyZh].map((s) => s.trim()));
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); watch(p, "zh text");
  const stray = [];
  for (const u of ZH_PAGES) {
    await p.goto(B + u, { waitUntil: "domcontentloaded" }); await ready(p);
    if (u === "/zh/") {   // what only shows when asked for: the reservation drawer and the language list
      await p.locator(".hdr__cta").click(); await p.waitForTimeout(400);
    }
    const found = await p.evaluate(() => {
      const out = [];
      const latinOnly = (s) => /[A-Za-z]{2}/.test(s) && !/[㐀-鿿]/.test(s);
      const foreign = (el) => { const l = el.closest("[lang]")?.getAttribute("lang"); return l && l !== "zh-CN"; };
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const s = n.textContent.trim(), el = n.parentElement;
        if (!s || !el || el.closest("script,style,svg,.curtain") || foreign(el)) continue;
        if (!el.checkVisibility({ visibilityProperty: true, opacityProperty: false })) continue;
        if (latinOnly(s)) out.push(s);
      }
      for (const el of document.querySelectorAll("[aria-label],[alt],[title],[placeholder]")) {
        if (foreign(el)) continue;
        for (const a of ["aria-label", "alt", "title", "placeholder"]) {
          const v = el.getAttribute(a)?.trim();
          if (v && latinOnly(v)) out.push(`@${a}: ${v}`);
        }
      }
      return out;
    });
    const brand = /^(Suan|Zen|Suan Zen( Omakase)?|Zen (Kids|Ichi|Ni|San|Boss|Yon|Sweet)|LINE( @suanzenomakase)?|@suanzenomakase|Instagram|Facebook|TikTok|Google|Omakase|EN|\+\+|©.*)$/;
    for (const s of found) {
      const bare = s.replace(/^@[\w-]+: /, "");
      if (allowed.has(bare) || brand.test(bare) || bare.split(/\s*[—·,、]\s*/).every((part) => allowed.has(part) || brand.test(part))) continue;
      stray.push(`${u} “${s.slice(0, 60)}”`);
    }
  }
  pass("no English stands in for a missing Chinese string, in text or in labels", stray.length === 0, [...new Set(stray)].slice(0, 12).join(" | "));
  await ctx.close();
}

/* ── 3 · The language selector ─────────────────────────────────────────── */
console.log("language selector");
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); watch(p, "selector");
  await p.goto(`${B}/en/courses/zen-san/?from=line#course`, { waitUntil: "domcontentloaded" }); await ready(p);

  const btn = p.locator(".lang__btn");
  const named = await p.evaluate(() => {
    const b = document.querySelector(".lang__btn");
    return { name: b.textContent.replace(/\s+/g, " ").trim(), expanded: b.getAttribute("aria-expanded"), controls: !!document.getElementById(b.getAttribute("aria-controls")) };
  });
  pass("a button named Language, showing the page's language, closed", named.name === "Language: EN" && named.expanded === "false" && named.controls, JSON.stringify(named));

  await btn.focus(); await p.keyboard.press("ArrowDown"); await p.waitForTimeout(250);
  const k1 = await p.evaluate(() => ({ exp: document.querySelector(".lang__btn").getAttribute("aria-expanded"), at: document.activeElement.textContent, cur: document.activeElement.getAttribute("aria-current") }));
  pass("down arrow opens it on the current language", k1.exp === "true" && k1.at === "English" && k1.cur === "true", JSON.stringify(k1));
  await p.keyboard.press("ArrowDown"); const k2 = await p.evaluate(() => document.activeElement.textContent);
  await p.keyboard.press("End"); const k3 = await p.evaluate(() => document.activeElement.textContent);
  await p.keyboard.press("ArrowDown"); const k4 = await p.evaluate(() => document.activeElement.textContent);
  pass("the arrows, Home and End walk the three", k2 === "ไทย" && k3 === "简体中文" && k4 === "English", [k2, k3, k4].join(" → "));
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  const k5 = await p.evaluate(() => ({ exp: document.querySelector(".lang__btn").getAttribute("aria-expanded"), back: document.activeElement === document.querySelector(".lang__btn"), vis: getComputedStyle(document.querySelector(".lang__list")).visibility }));
  pass("Escape closes it and hands focus back to the button", k5.exp === "false" && k5.back && k5.vis === "hidden", JSON.stringify(k5));
  await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.waitForTimeout(250);
  pass("tabbing out of it closes it", (await btn.getAttribute("aria-expanded")) === "false");
  await btn.click(); await p.mouse.click(700, 600); await p.waitForTimeout(250);
  pass("a click elsewhere closes it", (await btn.getAttribute("aria-expanded")) === "false");

  await btn.click(); await p.waitForTimeout(200);
  const hrefs = await p.$$eval(".lang__opt", (as) => as.map((a) => a.getAttribute("href")));
  pass("each language links to this same course, with the query and #section",
    hrefs.join() === ["en", "th", "zh"].map((l) => `${BASE_PATH}/${l}/courses/zen-san/?from=line#course`).join(), hrefs.join(" "));
  await p.locator('.lang__opt[hreflang="zh-CN"]').click();
  await p.waitForTimeout(150);
  const curtain = await p.locator(".curtain").count();
  await p.waitForURL(/\/zh\/courses\/zen-san\//, { timeout: 8000 }).catch(() => {});
  await ready(p).catch(() => {});
  const u = new URL(p.url());
  pass("choosing 简体中文 keeps the path, slug, query and hash, under the curtain",
    u.pathname === `${BASE_PATH}/zh/courses/zen-san/` && u.search === "?from=line" && u.hash === "#course" && curtain === 1
      && (await p.evaluate(() => document.documentElement.lang)) === "zh-CN", `${u.pathname}${u.search}${u.hash} · curtain ${curtain}`);
  pass("the button now reads 语言: 中文", (await p.evaluate(() => document.querySelector(".lang__btn").textContent.replace(/\s+/g, " ").trim())) === "语言: 中文");

  // The guest's place: halfway down an open Zen San on the English menu.
  await p.goto(`${B}/en/`, { waitUntil: "domcontentloaded" }); await ready(p);
  await p.locator("#course-zen-san .course__btn").click(); await p.waitForTimeout(600);
  const before = await p.evaluate(() => {
    const hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hdr-h")) || 64;
    const panel = document.querySelector("#course-zen-san .course__panel");
    const r = panel.getBoundingClientRect();
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, window.scrollY + r.top - hdr - 12 + r.height * 0.45);
    const r2 = panel.getBoundingClientRect();
    return { frac: (hdr + 12 - r2.top) / r2.height, y: window.scrollY };
  });
  await p.waitForTimeout(300);
  await p.locator(".lang__btn").click(); await p.locator('.lang__opt[hreflang="zh-CN"]').click();
  await p.waitForURL(/\/zh\/$/, { timeout: 8000 }).catch(() => {}); await ready(p).catch(() => {}); await p.waitForTimeout(600);
  const after = await p.evaluate(() => {
    const hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hdr-h")) || 64;
    const open = [...document.querySelectorAll(".course.is-open")].map((c) => c.id);
    const panel = document.querySelector("#course-zen-san .course__panel");
    const r = panel && !panel.hidden ? panel.getBoundingClientRect() : null;
    return { open, frac: r ? (hdr + 12 - r.top) / r.height : null, y: window.scrollY };
  });
  pass("switching language keeps Zen San open and the guest at the same point in it",
    after.open.join() === "course-zen-san" && after.frac !== null && Math.abs(after.frac - before.frac) < 0.05,
    `${before.frac.toFixed(2)} of the way down in English, ${after.frac?.toFixed(2)} in Chinese; open: ${after.open.join()}`);

  await p.goto(`${B}/zh/#visit`, { waitUntil: "load" }); await ready(p); await p.waitForTimeout(800);
  const v0 = await p.evaluate(() => Math.round(document.getElementById("visit").getBoundingClientRect().top));
  await p.locator(".lang__btn").click(); await p.locator('.lang__opt[hreflang="th"]').click();
  await p.waitForURL(/\/th\/#visit$/, { timeout: 8000 }).catch(() => {}); await ready(p).catch(() => {}); await p.waitForTimeout(600);
  const v1 = await p.evaluate(() => Math.round(document.getElementById("visit").getBoundingClientRect().top));
  pass("…and from #visit lands on Visit again, not at the top", new URL(p.url()).hash === "#visit" && Math.abs(v1 - v0) < 60, `Visit at ${v0}px, then ${v1}px`);
  await ctx.close();

  // The compact phone header.
  const mctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const m = await mctx.newPage(); watch(m, "phone selector");
  await m.goto(`${B}/zh/`, { waitUntil: "domcontentloaded" }); await ready(m);
  await m.locator(".lang__btn").tap(); await m.waitForTimeout(400);
  const box = await m.evaluate(() => {
    const b = document.querySelector(".lang__btn").getBoundingClientRect(), l = document.querySelector(".lang__list").getBoundingClientRect();
    const opts = [...document.querySelectorAll(".lang__opt")].map((a) => Math.round(a.getBoundingClientRect().height));
    return { bw: b.width, bh: b.height, left: l.left, right: l.right, vw: innerWidth, opts };
  });
  pass("on a phone it sits in the header, 44px to tap, and opens inside the screen",
    box.bh >= 44 && box.bw >= 44 && box.left >= 0 && box.right <= box.vw && box.opts.every((h) => h >= 44), JSON.stringify(box));
  await m.screenshot({ path: `${SHOTS}/2-zh-mobile-language-open.png` });
  await mctx.close();
}

/* ── 3b · What the independent review found (2026-09-18), kept fixed ────── */
console.log("review findings, kept fixed");
{
  const wk = await webkit.launch();
  const at = (p) => p.evaluate(() => ({ a: document.activeElement?.className || document.activeElement?.tagName, exp: document.querySelector(".lang__btn")?.getAttribute("aria-expanded") }));

  // Opened with Enter, the arrows still take the focus in (Chrome and Safari).
  for (const [name, eng] of [["Chrome", b], ["WebKit", wk]]) {
    const p = await (await eng.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); watch(p, `${name} keys`);
    await p.goto(`${B}/en/`, { waitUntil: "domcontentloaded" }); await ready(p);
    await p.locator(".lang__btn").focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
    await p.keyboard.press("ArrowDown"); await p.waitForTimeout(200);
    const s1 = await p.evaluate(() => document.activeElement?.textContent);
    pass(`${name}: opened with Enter, the down arrow goes into the list`, s1 === "English", s1);
    await p.context().close();
  }

  // Safari: reduced motion, the arrow still takes the focus in; a mouse-opened list closes on Escape;
  // opened from the keyboard, a slow mouse press on a language still chooses it.
  {
    const ctx = await wk.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage(); watch(p, "WebKit reduced");
    await p.goto(`${B}/en/`, { waitUntil: "domcontentloaded" }); await ready(p);
    await p.locator(".lang__btn").focus(); await p.keyboard.press("ArrowDown"); await p.waitForTimeout(300);
    const s1 = await p.evaluate(() => document.activeElement?.textContent);
    pass("WebKit, reduced motion: the down arrow opens the list and goes into it", s1 === "English", s1);
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    await p.locator(".lang__btn").click(); await p.waitForTimeout(200);
    await p.keyboard.press("Escape"); await p.waitForTimeout(250);
    const s2 = await at(p);
    pass("WebKit: opened with the mouse, Escape closes it", s2.exp === "false", JSON.stringify(s2));
    await p.locator(".lang__btn").focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(250);
    const box = await p.locator('.lang__opt[hreflang="th"]').boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.down(); await p.waitForTimeout(260); await p.mouse.up();
    await p.waitForURL(/\/th\/$/, { timeout: 8000 }).catch(() => {});
    pass("WebKit: opened from the keyboard, a slow mouse press on ไทย still switches", /\/th\/$/.test(new URL(p.url()).pathname), new URL(p.url()).pathname);
    await ctx.close();
  }

  // A press slid off a language, without a click, keeps no place behind.
  {
    const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); watch(p, "cancelled press");
    await p.goto(`${B}/en/`, { waitUntil: "domcontentloaded" }); await ready(p);
    await p.evaluate(() => { try { sessionStorage.clear(); } catch {} });
    await p.locator(".lang__btn").click(); await p.waitForTimeout(200);
    const box = await p.locator('.lang__opt[hreflang="th"]').boundingBox();
    await p.mouse.move(box.x + 10, box.y + box.height / 2); await p.mouse.down();
    await p.mouse.move(700, 700, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(200);
    const kept = await p.evaluate(() => { try { return sessionStorage.getItem("suanzen:place"); } catch { return "no storage"; } });
    pass("a press slid off a language leaves no kept place", kept === null, String(kept).slice(0, 60));
    await p.context().close();
  }

  // From the keyboard, the new page gives the focus back to the language button, where the guest was.
  {
    const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); watch(p, "keyboard switch");
    await p.goto(`${B}/en/`, { waitUntil: "domcontentloaded" }); await ready(p);
    await p.locator("#course-zen-san .course__btn").click(); await p.waitForTimeout(500);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; document.querySelector("#course-zen-san").scrollIntoView(); scrollBy(0, 300); });
    await p.locator(".lang__btn").focus({ preventScroll: true });
    await p.keyboard.press("ArrowDown"); await p.waitForTimeout(200); await p.keyboard.press("End"); await p.keyboard.press("Enter");
    await p.waitForURL(/\/zh\/$/, { timeout: 8000 }).catch(() => {}); await ready(p).catch(() => {}); await p.waitForTimeout(700);
    const s = await p.evaluate(() => ({ a: document.activeElement?.className, y: Math.round(scrollY) }));
    await p.keyboard.press("Tab"); await p.waitForTimeout(200);
    const y2 = await p.evaluate(() => Math.round(scrollY));
    pass("after a switch from the keyboard, focus is on the language button and the next Tab keeps the place",
      s.a === "lang__btn" && Math.abs(y2 - s.y) < 200 && s.y > 400, `focus ${s.a}, y ${s.y} → ${y2} after Tab`);
    await p.context().close();
  }

  // Switching while reading the finder's answer: the page settles where it lands, it does not creep up.
  {
    const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); watch(p, "finder place");
    await p.goto(`${B}/en/`, { waitUntil: "domcontentloaded" }); await ready(p);
    await p.locator(".finder__open").click(); await p.waitForTimeout(300);
    await p.locator(".finder__a").first().click(); await p.waitForTimeout(400);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const r = document.querySelector(".finder__result, #finder-panel"); r?.scrollIntoView(); scrollBy(0, -60); });
    await p.locator(".lang__btn").click(); await p.locator('.lang__opt[hreflang="zh-CN"]').click();
    await p.waitForURL(/\/zh\/$/, { timeout: 8000 }).catch(() => {});
    const ys = [];
    for (const wait of [300, 500, 900]) { await p.waitForTimeout(wait); ys.push(await p.evaluate(() => Math.round(scrollY))); }
    // It may move a little once more as the Chinese fonts arrive and the lines
    // settle; what it must not do is step up a reading line at a time.
    pass("switching while reading the finder's answer settles once, without creeping up",
      Math.abs(ys[2] - ys[1]) <= 4 && Math.max(...ys) - Math.min(...ys) < 40 && ys[0] > 0, ys.join(" → "));
    await p.context().close();
  }

  // The Chinese page itself: the finder in the Chinese serif; clock times, lists and one-colon descriptions
  // written the Chinese way; the studio credit named in Chinese; Google's link untracked; high contrast clean.
  {
    const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); watch(p, "zh details");
    await p.goto(`${B}/zh/`, { waitUntil: "domcontentloaded" }); await ready(p);
    await p.locator(".finder__open").click(); await p.waitForTimeout(300);
    const d = await p.evaluate(() => ({
      legend: getComputedStyle(document.querySelector(".finder__legend")).fontFamily.split(",")[0].replace(/"/g, ""),
      family: getComputedStyle(document.querySelector(".family__name")).fontFamily.split(",")[0].replace(/"/g, ""),
      visit: document.querySelector("#visit .facts")?.textContent || "",
      credit: document.querySelector(".o2-credit")?.getAttribute("aria-label"),
      pin: parseFloat(getComputedStyle(document.querySelector(".visit__open")).letterSpacing) / parseFloat(getComputedStyle(document.querySelector(".visit__open")).fontSize),
    }));
    pass("the finder's questions and the family names are set in Noto Serif SC", d.legend === "Noto Serif SC" && d.family === "Noto Serif SC", `${d.legend} · ${d.family}`);
    pass("hours and seatings are written 12:30–21:00, not 12.30", /12:30–21:00/.test(d.visit) && /12:30\s*·/.test(d.visit) && !/\d\.\d\d/.test(d.visit), (d.visit.match(/[\d:.–\s·]{8,}/g) || []).join(" | ").slice(0, 90));
    pass("the studio credit is announced in Chinese", /^网站由 O2 Design Studio/.test(d.credit || ""), d.credit);
    pass("the Google Maps link is set near-level", d.pin <= 0.041, d.pin.toFixed(3) + "em");
    await p.locator(".hdr__cta").click(); await p.waitForTimeout(400);
    const list = await p.evaluate(() => [...document.querySelectorAll(".res__facts dd")].map((x) => x.textContent).find((t) => t.includes("Zen Kids")) || "");
    pass("the reservation drawer lists the courses with 、", list.includes("Zen Kids、Zen Ichi") && !list.includes(", "), list.slice(0, 60));
    const bad = [];
    for (const s of SLUGS) {
      const h = await (await fetch(`${B}/zh/courses/${s}/`)).text();
      const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
      if ((desc.match(/：/g) || []).length > 1) bad.push(`${s}: ${desc.slice(0, 40)}`);
    }
    pass("no Chinese course description puts two colons in one sentence", bad.length === 0, bad.join(" | "));
    await p.context().close();
    const fc = await (await b.newContext({ viewport: { width: 1440, height: 900 }, forcedColors: "active" })).newPage();
    await fc.goto(`${B}/zh/`, { waitUntil: "domcontentloaded" });
    pass("in high-contrast mode the photograph is not drawn at all", (await fc.evaluate(() => getComputedStyle(document.querySelector(".backdrop")).display)) === "none");
    await fc.context().close();
  }
  await wk.close();
}

/* ── 4 · Reserve, and the map, in Chinese ──────────────────────────────── */
console.log("reserve and map");
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); watch(p, "reserve");
  await p.goto(`${B}/zh/courses/zen-boss/`, { waitUntil: "domcontentloaded" }); await ready(p);
  const href = await p.locator(".cdetail .course__acts .btn").first().getAttribute("href");
  pass("Reserve on a Chinese course page opens LINE with the Chinese message",
    decodeURIComponent(href.split("?")[1] || "") === "您好，我想预约 Zen Boss 套餐。\n日期：\n用餐时段：\n人数：\n过敏食物或忌口：",
    JSON.stringify(decodeURIComponent(href.split("?")[1] || "")));
  await p.goto(`${B}/zh/`, { waitUntil: "domcontentloaded" }); await ready(p);
  await p.evaluate(() => document.getElementById("visit").scrollIntoView()); await p.waitForTimeout(2500);
  const map = await p.evaluate(() => document.querySelector(".visit__canvas iframe")?.getAttribute("src") || "");
  pass("the map is asked for in Simplified Chinese (hl=zh-CN)", /[?&]hl=zh-CN&/.test(map), map.replace(/^.*\?/, "?").slice(0, 90));
  const addr = await p.evaluate(() => ({ zh: document.querySelector(".facts dd")?.firstChild?.textContent, en: document.querySelector(".facts .addr__latin")?.textContent, lang: document.querySelector(".facts .addr__latin")?.lang }));
  pass("the address is in Chinese, with the romanised one under it for a driver",
    /暖武里府/.test(addr.zh || "") && addr.en === "35/2 Soi Nonthaburi 48, Tha Sai, Mueang Nonthaburi, Nonthaburi 11000" && addr.lang === "en", JSON.stringify(addr));
  await ctx.close();
}

/* ── 5 · The room behind the page ──────────────────────────────────────── */
console.log("the background");
const decode = async (file) => {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};
const bandStats = ({ data, w, h }, from, to) => {
  let maxCh = 0, maxL = 0, brightest = [0, 0, 0], sum = 0, n = 0;
  for (let y = Math.floor(h * from); y < Math.min(h, Math.ceil(h * to)); y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3, px = [data[i], data[i + 1], data[i + 2]];
      const L = lum(px);
      maxCh = Math.max(maxCh, ...px); sum += L; n++;
      if (L > maxL) { maxL = L; brightest = px; }
    }
  }
  return { maxCh, mean: sum / n, brightest };
};
const diff = (a, b) => { let d = 0; for (let i = 0; i < a.data.length; i++) d = Math.max(d, Math.abs(a.data[i] - b.data[i])); return d; };

for (const [engineName, engine] of [["Chrome", b], ["WebKit", await webkit.launch()]]) {
  for (const [vp, [w, h]] of Object.entries(VIEWPORTS)) {
    const ctx = await engine.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, ...(w < 768 && engineName === "Chrome" ? { hasTouch: true, isMobile: true } : {}) });
    const p = await ctx.newPage(); watch(p, `${engineName} ${vp}`);
    const requests = [];
    p.on("request", (r) => requests.push(r.url()));
    await p.goto(`${B}/zh/`, { waitUntil: "load" }); await ready(p);
    await p.waitForFunction(() => document.querySelector(".backdrop__img")?.complete, null, { timeout: 10000 }).catch(() => {});

    const facts = await p.evaluate(() => {
      const bd = document.querySelector(".backdrop"), img = bd?.querySelector("img"), cs = bd && getComputedStyle(bd);
      return bd && {
        count: document.querySelectorAll(".backdrop").length, parent: bd.parentElement.tagName,
        pos: cs.position, z: cs.zIndex, pe: cs.pointerEvents, us: cs.userSelect || cs.webkitUserSelect, aria: bd.getAttribute("aria-hidden"),
        h: Math.round(bd.getBoundingClientRect().height), vh: innerHeight,
        src: img.currentSrc, loaded: img.naturalWidth > 0, fit: getComputedStyle(img).objectFit, op: getComputedStyle(img).objectPosition,
        wash: getComputedStyle(bd, "::after").backgroundImage,
        attach: [getComputedStyle(document.documentElement).backgroundAttachment, getComputedStyle(document.body).backgroundAttachment],
        html: getComputedStyle(document.documentElement).backgroundColor, body: getComputedStyle(document.body).backgroundColor,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    const label = `${engineName} ${w}×${h}`;
    pass(`${label}: one fixed backdrop, behind, inert, hidden from screen readers, the full screen tall`,
      facts && facts.count === 1 && facts.parent === "BODY" && facts.pos === "fixed" && facts.z === "-1" && facts.pe === "none"
        && facts.us === "none" && facts.aria === "true" && facts.h >= facts.vh && !facts.attach.includes("fixed"), JSON.stringify(facts && { ...facts, src: undefined, wash: undefined }));
    pass(`${label}: the photograph loads from the site's own /photos/, under the base path`,
      facts.loaded && facts.src.startsWith(`${new URL(B).origin}${BASE_PATH}/photos/backdrop-`) && /\.(avif|webp|jpg)$/.test(facts.src)
        && !requests.some((u) => IMAGE_HOSTS.test(u) && !/maps\.google|google\.com\/maps/.test(u)),
      facts.src.replace(new URL(B).origin, ""));
    pass(`${label}: the wash is the specified gradient, over a #0a0a0a ground`,
      plain(facts.wash) === plain(GRADIENT) && facts.html === "rgb(10, 10, 10)" && facts.body === "rgba(0, 0, 0, 0)" && facts.fit === "cover",
      plain(facts.wash) === plain(GRADIENT) ? "" : facts.wash);
    pass(`${label}: nothing scrolls sideways`, facts.overflow <= 0, `${facts.overflow}px`);

    // The room alone: the page hidden over it, at the top, the middle and the end
    // — for both versions the restaurant can choose between, whichever is live.
    await p.addStyleTag({ content: "body > :not(.backdrop) { visibility: hidden !important; } html { scroll-behavior: auto !important; }" });
    const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (const version of ["", "-grey"]) {
    await p.evaluate(async (v) => {
      document.querySelectorAll(".backdrop source, .backdrop img").forEach((el) => {
        // Both photographs, the wide counter and the tall olive tree, in the tone asked for.
        for (const a of ["srcset", "src"]) if (el.getAttribute(a)) el.setAttribute(a, el.getAttribute(a).replace(/\/(backdrop(?:-tall(?:-held)?)?)(?:-grey)?-(\d)/g, `/$1${v}-$2`));
      });
      const img = document.querySelector(".backdrop img");
      const want = new RegExp(`/backdrop(-tall(-held)?)?${v}-\\d`);
      await new Promise((r) => (img.complete && want.test(img.currentSrc) ? r() : img.addEventListener("load", r, { once: true })));
      await img.decode().catch(() => {});
    }, version);
    const photo = (await p.evaluate(() => document.querySelector(".backdrop img").currentSrc)).includes("backdrop-tall") ? "olive tree" : "counter";
    const vlabel = `${label} ${photo}, ${version ? "greyscale" : "colour"}`;
    const frames = [];
    for (const [i, y] of [0, Math.round(max / 2), max].entries()) {
      await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(250);
      const f = `${SHOTS}/.room-${engineName}-${vp}-${version}-${i}.png`;
      await p.screenshot({ path: f }); frames.push(await decode(f));
    }
    const drift = Math.max(diff(frames[0], frames[1]), diff(frames[0], frames[2]));
    pass(`${vlabel}: the room stays put — identical at the top, middle and end of the page`, drift <= 2, `largest pixel change ${drift}`);
    const band = bandStats(frames[0], 0.34, 0.66), top = bandStats(frames[0], 0, 0.1), bottom = bandStats(frames[0], 0.9, 1);
    // The middle is black; outside it the photograph shows through. How much
    // depends on the picture — the olive tree's lower third is dark asphalt,
    // which comes through as next to nothing — so it is asked of the top or
    // the bottom, and both are reported.
    pass(`${vlabel}: black through the middle, the room faintly outside it`,
      band.maxCh <= 12 && Math.max(top.mean, bottom.mean) > band.mean * 1.3,
      `middle ≤ ${band.maxCh}/255 · mean luminance top ${top.mean.toFixed(4)}, middle ${band.mean.toFixed(4)}, bottom ${bottom.mean.toFixed(4)}`);

    // Contrast of the page's text colours over the brightest part of the room,
    // anywhere below the header. "The background behind the text" is taken as
    // the room averaged over about a letter's width (a 6px blur), so a
    // downlight a few pixels across counts as what a line of text actually
    // sits on; the single brightest pixel is reported alongside.
    const hdr = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hdr-h")) || 64);
    const local = await sharp(frames[0].data, { raw: { width: frames[0].w, height: frames[0].h, channels: 3 } }).blur(6).raw().toBuffer();
    const worst = bandStats({ data: local, w: frames[0].w, h: frames[0].h }, hdr / h, 1).brightest;
    const spot = bandStats(frames[0], hdr / h, 1).brightest;
    const colours = await p.evaluate(() => {
      const v = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
      return { text: v("--fg"), quiet: v("--fg-quiet"), faint: v("--fg-faint"), amber: v("--amber") };
    });
    const ratios = Object.fromEntries(Object.entries(colours).map(([k, c]) => [k, contrast(hex(c), worst)]));
    pass(`${vlabel}: every text colour holds 4.5:1 over the brightest part of the room`,
      Object.values(ratios).every((r) => r >= 4.5),
      `over rgb(${worst.join(",")}): ` + Object.entries(ratios).map(([k, r]) => `${k} ${r.toFixed(2)}`).join(", ")
        + ` · single brightest pixel rgb(${spot.join(",")}): faint ${contrast(hex(colours.faint), spot).toFixed(2)}`);
    }
    await ctx.close();
  }
  if (engine !== b) await engine.close();
}
for (const f of fs.readdirSync(SHOTS).filter((f) => f.startsWith(".room-"))) fs.rmSync(path.join(SHOTS, f));

/* ── 6 · The pictures to look at ───────────────────────────────────────── */
console.log("screenshots");
{
  const d = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); watch(d, "shots");
  await d.goto(`${B}/zh/`, { waitUntil: "load" }); await ready(d); await d.waitForTimeout(600);
  await d.screenshot({ path: `${SHOTS}/1-zh-desktop-top.png` });
  const max = await d.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await d.evaluate((y) => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, y); }, Math.round(max * 0.45)); await d.waitForTimeout(600);
  await d.screenshot({ path: `${SHOTS}/4-zh-mid-page-black-band.png` });
  await d.evaluate((y) => window.scrollTo(0, y), max); await d.waitForTimeout(2500);
  await d.screenshot({ path: `${SHOTS}/5-zh-visit-and-footer.png` });
  await d.goto(`${B}/zh/courses/zen-san/`, { waitUntil: "load" }); await ready(d); await d.waitForTimeout(600);
  await d.screenshot({ path: `${SHOTS}/3-zh-course-zen-san.png` });
  await d.context().close();

  // The same phone screen at the top, the middle and the end, side by side:
  // the page moves, the room behind it does not.
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })).newPage(); watch(m, "shots phone");
  await m.goto(`${B}/zh/`, { waitUntil: "load" }); await ready(m); await m.waitForTimeout(600);
  const mm = await m.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const parts = [];
  for (const [i, y] of [0, Math.round(mm / 2), mm].entries()) {
    await m.evaluate((y) => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, y); }, y); await m.waitForTimeout(700);
    parts.push({ input: await m.screenshot(), left: i * (780 + 24), top: 0 });
  }
  await sharp({ create: { width: 780 * 3 + 48, height: 1688, channels: 3, background: "#262626" } }).composite(parts).png().toFile(`${SHOTS}/6-zh-scroll-comparison.png`);
  await m.context().close();
  pass("six screenshots written", fs.readdirSync(SHOTS).filter((f) => /^\d-.*\.png$/.test(f)).length >= 6, SHOTS);
}

pass("no script errors or console errors", errs.length === 0, errs.slice(0, 4).join(" | "));
await b.close();
console.log(failed ? `\n${failed} FAILED` : "\nall passed");
process.exit(failed ? 1 : 0);
