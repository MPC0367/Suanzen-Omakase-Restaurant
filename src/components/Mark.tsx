import Image from "next/image";
import { asset } from "@/lib/asset";

/**
 * The restaurant's own logo — the gold seal with the pine over rocks, the sun,
 * 枯山水 (karesansui, a dry garden), OMAKASE and EST. 2024. This is the mark
 * the restaurant supplied in September 2026, in three grounds; the masters
 * are in public/brand/ (logo.png transparent, logo-black.png, logo-stone.jpg).
 *
 * Shown here in its transparent version, whole. The scalloped gold rim is the
 * seal's own frame — it is not a circle, so there is no round crop, no ink
 * disc and no hairline ring. One 320px file serves the header, the footer and
 * the curtain, so the curtain's download is the header's too.
 */
export function Mark({ size = 34, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <span className="mark" style={{ width: size, height: size }}>
      <Image
        src={asset("/brand/logo-320.png")}
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
