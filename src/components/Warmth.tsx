"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { peopleShots } from "@/content/media";
import { getDict, type Locale } from "@/content/dictionary";

/**
 * The people. The owner's brief put this above the food: the smiles, the full
 * tables, the chef among guests. So these photographs get a section of their
 * own rather than being mixed into the food gallery — and they get room.
 *
 * A drag/scroll rail on a pointer device, a swipe rail on touch, and every
 * picture opens full-size.
 */
export default function Warmth({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const shots = peopleShots.slice(0, 12);
  const rail = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  // Drag to pan with a mouse; touch scrolls natively.
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let down = false, startX = 0, startLeft = 0, moved = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      down = true; moved = 0; startX = e.clientX; startLeft = el.scrollLeft;
      // Capture is taken in onMove, once this is actually a drag. Capturing
      // here retargets the click to the rail, and the photograph inside it
      // could never be opened with a mouse.
      el.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4 && !el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
      if (moved > 4) el.scrollLeft = startLeft - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.classList.remove("is-dragging");
      if (moved > 6) {
        el.addEventListener("click", (ev) => { ev.stopPropagation(); ev.preventDefault(); },
          { capture: true, once: true });
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  const step = useCallback((d: number) => {
    setOpen((i) => (i === null ? i : (i + d + shots.length) % shots.length));
  }, [shots.length]);

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  if (!shots.length) return null;
  const cur = open === null ? null : shots[open];

  return (
    <>
      <div className="warm" ref={rail}>
        <ul className="warm__track">
          {shots.map((s, i) => (
            <li
              key={s.file}
              className={`warm__item warm__item--${s.orientation}`}
            >
              <button
                className="warm__btn"
                onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}
                aria-label={locale === "th" ? s.altTh : s.altEn}
              >
                <Image
                  src={s.file}
                  alt={locale === "th" ? s.altTh : s.altEn}
                  width={s.orientation === "portrait" ? 900 : 1200}
                  height={s.orientation === "portrait" ? 1200 : 900}
                  sizes="(max-width: 48rem) 78vw, 34vw"
                  className="warm__img"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {cur && (
        <div className="lb is-open" role="dialog" aria-modal="true"
             aria-label={locale === "th" ? cur.altTh : cur.altEn}>
          <div className="lb__scrim" onClick={close} />
          <div className="lb__stage">
            <Image
              src={cur.file}
              alt={locale === "th" ? cur.altTh : cur.altEn}
              width={1600} height={1200}
              sizes="90vw"
              className="lb__photo"
            />
          </div>
          <div className="lb__bar">
            <button className="lb__ctl lb__x" onClick={close} aria-label={t.gallery.close}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <p className="lb__cap">{locale === "th" ? cur.altTh : cur.altEn}</p>
            <div className="lb__nav">
              <button className="lb__ctl" onClick={() => step(-1)} aria-label={t.gallery.prev}>
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
                  <path d="M6 1L1 6l5 5M1 6h19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="lb__n u-numeral">
                {String(open! + 1).padStart(2, "0")} <i>{t.gallery.of}</i> {String(shots.length).padStart(2, "0")}
              </span>
              <button className="lb__ctl" onClick={() => step(1)} aria-label={t.gallery.next}>
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
                  <path d="M14 1l5 5-5 5M19 6H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
