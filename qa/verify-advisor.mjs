/**
 * The course advisor's contract. Can a guest tell — in a glance, then a few
 * taps — which Suan Zen course is right for each person dining, see why, and
 * reserve it without retyping the course? And does every page stay unlisted,
 * free of anything still waiting on the restaurant?
 *
 *   node qa/verify-advisor.mjs [base]      default http://localhost:4325
 *
 * Run against a static build (node scripts/export.mjs --base "").
 */
import { chromium } from "playwright";
const B = (process.argv[2] || "http://localhost:4325").replace(/\/$/, "");
const b = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const errs = [];
let failed = 0;
const pass = (n, ok, x = "") => { if (!ok) failed++; console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const ready = (p) => p.waitForFunction(() => !document.querySelector(".curtain"), null, { timeout: 25000 });

const SLUGS = ["zen-kids", "zen-ichi", "zen-ni", "zen-san", "zen-boss", "zen-yon", "zen-sweet"];
const EN = { "zen-kids": "Zen Kids", "zen-ichi": "Zen Ichi", "zen-ni": "Zen Ni", "zen-san": "Zen San", "zen-boss": "Zen Boss", "zen-yon": "Zen Yon", "zen-sweet": "Zen Sweet" };
const ogOf = (html) => (html.match(/<meta (?:property|name)="(?:og|twitter):[^>]*>/g) || []).join("\n");

/* ── Every page: there, unlisted, nothing internal, no stale LINE ID ─────── */
console.log("every page");
const paths = ["/en/", "/th/", "/zh/", ...SLUGS.flatMap((s) => [`/en/courses/${s}/`, `/th/courses/${s}/`, `/zh/courses/${s}/`])];
const bad = [];
for (const p of paths) {
  const r = await fetch(B + p);
  const h = await r.text();
  if (r.status !== 200) bad.push(`${p} HTTP ${r.status}`);
  if (!/<meta name="robots" content="noindex, nofollow"/.test(h)) bad.push(`${p} not noindex, nofollow`);
  if (h.includes("[VERIFY")) bad.push(`${p} shows a [VERIFY note`);
  // @suan.zen.omakase is the restaurant's real TikTok handle (its footer link);
  // it must just never stand in for the LINE ID, which is @suanzenomakase.
  if (h.replace(/tiktok\.com\/@suan\.zen\.omakase/g, "").includes("@suan.zen.omakase")) bad.push(`${p} shows the old LINE ID`);
  if (/<form[\s>]/.test(h)) bad.push(`${p} has a form`);
}
pass(`all ${paths.length} pages load, unlisted, with no form, no [VERIFY note and no stale LINE ID`, bad.length === 0, bad.join("; "));

// Nothing internal in the scripts the pages load, either: a note no component
// renders can still ride along in a JavaScript chunk.
const scripts = new Set();
for (const p of paths) {
  const h = await (await fetch(B + p)).text();
  for (const [, src] of h.matchAll(/<script[^>]+src="([^"]+)"/g)) scripts.add(src);
}
const inJs = [];
for (const src of scripts) {
  const js = await (await fetch(new URL(src, B + "/").href)).text();
  if (js.includes("[VERIFY") || js.includes("847pimpq")) inJs.push(src.split("/").pop());
}
pass(`none of the ${scripts.size} scripts the pages load carries an internal note`, scripts.size > 0 && inJs.length === 0, inJs.join(", "));

const leaks = [];
for (const s of SLUGS) for (const l of ["en", "th", "zh"]) {
  const og = ogOf(await (await fetch(`${B}/${l}/courses/${s}/`)).text());
  if (/฿|\b\d,\d{3}\b/.test(og)) leaks.push(`${l}/${s}`);
  if (!/\/og\/suan-zen\.jpg/.test(og)) leaks.push(`${l}/${s} image`);
}
pass("no course's link preview carries a price, and every one uses the /og/ picture", leaks.length === 0, leaks.join(", "));

const ichi = await (await fetch(`${B}/en/courses/zen-ichi/`)).text();
pass("Zen Ichi's link preview names the course and its age", /og:title" content="Zen Ichi — 14 items · Ages 12–14/.test(ichi),
     (ogOf(ichi).match(/og:title" content="([^"]*)"/) || [])[1] || "no og:title");
pass("each course page is its own canonical address", /<link rel="canonical" href="[^"]*\/en\/courses\/zen-ichi\/"/.test(ichi));

const stub = await (await fetch(`${B}/courses/zen-ichi/`)).text();
pass("/courses/zen-ichi/ — the link staff can send — is unlisted and previews as the course",
     stub.includes('content="noindex, nofollow"') && /og:title" content="Zen Ichi/.test(stub));

/* ── Phone: the family at a glance, the finder, the courses ──────────────── */
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
m.on("pageerror", (e) => errs.push("phone: " + String(e).slice(0, 140)));
await m.goto(`${B}/courses/zen-ichi/`, { waitUntil: "domcontentloaded" });
await m.waitForURL(/\/(en|th|zh)\/courses\/zen-ichi\/$/, { timeout: 8000 }).catch(() => {});
pass("…and forwards the guest to that course", /\/(en|th|zh)\/courses\/zen-ichi\/$/.test(new URL(m.url()).pathname), new URL(m.url()).pathname);

await m.goto(`${B}/en/`, { waitUntil: "domcontentloaded" }); await ready(m);
console.log("phone");
const fam = await m.$$eval(".family__step", (ss) => ss.map((s) => ({
  who: s.querySelector(".family__who")?.textContent.trim(),
  courses: [...s.querySelectorAll(".family__name")].map((n) => n.textContent.trim()),
  bottom: Math.round(s.getBoundingClientRect().bottom),
})));
pass("the family test: a 9-year-old, a 13-year-old and two adults are all answered on the first screen",
     fam.length === 3 && fam[0].courses.join() === "Zen Kids" && fam[1].courses.join() === "Zen Ichi"
       && fam[2].courses.join() === "Zen Ni,Zen San,Zen Boss,Zen Yon" && fam[2].bottom <= 844,
     fam.map((f) => `${f.who}: ${f.courses.join(" / ")}`).join(" | ") + ` · ends at ${fam[2]?.bottom}px of 844`);

await m.locator(".family__course", { hasText: "Zen Ichi" }).tap(); await m.waitForTimeout(1600);
const landed = await m.evaluate(() => ({
  c: Math.round(document.getElementById("course-zen-ichi").getBoundingClientRect().top),
  bar: Math.round(document.querySelector(".menu__jump").getBoundingClientRect().bottom),
}));
pass("tapping a course in the family path brings it just under the course bar", landed.c >= landed.bar - 2 && landed.c < landed.bar + 140,
     `course at ${landed.c}px, bar ends ${landed.bar}px`);

const tags = await m.$$eval(".course", (cs) => cs.map((c) => c.querySelector(".course__tag")?.textContent.trim()));
pass("every course says who it is for", tags.join("|") === "Ages 7–11|Ages 12–14|Adults|Adults|Adults|Adults|Dessert", tags.join(" · "));
const whys = await m.$$eval(".course", (cs) => cs.map((c) => [...c.querySelectorAll(".advice dt")].some((d) => d.textContent.startsWith("Why choose"))));
pass("each adult course, and only those, says why you'd choose it", whys.join() === "false,false,true,true,true,true,false", whys.join());
const yonBest = await m.locator("#course-zen-yon .advice__best").first().textContent();
pass("the beef course is marked for beef lovers", yonBest.trim() === "Beef lovers", yonBest.trim());

const reserve = await m.locator("#course-zen-ni .course__acts .btn").getAttribute("href");
pass("a course's Reserve opens LINE with that course in the message",
     reserve.startsWith("https://line.me/R/oaMessage/%40suanzenomakase/?") && decodeURIComponent(reserve.split("?")[1]).includes("I'd like to book Zen Ni."),
     decodeURIComponent(reserve.split("?")[1] || "").split("\n")[0]);

// The finder: two or three taps to one course, and one to look at next.
const start = async () => {
  await m.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await m.waitForTimeout(200);
  if ((await m.locator(".finder__open").getAttribute("aria-expanded")) !== "true") await m.locator(".finder__open").tap();
  if (await m.locator(".finder__result").count()) await m.locator(".finder__text", { hasText: "Start again" }).tap();
  await m.waitForTimeout(150);
};
const flows = [
  [["A child"], "Zen Kids"],
  [["A teenager"], "Zen Ichi"],
  [["An adult", "Beef"], "Zen Yon"],
  [["An adult", "Fish and seafood", "16"], "Zen Ni"],
  [["An adult", "Fish and seafood", "17, the most"], "Zen San"],
  [["An adult", "Fish and seafood", "12, with two choices"], "Zen Boss"],
];
for (const [steps, want] of flows) {
  await start();
  for (const s of steps) { await m.locator(".finder__a", { hasText: s }).first().tap(); await m.waitForTimeout(220); }
  const got = (await m.locator(".finder__name").textContent().catch(() => ""))?.trim();
  pass(`finder: ${steps.join(" → ")} → ${want}`, got === want, got || "no result");
}
const focus = await m.evaluate(() => !!document.activeElement?.closest(".finder__result"));
pass("the result takes the focus, for a screen reader and a keyboard", focus);
const seaNote = await m.locator(".finder__result .finder__note").count();
pass("a seafood answer says the restaurant hasn't named one seafood course", seaNote === 1);
const also = await m.locator(".finder__also a").textContent().catch(() => "");
pass("it offers one other course to look at", also.trim() === "Zen Ni", also.trim());
const fReserve = await m.locator(".finder__result .btn").getAttribute("href");
pass("the recommendation's Reserve carries that course", decodeURIComponent(fReserve.split("?")[1] || "").includes("Zen Boss"));

await start();
await m.locator(".finder__a", { hasText: "An adult" }).tap(); await m.waitForTimeout(200);
await m.locator(".finder__a", { hasText: "Not sure yet" }).tap(); await m.waitForTimeout(200);
pass("\"not sure yet\" leads to the comparison", (await m.locator('.finder__result a[href="#compare"]').count()) === 1);
await m.locator('.finder__result a[href="#compare"]').tap(); await m.waitForTimeout(1400);
const clear = await m.evaluate(() => {
  const h = document.querySelector(".compare__h").getBoundingClientRect();
  return !!document.elementFromPoint(h.left + 8, h.top + 6)?.closest("#compare");
});
pass("…and lands with the comparison's heading clear of the header", clear);
await start();
await m.locator(".finder__a", { hasText: "An adult" }).tap(); await m.waitForTimeout(200);
await m.locator(".finder__text", { hasText: "Back" }).tap(); await m.waitForTimeout(200);
pass("Back returns to the first question", (await m.locator(".finder__legend").textContent()).trim() === "Who is dining?");

// The comparison: two courses side by side on a phone.
await m.locator("#compare").scrollIntoViewIfNeeded(); await m.waitForTimeout(300);
const shown = () => m.$$eval(".compare__table thead th[data-course]", (ths) => ths.filter((t) => getComputedStyle(t).display !== "none").map((t) => t.textContent.trim()));
const v1 = await shown();
pass("on a phone, the comparison sets two courses side by side", v1.length === 2, v1.join(" vs "));
await m.locator(".compare__chip", { hasText: "Zen Yon" }).tap(); await m.waitForTimeout(200);
const v2 = await shown();
pass("choosing a third swaps out the one chosen first", v2.length === 2 && v2.includes("Zen Yon") && !v2.includes(v1[0]), v2.join(" vs "));

const lineId = await m.locator("#visit").textContent();
pass("Visit shows the restaurant's real LINE ID", lineId.includes("@suanzenomakase"));
const logo = await m.locator(".hdr .mark__img").getAttribute("src");
pass("the header carries the restaurant's logo", /logo-320\.png/.test(logo || ""), logo || "none");

// A course on its own page.
await m.goto(`${B}/en/courses/zen-ichi/`, { waitUntil: "domcontentloaded" }); await ready(m);
const page = await m.evaluate(() => ({
  h1: document.querySelector("h1")?.textContent.trim(),
  tag: document.querySelector(".cdetail__tag")?.textContent.trim(),
  dishes: document.querySelectorAll(".dish").length,
  reserve: document.querySelector(".cdetail .course__acts .btn")?.getAttribute("href") || "",
}));
pass("Zen Ichi's own page: its name, its age, all 14 items, and Reserve",
     page.h1 === "Zen Ichi" && page.tag === "Ages 12–14" && page.dishes === 14 && page.reserve.includes("oaMessage"),
     `${page.h1} · ${page.tag} · ${page.dishes} items`);
await m.locator(".lang__btn").tap();
await m.locator('.lang__opt[hreflang="th"]').tap();
await m.waitForURL(/\/th\/courses\/zen-ichi\//, { timeout: 8000 }).catch(() => {});
pass("switching to Thai keeps the guest on the course", /\/th\/courses\/zen-ichi\/$/.test(new URL(m.url()).pathname), new URL(m.url()).pathname);

/* ── Thai ────────────────────────────────────────────────────────────────── */
console.log("thai");
await m.goto(`${B}/th/`, { waitUntil: "domcontentloaded" }); await ready(m);
pass("Thai: the page asks the question in Thai", (await m.locator("h1").textContent()).trim() === "คอร์สไหนเหมาะกับคุณ");
await m.locator(".finder__open").tap();
await m.locator(".finder__a", { hasText: "น้อง" }).tap(); await m.waitForTimeout(250);
pass("Thai: the finder answers a child with เซน คิดส์", (await m.locator(".finder__name").textContent()).trim() === "เซน คิดส์");
const thReserve = await m.locator("#course-zen-ni .course__acts .btn").getAttribute("href");
pass("Thai: Reserve writes the message in Thai", decodeURIComponent(thReserve.split("?")[1] || "").startsWith("ขอจองคอร์ส เซน นิ (Zen Ni)"));

/* ── Simplified Chinese ─────────────────────────────────────────────────── */
console.log("chinese");
await m.goto(`${B}/zh/`, { waitUntil: "domcontentloaded" }); await ready(m);
pass("Chinese: the page is marked zh-CN", (await m.evaluate(() => document.documentElement.lang)) === "zh-CN");
pass("Chinese: the page asks the question in Chinese", /[\u4e00-\u9fff]/.test((await m.locator("h1").textContent()) || ""),
     (await m.locator("h1").textContent())?.trim());
const zhReserve = await m.locator("#course-zen-ni .course__acts .btn").getAttribute("href");
pass("Chinese: Reserve writes the message in Chinese",
     decodeURIComponent(zhReserve.split("?")[1] || "") === "您好，我想预约 Zen Ni 套餐。\n日期：\n用餐时段：\n人数：\n过敏食物或忌口：",
     JSON.stringify(decodeURIComponent(zhReserve.split("?")[1] || "")).slice(0, 80));

/* ── Desktop ─────────────────────────────────────────────────────────────── */
console.log("desktop");
const d = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
d.on("pageerror", (e) => errs.push("desktop: " + String(e).slice(0, 140)));
await d.goto(`${B}/en/`, { waitUntil: "domcontentloaded" }); await ready(d);
const closed = await d.$$eval(".course:not(.is-open)", (cs) => cs.map((c) => {
  const t = c.querySelector(".course__tag");
  return !!t && t.getBoundingClientRect().height > 0;
}));
pass("every closed course still shows who it is for", closed.length >= 6 && closed.every(Boolean), `${closed.filter(Boolean).length} of ${closed.length} closed courses`);
const cols = await d.$$eval(".compare__table thead th[data-course]", (ths) => ths.filter((t) => getComputedStyle(t).display !== "none").length);
pass("on a desktop, the comparison shows all four adult courses", cols === 4, `${cols} columns`);
pass("the comparison is a real table, with row and column headers",
     (await d.locator(".compare__table th[scope=col]").count()) === 5 && (await d.locator(".compare__table th[scope=row]").count()) === 4);

await d.locator(".menu__jump .jump", { hasText: "Zen Kids" }).click(); await d.waitForTimeout(800);
pass("Zen Kids shows its own dishes, and they load",
     await d.evaluate(() => { const pics = [...document.querySelectorAll("#course-zen-kids .cgal__item:not([aria-hidden]) img")];
       return pics.length > 0 && pics.every((i) => i.complete && i.naturalWidth > 0); }));

/* Opened AND brought into view: the pictures are fetched lazily, so a rail
   still parked below the fold holds nothing through no fault of the page. */
await d.locator(".menu__jump .jump", { hasText: "Zen Ni" }).click(); await d.waitForTimeout(400);
await d.locator("#course-zen-ni").scrollIntoViewIfNeeded();
await d.waitForFunction(() => { const pics = [...document.querySelectorAll("#course-zen-ni .cgal__item:not([aria-hidden]) img")];
  return pics.length > 0 && pics.every((i) => i.complete && i.naturalWidth > 0); }, null, { timeout: 15000 }).catch(() => {});
pass("Zen Ni shows the pictures the restaurant sent for it, each named for its dish",
     await d.evaluate(() => { const pics = [...document.querySelectorAll("#course-zen-ni .cgal__item:not([aria-hidden])")];
       return pics.length > 0
         && pics.every((li) => { const i = li.querySelector("img"); return !!i && i.complete && i.naturalWidth > 0; })
         && pics.every((li) => (li.querySelector(".cgal__cap")?.textContent || "").trim().length > 3); }));
pass("the dish list is type alone — no photograph in it", (await d.locator(".dishes img").count()) === 0);
await d.locator("#course-zen-ni .course__acts .btn").click(); await d.waitForTimeout(700);
const msg = await d.locator(".res.is-open .res__msg").textContent().catch(() => null);
pass("on a desktop, Reserve opens the drawer with that course's message to copy", !!msg && msg.startsWith("Hello, I'd like to book Zen Ni."), (msg || "no drawer").split("\n")[0]);
await d.keyboard.press("Escape"); await d.waitForTimeout(400);
await d.locator(".hdr__cta").click(); await d.waitForTimeout(600);
pass("the header's Reserve still opens the general drawer", (await d.locator(".res.is-open .res__msg").count()) === 0);

console.log(errs.length ? "  JS errors:\n    " + errs.join("\n    ") : "  no JS errors");
await b.close();
process.exit(failed || errs.length ? 1 : 0);
