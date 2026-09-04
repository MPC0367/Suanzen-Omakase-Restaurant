/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QR — byte mode, error correction level M, versions 1–10.
 * ─────────────────────────────────────────────────────────────────────────────
 *  Enough to encode the restaurant's LINE link, with no third-party script and
 *  no network call. A guest scans this to open a real reservation channel, so
 *  the output is verified against a decoder before it ships (see qr.verify.mjs).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── GF(256), primitive polynomial 0x11D ──────────────────────────────────────
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function rsGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGenerator(ecLen);
  const res = new Uint8Array(ecLen);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    if (factor !== 0) for (let i = 0; i < ecLen; i++) res[i] ^= mul(gen[i + 1], factor);
  }
  return res;
}

// ── Version tables, error correction level M ─────────────────────────────────
/** [total codewords, ec codewords per block, group1 blocks, group2 blocks] */
const VERSIONS_M: Record<number, [number, number, number, number]> = {
  1: [26, 10, 1, 0],
  2: [44, 16, 1, 0],
  3: [70, 26, 1, 0],
  4: [100, 18, 2, 0],
  5: [134, 24, 2, 0],
  6: [172, 16, 4, 0],
  7: [196, 18, 4, 0],
  8: [242, 22, 2, 2],
  9: [292, 22, 3, 2],
  10: [346, 26, 4, 1],
};

const ALIGN: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

/** Data capacity in codewords for level M. */
function dataCodewords(version: number) {
  const [total, ecPerBlock, g1, g2] = VERSIONS_M[version];
  return total - ecPerBlock * (g1 + g2);
}

export type QrMatrix = { size: number; get: (x: number, y: number) => boolean };

