/**
 * The stone the loading screen stands on, measured from the restaurant's own.
 *
 *   node scripts/make-stone.cjs [path/to/the-seal-on-stone.jpg]
 *
 * The restaurant supplied its seal on stone (public/brand/logo-stone.jpg): dark,
 * warm stone with a fine crinkled grain, lit from the upper right and falling
 * to near black at the lower left. The loading screen (the curtain) stands on
 * that same stone. Two small files carry it, both measured from the picture
 * rather than drawn:
 *
 *   src/assets/stone-light.png   64×64    the stone's colour and its light across
 *                                         the picture, the gold left out; the
 *                                         curtain stretches it to the screen and
 *                                         the browser smooths it as it scales
 *   src/assets/stone-grain.jpg   512×512  its grain: how much brighter or darker
 *                                         each point of stone is than the stone
 *                                         around it, pieced into a tile that
 *                                         repeats without a seam
 *
 * The curtain lays the grain over the light with `overlay`, which on a ground
 * this dark multiplies it by twice the tile: mid grey leaves the stone as it is,
 * and each point of the tile brightens or darkens it by just what was measured.
 * So the grain shows where the light falls and all but vanishes in the dark
 * corners, as it does in the logo.
 *
 * This replaced a stand-in ground — colours sampled from the same picture over
 * synthetic fractal noise, lit from the upper left and toward the middle —
 * that did not match the stone the seal is set in.
 */
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SRC = process.argv[2] || path.join(ROOT, "public/brand/logo-stone.jpg");
const OUT = path.join(ROOT, "src/assets");
const CELLS = 16;     // the light is measured on a 16 × 16 grid
const TILE = 512;     // the grain tile
const WIN = 64;       // grain patches pieced into it
const STEP = 40;      // placed every 40px, so neighbours overlap by 24
const FEATHER = 12;   // and crossfade over their outer 12px

