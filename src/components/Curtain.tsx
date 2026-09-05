"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Mark } from "./Mark";

/**
 * The curtain. The restaurant's seal on a dark ground, held for a moment and
 * then lifted — on the first load, on every move between pages, and on the
 * change of language.
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

/** Held at full, then the lift. Long enough to read as deliberate, short
    enough that nobody waits on it. */
const HOLD = 560;
const LIFT = 620;

export default function Curtain() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"held" | "lifting" | "gone">("held");
  const firstRender = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      return;
    }

    // On the first pass the curtain is already up from the server render; on
    // every later pathname change — a page, or the switch between Thai and
    // English — it is raised again.
    if (!firstRender.current) setPhase("held");
    firstRender.current = false;

    const lift = window.setTimeout(() => setPhase("lifting"), HOLD);
    const gone = window.setTimeout(() => setPhase("gone"), HOLD + LIFT);
    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(gone);
    };
  }, [pathname]);

  if (phase === "gone") return null;

  return (
    <div className={`curtain ${phase === "lifting" ? "is-lifting" : ""}`} aria-hidden="true">
      <span className="curtain__mark">
        <Mark size={116} priority />
      </span>
    </div>
  );
}
