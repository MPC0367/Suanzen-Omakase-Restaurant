/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BRAND PLATE
 * ─────────────────────────────────────────────────────────────────────────────
 *  Suan Zen has not supplied photography, and using someone else's food photos
 *  — or AI-generated pictures of dishes this kitchen has never served — would
 *  misrepresent the restaurant. So every media slot renders brand artwork
 *  instead, mixed from the colours sampled off the restaurant's own logo.
 *
 *  It does not pretend to be a photograph. Trying to draw a counter and a
 *  planting in vectors just reads as a bad drawing of a restaurant. What it
 *  does instead is hold light: a warm field, one amber source off to a side,
 *  a single hairline, grain. It looks deliberate at any size, it recedes and
 *  lets the typography lead, and it is obviously a place for a picture.
 *
 *  When photographs arrive, <Media> shows them and this becomes the loading
 *  and failure state underneath. Nothing about the layout changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Tone = "dawn" | "day" | "dusk" | "night" | "ember";
/** Kept so slots can declare what they are for; it steers the light, not props. */
export type Motif = "counter" | "garden" | "plate";

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pal = { a: string; b: string; c: string; light: string; glow: number; line: string };

const PALETTE: Record<Tone, Pal> = {
  dawn:  { a: "#4e4230", b: "#2a2114", c: "#15100a", light: "#ffe6a3", glow: 0.44, line: "#d9bd94" },
  day:   { a: "#ded1b6", b: "#bda781", c: "#7d6647", light: "#fffdf6", glow: 0.5,  line: "#5a4530" },
  dusk:  { a: "#33495f", b: "#1c2836", c: "#0e151d", light: "#f4c92b", glow: 0.48, line: "#c99a45" },
  night: { a: "#282a1d", b: "#16180f", c: "#0a0b07", light: "#f4c92b", glow: 0.48, line: "#ab6c14" },
  ember: { a: "#372714", b: "#1c1309", c: "#0c0804", light: "#f4c92b", glow: 0.58, line: "#e0a81f" },
};

/** Where the light sits, by what the slot is for. */
const ORIGIN: Record<Motif, { x: [number, number]; y: [number, number] }> = {
  counter: { x: [0.16, 0.42], y: [0.22, 0.42] }, // a lamp, off to one side
  garden:  { x: [0.52, 0.84], y: [0.2, 0.38] },  // a sign, seen through planting
  plate:   { x: [0.34, 0.64], y: [0.36, 0.56] }, // close, over the piece
};

type Props = {
  seed: string;
  tone?: Tone;
  motif?: Motif;
  ratio?: number;
  aperture?: boolean;
  className?: string;
};

export default function BrandPlate({
  seed, tone = "night", motif = "counter", ratio = 1.5, aperture = false, className,
}: Props) {
  const r = rng(seed);
  const W = 1200;
  const H = Math.round(W / ratio);
  const p = PALETTE[tone];
  const o = ORIGIN[motif];
  const uid = `bp${Math.abs(
    seed.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7),
  ).toString(36)}`;

  const lx = o.x[0] + r() * (o.x[1] - o.x[0]);
  const ly = o.y[0] + r() * (o.y[1] - o.y[0]);

  // One hairline, low in the frame. A counter edge, a sill, a horizon of sorts —
  // enough to give the field a floor without describing anything.
  const lineY = (ratio < 1 ? 0.78 : 0.71) + r() * 0.06;
  const tilt = (r() - 0.5) * 0.012;
  const dark = tone !== "day";

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        {/* The field, dark at the edges, opening toward the light. */}
        <linearGradient id={`${uid}f`} x1={lx} y1="0" x2={1 - lx * 0.6} y2="1">
          <stop offset="0%" stopColor={p.a} />
          <stop offset="52%" stopColor={p.b} />
          <stop offset="100%" stopColor={p.c} />
        </linearGradient>

        {/* The light itself — wide, soft, and never a hard disc. */}
        <radialGradient
          id={`${uid}l`} cx={lx} cy={ly} r="0.98"
          gradientTransform={`translate(0 ${ly}) scale(1 0.72) translate(0 ${-ly / 0.72})`}
        >
          <stop offset="0%"   stopColor={p.light} stopOpacity={p.glow} />
          <stop offset="20%"  stopColor={p.light} stopOpacity={p.glow * 0.66} />
          <stop offset="44%"  stopColor={p.line}  stopOpacity={p.glow * 0.38} />
          <stop offset="74%"  stopColor={p.line}  stopOpacity={p.glow * 0.16} />
          <stop offset="100%" stopColor={p.line}  stopOpacity="0" />
        </radialGradient>

        {/* Light falls off toward the bottom of the frame. */}
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#000" stopOpacity={dark ? 0.24 : 0.04} />
          <stop offset="48%"  stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity={dark ? 0.46 : 0.16} />
        </linearGradient>

        <filter id={`${uid}g`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="3" seed={seed.length * 13} />
          <feColorMatrix type="saturate" values="0" />
        </filter>

        <clipPath id={`${uid}c`}><rect width={W} height={H} /></clipPath>
      </defs>

      <g clipPath={`url(#${uid}c)`}>
        <rect width={W} height={H} fill={`url(#${uid}f)`} />
        <rect width={W} height={H} fill={`url(#${uid}l)`} />

        <line
          x1={0} y1={H * (lineY - tilt)} x2={W} y2={H * (lineY + tilt)}
          stroke={p.line} strokeOpacity={dark ? 0.26 : 0.34} strokeWidth="1"
        />

        {aperture && (
          <circle
            cx={W * lx} cy={H * ly} r={Math.min(W, H) * 0.155}
            fill="none" stroke={p.light} strokeOpacity="0.22" strokeWidth="1"
          />
        )}

        <rect width={W} height={H} fill={`url(#${uid}v)`} />
        <rect
          width={W} height={H} filter={`url(#${uid}g)`}
          opacity={dark ? 0.13 : 0.09} style={{ mixBlendMode: "overlay" }}
        />
      </g>
    </svg>
  );
}
