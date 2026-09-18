"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { getDict, type Locale } from "@/content/dictionary";
import type { Course } from "@/content/courses";

/**
 * A course's own photographs, under the course in the menu.
 *
 * The rail drifts sideways on its own, so a guest sees there is more than the
 * first picture without being told. It drifts by moving its own scroll, never
 * the page's: the page's scroll belongs to the guest, and an earlier build
 * learned the hard way what taking it costs on an iPhone. The drift stops
 * whenever the guest has any claim on it — a finger down, a pointer over it,
 * the guest's own sideways scroll, a picture open, the course closed or
 * scrolled out of sight, the tab in the background — and it never starts at
 * all where reduced motion is asked for.
 *
 * The pictures run in the order they are served, and each carries the
 * restaurant's own name for the dish. Tapping one opens it large with that
 * name beneath, and the arrows walk along the course from there.
 */

/** Pixels a second: slow enough to read, fast enough to notice. */
const DRIFT = 22;

export default function CourseGallery({ course, locale }: { course: Course; locale: Locale }) {
  const t = getDict(locale);
  const pictures = course.gallery ?? [];
  const rail = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [loops, setLoops] = useState(false);   // the pictures outrun the rail, so it is worth looping
  const held = useRef(false);            // a finger or a pointer has the rail
  const openRef = useRef(false);

  useEffect(() => { openRef.current = open !== null; }, [open]);

  /* Whether there is anything to scroll at all. Three photographs fill a phone
     and overflow it; on a wide screen the same three sit side by side with room
     to spare, and there the rail neither loops nor drifts — it is simply a row
     of pictures. Measured from the first run alone, and again when the window
     changes shape. */
  useEffect(() => {
    const track = rail.current;
    if (!track) return;
    const look = () => {
      const first = Array.from(track.children).slice(0, pictures.length) as HTMLElement[];
      if (!first.length) return;
      const wide = first.reduce((w, li) => w + li.getBoundingClientRect().width, 0)
        + (first.length - 1) * parseFloat(getComputedStyle(track).columnGap || "0");
      setLoops(wide > track.clientWidth + 1);
    };
    look();
    const ro = new ResizeObserver(look);
    ro.observe(track);
    return () => ro.disconnect();
  }, [pictures.length]);

  /* The drift. Each frame moves the rail by the time that has passed, so it
     travels at the same speed on any screen, and wraps at the halfway mark —
     the pictures are laid out twice, so the seam never shows. */
  useEffect(() => {
    const track = rail.current;
    if (!track || pictures.length < 2 || !loops) return;   // nothing to travel where they all fit
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0, last = 0, seen = false, at = 0;
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, { threshold: 0 });
    io.observe(track);

    const step = (now: number) => {
      frame = window.requestAnimationFrame(step);
      const dt = last ? Math.min(now - last, 100) : 0;   // a tab left in the background doesn't lurch on its return
      last = now;
      if (!seen || held.current || openRef.current || document.hidden) { at = track.scrollLeft; return; }
      const half = track.scrollWidth / 2;
      if (half < 1) return;
      /* The position is kept here rather than read back from the rail each
         frame. A frame's worth of drift is a third of a pixel, and a browser
         rounds what it is given to whole device pixels — so reading back would
         return the same rounded number every frame and the rail would sit at
         nought for ever, writing and never moving. Read back only to follow
         the guest when they have moved it themselves. */
      if (Math.abs(track.scrollLeft - at) > 2) at = track.scrollLeft;
      at += (DRIFT * dt) / 1000;
      if (at >= half) at -= half;
      track.scrollLeft = at;
    };
    frame = window.requestAnimationFrame(step);

    /* The guest's own hand always wins. A pointer resting on the rail, a finger
       on the glass, or a sideways flick of their own holds the drift; it picks
       up again a moment after they let go. */
    let release = 0;
    const take = () => { held.current = true; window.clearTimeout(release); };
    const give = () => { window.clearTimeout(release); release = window.setTimeout(() => { held.current = false; }, 1400); };
    const events: [string, EventListener][] = [
      ["pointerenter", take], ["pointerleave", give],
      ["touchstart", take], ["touchend", give], ["touchcancel", give],
      ["wheel", () => { take(); give(); }],
    ];
    events.forEach(([e, fn]) => track.addEventListener(e, fn, { passive: true }));
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(release);
      events.forEach(([e, fn]) => track.removeEventListener(e, fn));
      io.disconnect();
    };
    // loops included: a phone turned on its side, or a window dragged wider,
    // changes whether there is anything to travel at all.
  }, [pictures.length, loops]);

  const show = useCallback((i: number) => setOpen(((i % pictures.length) + pictures.length) % pictures.length), [pictures.length]);

  if (!pictures.length) return null;

  /* Laid out twice so the drift can wrap without a seam — but only where the
     pictures outrun the rail. On a wide screen three photographs sit side by
     side with room to spare, and a second run there would simply show the same
     dish twice with nothing to scroll. The second run is for the eye alone: it
     is hidden from a screen reader and from the keyboard, which walk the first
     run only. */
  const runs = pictures.length > 1 && loops ? [pictures, pictures] : [pictures];

  return (
    <div className="cgal">
      <ul className="cgal__track" ref={rail}>
        {runs.map((run, r) =>
          run.map((p, i) => (
            <li className="cgal__item" key={`${r}-${i}`} aria-hidden={r === 1 ? "true" : undefined}>
              <button
                type="button"
                className="cgal__btn"
                onClick={() => show(i)}
                tabIndex={r === 1 ? -1 : undefined}
                aria-label={`${t.gallery.open} — ${p.caption}`}
              >
                <Image
                  src={asset(p.src)}
                  alt=""
                  width={p.w}
                  height={p.h}
                  sizes="(min-width: 64rem) 22rem, 60vw"
                  className="cgal__img"
                />
                {/* The dish's name alone. Its number orders the pictures, but
                    shown in front of each one it read as a count of the course
                    rather than a label for the plate. */}
                <span className="cgal__cap">{p.caption}</span>
              </button>
            </li>
          )),
        )}
      </ul>

      {/* Hung on the body, not here. A picture opened in place is a child of
          the course panel, and that panel animates its transform as it opens —
          an ancestor with a transform becomes the frame that "fixed" is fixed
          to, so the picture would be laid out against the panel rather than the
          screen and come out somewhere off the top of it, out of reach of every
          tap. That is a page which looks frozen. */}
      {open !== null && createPortal(
        <Expanded
          pictures={pictures}
          at={open}
          locale={locale}
          onMove={show}
          onClose={() => setOpen(null)}
        />,
        document.body,
      )}
    </div>
  );
}