export function encodeQR(text: string): QrMatrix {
  const bytes = new TextEncoder().encode(text);

  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const lenBits = v <= 9 ? 8 : 16;
    const need = Math.ceil((4 + lenBits + bytes.length * 8) / 8);
    if (need <= dataCodewords(v)) { version = v; break; }
  }
  if (!version) throw new Error("QR: content too long for version 10 / level M");

  const [, ecPerBlock, g1, g2] = VERSIONS_M[version];
  const totalBlocks = g1 + g2;
  const dataLen = dataCodewords(version);

  // ── Bit stream ─────────────────────────────────────────────────────────────
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  push(0b0100, 4);                              // byte mode
  push(bytes.length, version <= 9 ? 8 : 16);    // character count
  for (const b of bytes) push(b, 8);
  const cap = dataLen * 8;
  push(0, Math.min(4, cap - bits.length));      // terminator
  while (bits.length % 8) bits.push(0);
  const dataBytes = new Uint8Array(dataLen);
  for (let i = 0; i < bits.length / 8; i++) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i * 8 + j];
    dataBytes[i] = v;
  }
  for (let i = Math.ceil(bits.length / 8), t = 0; i < dataLen; i++, t++) {
    dataBytes[i] = t % 2 === 0 ? 0xec : 0x11;   // pad
  }

  // ── Split into blocks, compute ECC ─────────────────────────────────────────
  const shortLen = Math.floor(dataLen / totalBlocks);
  const blocks: Uint8Array[] = [];
  const eccs: Uint8Array[] = [];
  let off = 0;
  for (let b = 0; b < totalBlocks; b++) {
    const len = b < g1 ? shortLen : shortLen + 1;
    const blk = dataBytes.slice(off, off + len);
    off += len;
    blocks.push(blk);
    eccs.push(rsEncode(blk, ecPerBlock));
  }

  // ── Interleave ─────────────────────────────────────────────────────────────
  const out: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++)
    for (const b of blocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < ecPerBlock; i++) for (const e of eccs) out.push(e[i]);

  // ── Matrix ─────────────────────────────────────────────────────────────────
  const size = version * 4 + 17;
  const mod = Array.from({ length: size }, () => new Int8Array(size).fill(-1)); // -1 = free

  const setFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                       (c >= 0 && c <= 6 && (r === 0 || r === 6));
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        mod[rr][cc] = inRing || inCore ? 1 : 0;
      }
  };
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing
  for (let i = 8; i < size - 8; i++) {
    mod[6][i] = i % 2 === 0 ? 1 : 0;
    mod[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Alignment
  const ac = ALIGN[version];
  for (const r of ac)
    for (const c of ac) {
      if ((r <= 7 && c <= 7) || (r <= 7 && c >= size - 8) || (r >= size - 8 && c <= 7)) continue;
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          mod[r + dr][c + dc] =
            Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0;
    }

  mod[size - 8][8] = 1; // dark module

  // Reserve format areas
  for (let i = 0; i < 9; i++) {
    if (mod[8][i] === -1) mod[8][i] = 0;
    if (mod[i][8] === -1) mod[i][8] = 0;
  }
  for (let i = 0; i < 8; i++) {
    if (mod[8][size - 1 - i] === -1) mod[8][size - 1 - i] = 0;
    if (mod[size - 1 - i][8] === -1) mod[size - 1 - i][8] = 0;
  }
  // Version info (v7+)
  if (version >= 7) {
    let d = version;
    for (let i = 0; i < 12; i++) d = (d << 1) ^ ((d >>> 11) * 0x1f25);
    const vBits = (version << 12) | d;
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >> i) & 1) as 0 | 1;
      mod[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
      mod[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
    }
  }

  const reserved = mod.map((row) => Int8Array.from(row, (v) => (v === -1 ? 0 : 1)));

  // Place data in the zig-zag
  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip the vertical timing column
    for (let vert = 0; vert < size; vert++) {
      const y = upward ? size - 1 - vert : vert;
      for (let k = 0; k < 2; k++) {
        const x = right - k;
        if (reserved[y][x]) continue;
        const byte = out[bitIdx >> 3];
        const bit = byte === undefined ? 0 : (byte >> (7 - (bitIdx & 7))) & 1;
        mod[y][x] = bit as 0 | 1;
        bitIdx++;
      }
    }
    upward = !upward;
  }

  // ── Mask selection ─────────────────────────────────────────────────────────
  const maskFn = [
    (y: number, x: number) => (y + x) % 2 === 0,
    (y: number, _x: number) => y % 2 === 0,
    (_y: number, x: number) => x % 3 === 0,
    (y: number, x: number) => (y + x) % 3 === 0,
    (y: number, x: number) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (y: number, x: number) => ((y * x) % 2) + ((y * x) % 3) === 0,
    (y: number, x: number) => (((y * x) % 2) + ((y * x) % 3)) % 2 === 0,
    (y: number, x: number) => (((y + x) % 2) + ((y * x) % 3)) % 2 === 0,
  ];

  const applyFormat = (m: Int8Array[], mask: number) => {
    // Level M = 0b00. Five data bits, ten BCH(15,5) check bits, masked 0x5412.
    const fmt = (0b00 << 3) | mask;
    let d = fmt;
    for (let i = 0; i < 10; i++) d = (d << 1) ^ ((d >>> 9) * 0x537);
    const bitsF = (((fmt << 10) | d) ^ 0x5412) >>> 0;

    /** Position i in the sequence carries bit 14 - i (MSB first). */
    const bit = (i: number) => ((bitsF >> (14 - i)) & 1) as 0 | 1;

    // Copy 1 — wrapped around the top-left finder.
    const copy1: Array<[number, number]> = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
    ];
    copy1.forEach(([y, x], i) => { m[y][x] = bit(i); });

    // Copy 2 — split between the other two finders.
    const copy2: Array<[number, number]> = [];
    for (let i = 0; i < 8; i++) copy2.push([size - 1 - i, 8]);
    for (let i = 0; i < 7; i++) copy2.push([8, size - 7 + i]);
    copy2.forEach(([y, x], i) => { m[y][x] = bit(i); });

    m[size - 8][8] = 1; // the dark module is never part of the format
  };

  const penalty = (m: Int8Array[]) => {
    let p = 0;
    // Rule 1 — runs of five or more
    for (let i = 0; i < size; i++) {
      for (const line of [
        Array.from({ length: size }, (_, j) => m[i][j]),
        Array.from({ length: size }, (_, j) => m[j][i]),
      ]) {
        let run = 1;
        for (let j = 1; j < size; j++) {
          if (line[j] === line[j - 1]) run++;
          else { if (run >= 5) p += run - 2; run = 1; }
        }
        if (run >= 5) p += run - 2;
      }
    }
    // Rule 2 — 2×2 blocks
    for (let y = 0; y < size - 1; y++)
      for (let x = 0; x < size - 1; x++) {
        const a = m[y][x];
        if (a === m[y][x + 1] && a === m[y + 1][x] && a === m[y + 1][x + 1]) p += 3;
      }
    // Rule 3 — finder-like patterns
    const pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const rpat = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        for (const q of [pat, rpat]) {
          if (x + 11 <= size && q.every((v, k) => m[y][x + k] === v)) p += 40;
          if (y + 11 <= size && q.every((v, k) => m[y + k][x] === v)) p += 40;
        }
      }
    // Rule 4 — dark/light balance
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) dark += m[y][x];
    p += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return p;
  };

  let best: Int8Array[] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = mod.map((r) => Int8Array.from(r));
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (!reserved[y][x] && maskFn[mask](y, x)) m[y][x] ^= 1;
    applyFormat(m, mask);
    const s = penalty(m);
    if (s < bestScore) { bestScore = s; best = m; }
  }

  const final = best as Int8Array[];
  return { size, get: (x, y) => final[y][x] === 1 };
}

/** Render as a path string for a crisp, tiny SVG. */
export function qrPath(text: string): { size: number; d: string } {
  const m = encodeQR(text);
  let d = "";
  for (let y = 0; y < m.size; y++)
    for (let x = 0; x < m.size; x++)
      if (m.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
  return { size: m.size, d };
}
