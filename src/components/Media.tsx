"use client";

import Image from "next/image";
import { useState } from "react";
import BrandPlate, { type Motif, type Tone } from "./BrandPlate";

/**
 * One media slot. Shows the restaurant's photograph when there is one, and
 * brand artwork when there isn't — or when the file 404s, or is still loading.
 * There is no state in which this renders a broken image icon or an empty box.
 */
export type MediaProps = {
  /** Path under /public. Leave undefined until the restaurant supplies the file. */
  src?: string;
  alt: string;
  seed: string;
  tone?: Tone;
  motif?: Motif;
  ratio?: number;
  aperture?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Slow drift on scroll — set false for anything already in motion. */
  still?: boolean;
};

export default function Media({
  src,
  alt,
  seed,
  tone = "night",
  motif = "counter",
  ratio = 1.5,
  aperture = false,
  priority = false,
  sizes = "100vw",
  className,
  still = false,
}: MediaProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;

  return (
    <div
      className={`media ${still ? "" : "media--drift"} ${className ?? ""}`}
      style={{ aspectRatio: String(ratio) }}
    >
      {/* Artwork always renders underneath: it is the loading state, the
          fallback, and — until photography lands — the image itself. */}
      <div className="media__plate">
        <BrandPlate seed={seed} tone={tone} motif={motif} ratio={ratio} aperture={aperture} />
      </div>

      {showPhoto && (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="media__img"
          onError={() => setFailed(true)}
        />
      )}

      {/* Photographs carry their own alt text. When artwork stands in, the
          slot is decorative and the caption nearby does the describing. */}
      {!showPhoto && alt ? <span className="u-sr">{alt}</span> : null}
    </div>
  );
}
