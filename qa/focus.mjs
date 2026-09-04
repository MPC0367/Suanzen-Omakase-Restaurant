import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:4321/en#courses", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
// Focus the CTA inside the third course, which starts collapsed.
const r = await p.evaluate(async () => {
  const rows = [...document.querySelectorAll(".course")];
  const target = rows[2];
  const link = target.querySelector("a.btn");
  link.focus();
  await new Promise((res) => setTimeout(res, 700));
  const box = link.getBoundingClientRect();
  return {
    courseActive: target.classList.contains("is-active"),
    linkVisible: box.height > 0 && box.width > 0,
    linkHeight: Math.round(box.height),
    focused: document.activeElement === link,
  };
});
console.log("focusing a collapsed course's CTA:", JSON.stringify(r, null, 1));
await b.close();
