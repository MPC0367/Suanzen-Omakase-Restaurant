/**
 * The matte logo, made from the restaurant's own mark.
 *
 *   node scripts/make-matte-logo.cjs
 *
 * Reads public/brand/logo.jpg — the restaurant's gold mark on black, glossy,
 * recovered at 1284px from its Facebook profile — and writes the matte
 * versions the site uses:
 *
 *   public/brand/logo-matte.png       1284px  the master
 *   public/brand/logo-matte-512.png    512px  the header, footer and curtain mark
 *   src/app/icon.png                   512px  the favicon
 *   src/app/apple-icon.png             180px  the home-screen icon
 *
 * Nothing is redrawn. Every edge comes from the source's own coverage: pixels
 * well inside a shape are fully covered; edge pixels are measured against the
 * gold around them (the ground is pure black, so this is exact). Only the
 * colour is replaced: the source's own mid-tone gold, 15% less saturated, with
 * a trace (±3 L*) of its light from the upper right, on warm ink #0B0B08. The
 * highlights, the metallic gradient and the pale sharpening rim are gone.
 * No vector master exists; when the restaurant supplies one, redo this from it.
 */
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const INK = [0x0b, 0x0b, 0x08];
const DESAT = 0.85;   // chroma kept from the source mid-tone
const K = 0.15;       // share of the source's light direction kept
const BAND = 3;       // at most ±3 L* of it

/* ── sRGB (D65) <-> CIELAB ─────────────────────────────────────────────── */
const s2l = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const l2s = (c) => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(v * 255))); };
const Xn = 0.95047, Yn = 1, Zn = 1.08883;
const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const fi = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
function rgb2lab(r, g, b) {
  const R = s2l(r), G = s2l(g), B = s2l(b);
  const X = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B;
  const Y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const Z = 0.0193339 * R + 0.119192 * G + 0.9503041 * B;
  const fx = f(X / Xn), fy = f(Y / Yn), fz = f(Z / Zn);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function lab2rgb(L, a, b) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const X = Xn * fi(fx), Y = Yn * fi(fy), Z = Zn * fi(fz);
  return [
    l2s(3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z),
    l2s(-0.969266 * X + 1.8760108 * Y + 0.041556 * Z),
    l2s(0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z),
  ];
}
const lch2rgb = (L, C, h) => lab2rgb(L, C * Math.cos((h * Math.PI) / 180), C * Math.sin((h * Math.PI) / 180));
const median = (a) => { const s = Float64Array.from(a).sort(); return s[Math.floor(s.length / 2)]; };
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; for (let q = c; q <= n; q++) M[r][q] -= k * M[c][q]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

(async () => {
  const src = path.join(ROOT, "public/brand/logo.jpg");
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;

  // Which pixels are gold, and which are well inside a shape.
  const L = new Float32Array(N), Ch = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const lab = rgb2lab(data[3 * i], data[3 * i + 1], data[3 * i + 2]);
    L[i] = lab[0]; Ch[i] = Math.hypot(lab[1], lab[2]);
  }
  const gold = new Uint8Array(N);
  for (let i = 0; i < N; i++) gold[i] = Ch[i] > 18 && L[i] > 22 ? 1 : 0;
  const interior = new Uint8Array(N);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    let ok = 1;
    for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (!gold[(y + dy) * W + x + dx]) { ok = 0; break; }
    interior[y * W + x] = ok;
  }
  const inside = [];
  for (let i = 0; i < N; i++) if (interior[i]) inside.push(i);

  // Smooth fields over the gold: its red channel (for coverage) and its L* (for the light).
  const feats = (i) => { const x = (i % W) / W, y = Math.floor(i / W) / H; return [1, x, y, x * x, x * y, y * y]; };
  const fit = (valOf) => {
    const A = Array.from({ length: 6 }, () => new Float64Array(6)), b = new Float64Array(6);
    for (const i of inside) { const ft = feats(i), v = valOf(i); for (let p = 0; p < 6; p++) { b[p] += ft[p] * v; for (let q = 0; q < 6; q++) A[p][q] += ft[p] * ft[q]; } }
    return solve(A, b);
  };
  const at = (c, i) => feats(i).reduce((s, v, k) => s + v * c[k], 0);
  const cR = fit((i) => data[3 * i]);
  const resid = inside.map((i) => data[3 * i] - at(cR, i)).sort((a, b) => a - b);
  const margin = -resid[Math.floor(0.05 * resid.length)];
  const cL = fit((i) => L[i]);

  // Coverage: interior pixels are fully covered; edge pixels against the local gold.
  const FLOOR = 0.02;
  const alpha = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (interior[i]) { alpha[i] = 1; continue; }
    const R = data[3 * i];
    if (R === 0) continue;
    let a = Math.min(1, R / Math.max(60, at(cR, i) - margin));
    alpha[i] = a < FLOOR ? 0 : (a - FLOOR) / (1 - FLOOR);
  }

  // The colour: the source's own mid-tone, a little quieter, a trace of its light.
  const labs = inside.map((i) => rgb2lab(data[3 * i], data[3 * i + 1], data[3 * i + 2]));
  const med = [0, 1, 2].map((k) => median(labs.map((l) => l[k])));
  const midL = med[0], midC = Math.hypot(med[1], med[2]) * DESAT, midH = (Math.atan2(med[2], med[1]) * 180 / Math.PI + 360) % 360;
  const cache = new Map();
  const colourAt = (i) => {
    const l = midL + Math.max(-BAND, Math.min(BAND, K * (at(cL, i) - midL)));
    const key = Math.round(l * 10);
    if (!cache.has(key)) cache.set(key, lch2rgb(key / 10, midC, midH));
    return cache.get(key);
  };

  const out = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) {
    const a = alpha[i], c = a > 0 ? colourAt(i) : INK;
    for (let k = 0; k < 3; k++) out[3 * i + k] = Math.round(INK[k] + (c[k] - INK[k]) * a);
  }
  const img = sharp(out, { raw: { width: W, height: H, channels: 3 } });
  const write = (px, file) =>
    (px === W ? img.clone() : img.clone().resize(px, px, { kernel: "lanczos3" })).png({ compressionLevel: 9 }).toFile(path.join(ROOT, file));
  await Promise.all([
    write(W, "public/brand/logo-matte.png"),
    write(512, "public/brand/logo-matte-512.png"),
    write(512, "src/app/icon.png"),
    write(180, "src/app/apple-icon.png"),
  ]);
  console.log(`matte gold ${hex(lch2rgb(midL - BAND, midC, midH))}–${hex(lch2rgb(midL + BAND, midC, midH))} on ${hex(INK)}; ${W}px master, 512 and 180 written`);
})();