/* ── One picture, large ───────────────────────────────────────────────────
   Over the page, with the dish's name under it. Escape closes it, so does a
   tap on the dark around it; the arrows and the left and right keys walk the
   course. The page behind is held still while it is open, and the focus goes
   in and comes back out to where it was. */
function Expanded({
  pictures, at, locale, onMove, onClose,
}: {
  pictures: NonNullable<Course["gallery"]>;
  at: number;
  locale: Locale;
  onMove: (i: number) => void;
  onClose: () => void;
}) {
  const t = getDict(locale);
  const panel = useRef<HTMLDivElement>(null);
  const p = pictures[at];

  useEffect(() => {
    const was = document.activeElement as HTMLElement | null;
    const body = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // preventScroll: focusing a control inside a fixed panel otherwise scrolls
    // the page underneath it to bring that control into view — a scroll the
    // guest did not ask for, set by the page, which is the one thing this menu
    // must never do.
    panel.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key === "ArrowRight") return onMove(at + 1);
      if (e.key === "ArrowLeft") return onMove(at - 1);
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>("button"));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = body;
      was?.focus({ preventScroll: true });
    };
  }, [at, onMove, onClose]);

  return (
    <div className="cshow" role="dialog" aria-modal="true" aria-label={p.caption}>
      <button className="cshow__scrim" onClick={onClose} tabIndex={-1} aria-hidden="true" />
      <div className="cshow__panel" ref={panel}>
        <div className="cshow__stage">
          <Image
            key={p.src}
            src={asset(p.src)}
            alt=""
            width={p.w}
            height={p.h}
            sizes="(min-width: 64rem) 62rem, 92vw"
            className="cshow__img"
            priority
          />
        </div>
        <div className="cshow__bar">
          <p className="cshow__cap">{p.caption}</p>
          <div className="cshow__nav">
            <button className="cshow__ctl" onClick={() => onMove(at - 1)} aria-label={t.gallery.prev}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M11.5 3L5 9l6.5 6" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="cshow__n u-numeral">{at + 1} {t.gallery.of} {pictures.length}</span>
            <button className="cshow__ctl" onClick={() => onMove(at + 1)} aria-label={t.gallery.next}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M6.5 3L13 9l-6.5 6" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="cshow__ctl" onClick={onClose} aria-label={t.gallery.close}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
