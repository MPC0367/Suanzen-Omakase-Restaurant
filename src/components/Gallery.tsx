"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Media from "./Media";
import { gallerySequence } from "@/lib/slots";
import { getDict, type Locale } from "@/content/dictionary";

export default function Gallery({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  /* The restaurant's own photographs, in the sequence chosen in lib/slots. */
  const gallery = gallerySequence.map((p, i) => ({
    id: `g${i}`,
    src: p.file,
    ratio: p.orientation === "portrait" ? 0.8 : p.orientation === "square" ? 1 : 1.5,
    tone: (["night", "dusk", "ember", "dawn"] as const)[i % 4],
    motif: (p.category === "exterior" || p.category === "signage"
      ? "garden"
      : p.category === "food" || p.category === "detail"
        ? "plate"
        : "counter") as "garden" | "plate" | "counter",
    altEn: p.altEn,
    altTh: p.altTh,
    capEn: p.altEn,
    capTh: p.altTh,
  }));
  const [open, setOpen] = useState<number | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  /* Anything that should stop the drift: a pointer on the rail, a drag, an
     open lightbox, keyboard focus inside it, or the tab being hidden.
     This used to be a counter incremented and decremented by five separate
     pairs of listeners, and any unpaired event leaked a permanent pause — a
     press on a photograph focused its button, focusout never came, and the
     rail never drifted again for the rest of the visit. Asking the DOM each
     frame instead cannot get stuck, because nothing is remembered. */
  const dragging = useRef(false);
  const lightboxOpen = useRef(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  /* ── The rail drifts on its own ───────────────────────────────────────────
     The track is rendered twice, so when the scroll passes the halfway mark it
     jumps back by exactly half and the seam is invisible. It moves slowly —
     this is a restaurant, not a carousel — and stops the moment anyone touches
     it, focuses inside it, opens a photograph, or leaves the tab. Reduced
     motion turns it off entirely and leaves the rail hand-scrollable. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = 0;
    const SPEED = 22; // px per second — a drift, not a carousel

    /* The position is accumulated here rather than read back from the element.
       scrollLeft reports whole pixels, so a 0.36px-per-frame increment read
       back as 0 every frame and the rail never moved at all. */
    let pos = el.scrollLeft;

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      /* :focus-visible rather than plain focus — a mouse click leaves focus on
         the button it pressed, and that should not stop the rail for ever. */
      const paused =
        document.hidden ||
        lightboxOpen.current ||
        dragging.current ||
        el.matches(":hover") ||
        !!el.querySelector(":focus-visible");
      if (!paused) {
        // If anything else moved the rail (a wheel, a drag), take its position.
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
        const half = el.scrollWidth / 2;
        pos += SPEED * dt;
        if (half > 0 && pos >= half) pos -= half;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  /* The lightbox holds the drift while it is open. */
  useEffect(() => {
    lightboxOpen.current = open !== null;
  }, [open]);

  // ── Drag to pan the rail, without breaking normal page scrolling. ─────────
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let down = false, startX = 0, startLeft = 0, moved = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // let touch scroll natively
      down = true; moved = 0;
      startX = e.clientX; startLeft = el.scrollLeft;
      // Capture is taken in onMove, once this is actually a drag. Capturing
      // here would retarget the click to the rail and the photograph inside it
      // could never be opened with a mouse.
      el.classList.add("is-dragging");
      dragging.current = true;
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
      dragging.current = false;
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.classList.remove("is-dragging");
      // A drag should not also open the lightbox. Only a real pointerup is
      // followed by a click, though — a cancelled gesture produces none, so
      // arming the blocker there would leave it waiting to eat the visitor's
      // next genuine click on a photograph.
      if (moved > 6 && e.type === "pointerup") {
        const stop = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
        el.addEventListener("click", stop, { capture: true, once: true });
        // And if that click never comes, do not leave it armed.
        window.setTimeout(() => el.removeEventListener("click", stop, true), 400);
      }
    };
    // The browser's own image drag would otherwise cancel the pan.
    const onDragStart = (e: Event) => e.preventDefault();
    const onTouchStart = () => { dragging.current = true; };
    const onTouchEnd = () => { dragging.current = false; };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    // Bound to the window, not the rail: releasing the mouse away from the
    // rail — grabbing a photo and moving vertically off it — never sent
    // pointerup here, so the autoscroll's pause counter was never decremented
    // and the drift stopped for the rest of the visit.
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    opener.current?.focus();
  }, []);

  const step = useCallback((d: number) => {
    setOpen((i) => (i === null ? i : (i + d + gallery.length) % gallery.length));
  }, []);

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        // Three controls only — keep the ring inside the dialog.
        const items = Array.from(
          document.querySelectorAll<HTMLElement>(".lb__ctl"),
        ).filter((n) => n.offsetParent !== null);
        if (!items.length) return;
        const a = items[0], z = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  // Swipe inside the lightbox.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  const cur = open === null ? null : gallery[open];

  return (
    <>
      <div className="rail" ref={rail}>
        <ul className="rail__track">
          {/* Rendered twice: the second pass is the seamless half of the loop
              and is hidden from assistive tech so nothing is announced twice. */}
          {[...gallery, ...gallery].map((s, idx) => {
            const i = idx % gallery.length;
            const isClone = idx >= gallery.length;
            return (
            <li
              key={`${s.id}-${idx}`}
              className="rail__item"
              style={{ ["--r" as string]: s.ratio }}
              aria-hidden={isClone || undefined}
            >
              <button
                className="rail__btn"
                onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}
                aria-label={`${t.gallery.open}: ${locale === "th" ? s.altTh : s.altEn}`}
              >
                <Media
                  src={s.src}
                  seed={`gal-${s.id}`}
                  tone={s.tone}
                  motif={s.motif}
                  ratio={s.ratio}
                  alt={locale === "th" ? s.altTh : s.altEn}
                  sizes="(max-width: 48rem) 76vw, 34vw"
                />
                <span className="rail__cap">{locale === "th" ? s.capTh : s.capEn}</span>
              </button>
            </li>
            );
          })}
        </ul>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {cur && (
        <div
          className="lb is-open"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "th" ? cur.altTh : cur.altEn}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="lb__scrim" onClick={close} />
          <div className="lb__stage">
            <Media
              src={cur.src}
              seed={`gal-${cur.id}`}
              tone={cur.tone}
              motif={cur.motif}
              ratio={cur.ratio}
              alt={locale === "th" ? cur.altTh : cur.altEn}
              sizes="90vw"
              still
              className="lb__media"
            />
          </div>
          <div className="lb__bar">
            <button ref={closeBtn} className="lb__ctl lb__x" onClick={close} aria-label={t.gallery.close}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <p className="lb__cap">{locale === "th" ? cur.capTh : cur.capEn}</p>
            <div className="lb__nav">
              <button className="lb__ctl" onClick={() => step(-1)} aria-label={t.gallery.prev}>
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
                  <path d="M6 1L1 6l5 5M1 6h19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="lb__n u-numeral">
                {String(open! + 1).padStart(2, "0")} <i>{t.gallery.of}</i> {String(gallery.length).padStart(2, "0")}
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