const s2l = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const labOf = (r, g, b) => {
  const R = s2l(r), G = s2l(g), B = s2l(b);
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const Y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const Z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
};
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
// A fixed sequence of "random" choices, so the tile comes out the same every run.
const rng = (() => { let a = 7; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

/* A box blur, three times over (close to a gaussian), that only averages the
   pixels marked in `valid`: so stone next to gold is averaged with stone. */
function blurWhere(src, valid, W, H, r) {
  let v = Float32Array.from(src, (x, i) => (valid[i] ? x : 0));
  let w = Float32Array.from(valid, (x) => (x ? 1 : 0));
  const pass = (a, horiz) => {
    const o = new Float32Array(a.length), n = horiz ? W : H, m = horiz ? H : W;
    for (let j = 0; j < m; j++) {
      let s = 0;
      const at = (k) => (horiz ? j * W + k : k * W + j);
      for (let k = -r; k <= r; k++) s += a[at(Math.min(n - 1, Math.max(0, k)))];
      for (let k = 0; k < n; k++) {
        o[at(k)] = s / (2 * r + 1);
        s += a[at(Math.min(n - 1, k + r + 1))] - a[at(Math.max(0, k - r))];
      }
    }
    return o;
  };
  for (let p = 0; p < 3; p++) { v = pass(pass(v, true), false); w = pass(pass(w, true), false); }
  return v.map((x, i) => (w[i] > 1e-4 ? x / w[i] : 0));
}

(async () => {
  if (!fs.existsSync(SRC)) throw new Error(`No picture at ${SRC}. Pass its path: node scripts/make-stone.cjs path/to/seal-on-stone.jpg`);
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;

  /* Stone, not gold — told apart by colour more than by light. Measured on the
     logo: its stone never passes chroma 9, even in the brightest grain where it
     reaches L* 18; its gold sits at chroma 34–44 and its glints are pale but
     bright. So chroma over 12, or L* over 24, is gold, its glow, or its glint.
     The relief also darkens and warms the stone beside it, so everything within
     ~18px of gold is left out too. */
  const goldMask = Buffer.alloc(N);
  for (let i = 0; i < N; i++) {
    const [L, a, b] = labOf(data[3 * i], data[3 * i + 1], data[3 * i + 2]);
    goldMask[i] = Math.hypot(a, b) > 12 || L > 24 ? 255 : 0;
  }
  // One channel out, as one went in (sharp's blur hands back three otherwise).
  const near = await sharp(goldMask, { raw: { width: W, height: H, channels: 1 } }).blur(9).extractChannel(0).raw().toBuffer();
  if (near.length !== N) throw new Error(`gold margin came back ${near.length} bytes for ${N} pixels`);
  const stone = new Uint8Array(N);
  for (let i = 0; i < N; i++) stone[i] = near[i] < 6 ? 1 : 0;

  /* The light: the stone's mean colour in each cell, cells with too little
     stone filled in from their neighbours, then eased. */
  const cell = Array.from({ length: CELLS * CELLS }, () => ({ n: 0, c: [0, 0, 0] }));
  const cw = W / CELLS, ch = H / CELLS;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!stone[i]) continue;
    const k = Math.min(CELLS - 1, Math.floor(y / ch)) * CELLS + Math.min(CELLS - 1, Math.floor(x / cw));
    cell[k].n++;
    for (let q = 0; q < 3; q++) cell[k].c[q] += data[3 * i + q];
  }
  let grid = cell.map((c) => (c.n > 0.15 * cw * ch ? c.c.map((v) => v / c.n) : null));
  while (grid.some((g) => !g)) {
    grid = grid.map((g, k) => {
      if (g) return g;
      const cx = k % CELLS, cy = Math.floor(k / CELLS), got = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if ((dx || dy) && nx >= 0 && ny >= 0 && nx < CELLS && ny < CELLS && grid[ny * CELLS + nx]) got.push(grid[ny * CELLS + nx]);
      }
      return got.length ? [0, 1, 2].map((q) => got.reduce((s, v) => s + v[q], 0) / got.length) : null;
    });
  }
  const eased = grid.map((_, k) => {
    const cx = k % CELLS, cy = Math.floor(k / CELLS);
    let s = [0, 0, 0], n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= CELLS || ny >= CELLS) continue;
      const wgt = dx || dy ? 1 : 2;
      s = s.map((v, q) => v + wgt * grid[ny * CELLS + nx][q]); n += wgt;
    }
    return s.map((v) => v / n);
  });
  const lightRaw = Buffer.from(eased.flatMap((c) => c.map((v) => Math.round(v))));
  fs.mkdirSync(OUT, { recursive: true });
  await sharp(lightRaw, { raw: { width: CELLS, height: CELLS, channels: 3 } })
    .resize(64, 64, { kernel: "cubic" }).png({ compressionLevel: 9 }).toFile(path.join(OUT, "stone-light.png"));
  const mean = [0, 1, 2].map((q) => eased.reduce((s, c) => s + c[q], 0) / eased.length);

  /* The grain: each point of stone against the stone around it. Only stone lit
     enough to show its grain is used; in the dark it is crushed into the
     picture's compression and would only bring that along. */
  const Y = new Float32Array(N);
  for (let i = 0; i < N; i++) Y[i] = 0.2126 * data[3 * i] + 0.7152 * data[3 * i + 1] + 0.0722 * data[3 * i + 2];
  const local = blurWhere(Y, stone, W, H, 4);
  const g = new Float32Array(N), ok = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (stone[i] && local[i] > 12) { g[i] = Y[i] / local[i] - 1; ok[i] = 1; }
  // Ease the picture's 8×8 compression blocks out of it, a touch.
  const gs = blurWhere(g, ok, W, H, 1);
  const soft = g.map((v, i) => (ok[i] ? 0.55 * v + 0.45 * gs[i] : 0));

  // Every 64×64 window that is all lit stone is a patch to piece the tile from.
  const wins = [];
  for (let y = 0; y + WIN <= H; y += 6) for (let x = 0; x + WIN <= W; x += 6) {
    let all = true;
    for (let dy = 0; dy < WIN && all; dy += 4) for (let dx = 0; dx < WIN; dx += 4) if (!ok[(y + dy) * W + x + dx]) { all = false; break; }
    if (all) wins.push([x, y]);
  }
  if (wins.length < 12) throw new Error(`Only ${wins.length} clean stone patches; lower the light threshold`);

  /* Piece the tile: patches on a 40px grid, wrapping at the edges so the tile
     repeats without a seam, crossfaded where they overlap. Mixing two unrelated
     grains flattens them, so the mix keeps the grain's strength (weights whose
     squares sum to one) rather than letting the overlaps go smooth. */
  const acc = new Float32Array(TILE * TILE), w2 = new Float32Array(TILE * TILE);
  const ramp = (k) => { const e = Math.min(k, WIN - 1 - k); return e >= FEATHER ? 1 : Math.sin(((e + 0.5) / FEATHER) * Math.PI / 2); };
  for (let ty = 0; ty < TILE; ty += STEP) for (let tx = 0; tx < TILE; tx += STEP) {
    const [sx, sy] = wins[Math.floor(rng() * wins.length)];
    for (let dy = 0; dy < WIN; dy++) for (let dx = 0; dx < WIN; dx++) {
      const wgt = ramp(dx) * ramp(dy);
      const o = ((ty + dy) % TILE) * TILE + ((tx + dx) % TILE);
      acc[o] += wgt * soft[(sy + dy) * W + sx + dx];
      w2[o] += wgt * wgt;
    }
  }
  const tile = acc.map((v, i) => v / Math.sqrt(Math.max(w2[i], 1e-6)));
  // Its strength, matched to the stone's own: centred on nothing, spread as measured.
  const sdOf = (arr, pick) => { let n = 0, s = 0, s2 = 0; arr.forEach((v, i) => { if (pick(i)) { n++; s += v; s2 += v * v; } }); return [s / n, Math.sqrt(s2 / n - (s / n) ** 2)]; };
  const [, sdStone] = sdOf(soft, (i) => ok[i]);
  const [mTile, sdTile] = sdOf(tile, () => true);
  const px = Buffer.alloc(TILE * TILE);
  for (let i = 0; i < px.length; i++) px[i] = Math.max(0, Math.min(255, Math.round(128 * (1 + ((tile[i] - mTile) / sdTile) * sdStone))));
  await sharp(px, { raw: { width: TILE, height: TILE, channels: 1 } }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, "stone-grain.jpg"));

  const size = (f) => `${Math.round(fs.statSync(path.join(OUT, f)).size / 1024)} KB`;
  const at = (cx, cy) => hex(eased[cy * CELLS + cx]);
  console.log(`stone light: mean ${hex(mean)} · upper right ${at(CELLS - 1, 0)} · centre ${at(8, 8)} · lower left ${at(0, CELLS - 1)} (${size("stone-light.png")})`);
  console.log(`stone grain: ±${(sdStone * 100).toFixed(1)}% around the stone's own light, from ${wins.length} patches (${size("stone-grain.jpg")})`);
})().catch((e) => { console.error(e.message); process.exit(1); });
