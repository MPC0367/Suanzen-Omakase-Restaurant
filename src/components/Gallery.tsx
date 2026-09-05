"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRailDrift } from "@/lib/useRailDrift";
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
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useRailDrift(rail, { paused: open !== null });

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
