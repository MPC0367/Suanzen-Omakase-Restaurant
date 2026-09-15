"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { asset } from "@/lib/asset";

/**
 * The curtain. The restaurant's seal on its own stone: the dry garden comes
 * up, its gold rim draws itself clockwise from the seam at the top, and once
 * the ring has closed the curtain lifts — on the first load, on every move
 * between pages, and on the change of language.
 *
 * The seal is two layers of the restaurant's artwork registered to one frame:
 * public/brand/logo-art.png (everything inside the rim) and logo-ring.png (the
 * rim alone). The drawing itself is CSS — a conic mask swept round the rim, in
 * sections.css — so it starts on first paint, before React arrives, and this
 * component lifts the curtain when that animation reports it has finished.
 *
 * It renders on the server so it is already there when the first paint lands,
 * rather than flashing in once React arrives. Two consequences follow, and
 * both are handled here rather than left to chance:
 *
 *   · it never takes pointer events, so it cannot sit over the navigation
 *     swallowing clicks while the page hydrates, and
 *   · the stylesheet lifts it on its own after a beat, so a visitor whose
 *     JavaScript never arrives is not left looking at a dark screen.
 *
 * Reduced motion skips it: those visitors go straight to the page.
 */

/** Held on the closed ring, then the lift. */
const SETTLE = 320;
const LIFT = 620;
/** Only if the browser can't report the ring's animation: its delay plus
    duration in sections.css. */
const RING = 1680;

type Phase = "held" | "lifting" | "gone";

export default function Curtain() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("held");
  // 0 is the curtain the server rendered; every later raise redraws quicker.
  const [raise, setRaise] = useState(0);
  const shownFor = useRef(pathname);
  const ring = useRef<HTMLImageElement>(null);

  // Every later pathname change — a page, or Thai ⇄ English — raises it again.
  useEffect(() => {
    if (shownFor.current === pathname) return;
    shownFor.current = pathname;
    setPhase("held");
    setRaise((n) => n + 1);
  }, [pathname]);

  // With this raise on screen: wait for the ring to close, hold, then lift.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      return;
    }

    let alive = true;
    let lift = 0;
    let gone = 0;
    const liftIn = (ms: number) => {
      lift = window.setTimeout(() => setPhase("lifting"), ms);
      gone = window.setTimeout(() => setPhase("gone"), ms + LIFT);
    };

    const drawing = ring.current?.getAnimations?.()[0];
    if (drawing) {
      drawing.finished.then(
        () => {
          if (alive) liftIn(SETTLE);
        },
        () => {},
      );
    } else {
      liftIn(RING + SETTLE);
    }

    return () => {
      alive = false;
      window.clearTimeout(lift);
      window.clearTimeout(gone);
    };
  }, [raise]);

  if (phase === "gone") return null;

  return (
    <div
      className={`curtain${raise > 0 ? " curtain--again" : ""}${phase === "lifting" ? " is-lifting" : ""}`}
      aria-hidden="true"
    >
      <span className="curtain__mark">
        <Image
          src={asset("/brand/logo-art-320.png")}
          alt=""
          width={232}
          height={232}
          priority
          className="curtain__art"
        />
        <Image
          ref={ring}
          src={asset("/brand/logo-ring-320.png")}
          alt=""
          width={232}
          height={232}
          priority
          className="curtain__ring"
        />
      </span>
    </div>
  );
}
