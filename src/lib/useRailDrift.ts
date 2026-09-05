"use client";

import { useEffect, type RefObject } from "react";

/**
 * A horizontal rail that drifts on its own, and a mouse that can pan it.
 *
 * Both photo rails use this, so the corrections live in one place. Three of
 * them are worth knowing about, because each was a real fault:
 *
 *  · The position is accumulated in a local, not read back from the element.
 *    scrollLeft reports whole pixels, so a 0.36px-per-frame increment read
 *    back as 0 every frame and the rail never moved at all.
 *
 *  · Whether to pause is asked of the DOM every frame rather than counted.
 *    A counter incremented and decremented by separate pairs of listeners
 *    leaked a permanent pause the moment any event went unpaired — pressing a
 *    photograph focused its button, focusout never came, and the rail stopped
 *    for the rest of the visit. Nothing is remembered here, so nothing sticks.
 *    :focus-visible rather than :focus, so a mouse click does not stop it.
 *
 *  · The browser's own image drag is refused, and the click-suppressor that
 *    stops a drag also opening a lightbox is armed only after a real
 *    pointerup. Armed on pointercancel — where no click ever follows — it sat
 *    waiting and swallowed the visitor's next genuine click.
 *
 * The track is expected to be rendered twice: at the halfway mark the scroll
 * jumps back by exactly half, and the seam is invisible.
 */
export function useRailDrift(
  ref: RefObject<HTMLDivElement | null>,
  { speed = 22, paused = false }: { speed?: number; paused?: boolean } = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* ── the drift ─────────────────────────────────────────────────────── */
    let raf = 0;
    let last = 0;
    let dragging = false;
    let pos = el.scrollLeft;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const hold =
        paused ||
        dragging ||
        document.hidden ||
        el.matches(":hover") ||
        !!el.querySelector(":focus-visible");
      if (!hold) {
        // If anything else moved the rail (a wheel, a drag), take its position.
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
        const half = el.scrollWidth / 2;
        pos += speed * dt;
        if (half > 0 && pos >= half) pos -= half;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    if (!still) raf = requestAnimationFrame(tick);

    /* ── drag to pan ───────────────────────────────────────────────────── */
    let down = false, startX = 0, startLeft = 0, moved = 0;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // let touch scroll natively
      down = true; dragging = true; moved = 0;
      startX = e.clientX; startLeft = el.scrollLeft;
      // Capture is taken in onMove, once this is actually a drag. Capturing
      // here retargets the click to the rail and the photograph inside it
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
      down = false; dragging = false;
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.classList.remove("is-dragging");
      if (moved > 6 && e.type === "pointerup") {
        const stop = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
        el.addEventListener("click", stop, { capture: true, once: true });
        window.setTimeout(() => el.removeEventListener("click", stop, true), 400);
      }
    };
    const onDragStart = (e: Event) => e.preventDefault();
    const onTouchStart = () => { dragging = true; };
    const onTouchEnd = () => { dragging = false; };

    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    // On the window, not the rail: releasing the mouse away from it — grabbing
    // a photograph and moving vertically off — never sent pointerup to the
    // rail, and the gesture never ended.
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [ref, speed, paused]);
}
