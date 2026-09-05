import { chromium } from "playwright";
const URL_ = "https://script.google.com/macros/s/AKfycbxGeM_cfinzTauq7smWdOY-ruVhn_Ao3GVAfFOLOcws4D1fQHoyfjrH56JDLsmwG2Wthg/exec";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
// A real page origin, so this is a genuine cross-origin request.
await p.goto("http://localhost:4600/", { waitUntil: "domcontentloaded" });

const run = (mode) => p.evaluate(async ([url, mode]) => {
  const body = JSON.stringify({ secret: "wrong-on-purpose", booking: {} });
  try {
    const opts = { method: "POST", body, redirect: "follow" };
    if (mode === "textplain") opts.headers = { "Content-Type": "text/plain;charset=utf-8" };
    if (mode === "json") opts.headers = { "Content-Type": "application/json" };
    if (mode === "nocors") { opts.mode = "no-cors"; opts.headers = { "Content-Type": "text/plain" }; }
    const r = await fetch(url, opts);
    let t = "";
    try { t = (await r.text()).slice(0, 90); } catch (e) { t = "(opaque)"; }
    return { ok: true, status: r.status, type: r.type, body: t };
  } catch (e) { return { ok: false, err: String(e).slice(0, 110) }; }
}, [URL_, mode]);

for (const m of ["textplain", "json", "nocors"]) {
  const r = await run(m);
  console.log(m.padEnd(11), JSON.stringify(r));
}
await b.close();
