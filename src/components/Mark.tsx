import Image from "next/image";
import { asset } from "@/lib/asset";

/**
 * The restaurant's own logo — the gold seal with the pine over rocks, the sun,
 * 枯山水 (karesansui, a dry garden) and OMAKASE. Recovered at 1284px from the
 * restaurant's own Facebook profile, so it is the real mark rather than a
 * drawing of it.
 *
 * Shown in its matte treatment (scripts/make-matte-logo.cjs): the same mark,
 * every edge its own, recoloured from the glossy original into its own
 * mid-tone gold, muted, on warm ink — printed-ink amber rather than polished
 * metal. It reads as an ink stamp on the pale daylight sections and settles
 * into the dark ones.
 */
export function Mark({ size = 34, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <span className="mark" style={{ width: size, height: size }}>
      <Image
        src={asset("/brand/logo-matte-512.png")}
        alt=""
        width={size * 2}
        height={size * 2}
        priority={priority}
        className="mark__img"
      />
    </span>
  );
}

/** SUAN ZEN set in the display serif — the wordmark beside the seal. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`wordmark ${className ?? ""}`}>
      <span className="wordmark__a">Suan</span>
      <span className="wordmark__b">Zen</span>
    </span>
  );
}
