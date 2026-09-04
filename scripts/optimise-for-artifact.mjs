import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'public/photos';
const OUT = '/tmp/artifact-photos';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Big enough to look right on a laptop, small enough that 80 of them fit
// inside an artifact's 16MB ceiling once base64 adds its third.
const MAX = 1100;
const QUALITY = 62;

let before = 0, after = 0;
const report = [];

for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith('.jpg'))) {
  const src = path.join(SRC, f);
  const meta = await sharp(src).metadata();
  const b = fs.statSync(src).size;
  before += b;

  let img = sharp(src).rotate();
  // Only ever shrink — never invent pixels that were not there.
  if (Math.max(meta.width, meta.height) > MAX) {
    img = img.resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  }
  const buf = await img.jpeg({ quality: QUALITY, mozjpeg: true, progressive: true }).toBuffer();

  // If compressing made it bigger, keep the original.
  const keep = buf.length < b ? buf : fs.readFileSync(src);
  fs.writeFileSync(path.join(OUT, f), keep);
  after += keep.length;
  report.push({ f, w: meta.width, h: meta.height, b, a: keep.length });
}

report.sort((x, y) => y.a - x.a);
console.log('largest after optimising:');
report.slice(0, 5).forEach((r) =>
  console.log(`  ${r.f}  ${r.w}x${r.h}  ${(r.b/1024).toFixed(0)}KB -> ${(r.a/1024).toFixed(0)}KB`));
console.log(`\n${report.length} photos`);
console.log(`before: ${(before/1024/1024).toFixed(1)} MB`);
console.log(`after:  ${(after/1024/1024).toFixed(1)} MB`);
console.log(`as base64 (+33%): ${(after*1.34/1024/1024).toFixed(1)} MB  ${after*1.34 < 15.2*1024*1024 ? 'fits under 16MB ✓' : 'STILL TOO BIG ✗'}`);
