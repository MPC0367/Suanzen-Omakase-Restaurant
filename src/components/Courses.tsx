"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { activeCourses, courseById, formatBaht, allDishes, type Course, type Dish } from "@/content/courses";
import { adviceFor, advisorCopy, fill } from "@/content/advisor";
import { photoRatio } from "@/content/photo-sizes";
import { getDict, type Locale } from "@/content/dictionary";
import { reserveLink } from "@/lib/line";
import { COURSE_EVENT, hasPointer, openReserve } from "@/lib/events";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Chevron = () => (
  <svg width="13" height="8" viewBox="0 0 13 8" fill="none" aria-hidden="true" className="cx">
    <path d="M1 1l5.5 5.5L12 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Where the phone layout begins: the width below which sections.css pins the
   course bar under the header, and shows every course before this script
   takes over. Keep the two in step. */
const PHONE = "(max-width: 63.99rem)";
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Move the page at once, whatever html's scroll-behavior says. The newer
   { behavior: "instant" } option is not understood by every phone in use, and
   an unknown value there throws; switching the style off for the one move
   works everywhere. */
const now = (move: () => void) => {
  const html = document.documentElement;
  const was = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  move();
  html.style.scrollBehavior = was;
};

/* How far down the screen the fixed header, and the pinned course bar under
   it, reach. Measured live: the header compacts and the bar pins as the page moves. */
const cover = () => Math.max(
  0,
  document.querySelector(".hdr")?.getBoundingClientRect().bottom ?? 0,
  document.querySelector(".menu__jump")?.getBoundingClientRect().bottom ?? 0,
);

/* Whether the guest is moving the page by hand: a drag or a wheel since the
   last tap. A tapped link or course-bar shortcut carries the page past many
   dishes at once, and none of them should open a photograph on the way (each
   would also push the place it is heading for further down). Counted rather
   than timed, so only the order matters. One set of listeners for every dish. */
const hand = { n: 0, drag: 0, tap: 0, on: false };
const byHand = () => hand.drag > hand.tap;
/* Whether a finger is on the glass, kept once for every dish: a photograph
   that opened by itself in the middle of a drag has to know the finger was
   already down when it opened. */
const finger = { down: false };
const watchHand = () => {
  if (hand.on) return;
  hand.on = true;
  const drag = () => { hand.drag = ++hand.n; };
  const tap = () => { hand.tap = ++hand.n; };
  const lift = (e: Event) => { finger.down = ((e as TouchEvent).touches?.length ?? 0) > 0; };
  window.addEventListener("touchmove", drag, { passive: true });
  window.addEventListener("wheel", drag, { passive: true });
  window.addEventListener("click", tap, { capture: true });
  window.addEventListener("hashchange", tap);
  window.addEventListener("popstate", tap);
  // Captured, so the finger's state is known before any dish's own touch handler runs.
  window.addEventListener("touchstart", () => { finger.down = true; }, { passive: true, capture: true });
  window.addEventListener("touchend", lift, { passive: true, capture: true });
  window.addEventListener("touchcancel", lift, { passive: true, capture: true });
};

/* Photographs folding away above the screen give their height back together.
   Rows whose timers run out together fold in one render, and may sit in
   several dish lists: each list's loss is counted once, and the page is put
   back by the sum, from where it was before any of them folded. */
const giveBack = { y: 0, lists: new Map<HTMLElement, number>(), open: false };

/* ── The spotlight (phones) ─────────────────────────────────────────────────
   On a phone the middle of the screen works like a pointer resting on the
   menu. The dish under it is lit, as a pointer lights it on a desktop, and a
   dish the restaurant has a photograph of slides it open beneath its name.
   When the middle moves on to another dish, the one before closes: only one
   is ever open.

   What must not happen is the dish at the middle moving while this goes on.
   A photograph opening beneath the lit dish only pushes down what comes after
   it, as any dropdown does. One closing above the middle would pull everything
   below it up by its height, so the page scrolls up by exactly what it takes
   away, frame by frame as it slides shut (hold). That is measured from the
   closing rows themselves, so the guest's own scrolling is never touched; the
   browser's scroll anchoring is switched off only while it does this (see
   hold), and is back on for everything else, a late font among them.
   On an iPhone a scroll set by the page stops a fling dead (stopsFlings), so
   there a photograph above the middle fades out at once and keeps its space,
   frozen, until the page comes to rest (linger); then it slides shut.

   The lit dish changes only once the middle is a few pixels past its edge, so
   a resting thumb doesn't make two dishes flicker. While a tapped link or
   shortcut carries the page nothing lights or opens on the way (byHand), and
   anything still sliding is finished at once when the tap lands, so the glide
   aims at where things will be. A tablet's two-column lists keep tap-to-open:
   there an opening photograph re-balances the columns. */
const ONE_COLUMN = "(max-width: 47.99rem)";   // sections.css: .dishes go to two columns at 48rem
const LINE = 0.45;                            // where the pointer rests, down the visible area
const SLACK = 6;                              // px past the lit dish's edge before the middle moves on
const lineY = () => { const top = cover(); return top + (window.innerHeight - top) * LINE; };

const spot = {
  on: false,                            // running: a touch screen with one column of dishes
  lit: null as string | null,           // the dish at the middle
  open: null as string | null,          // the dish whose photograph is open
  dismissed: null as string | null,     // closed by a tap: stays shut until the middle moves on
  linger: new Set<string>(),            // closed, but held (faded, frozen) until the page rests
};
const spotListeners = new Set<() => void>();
const spotEmit = () => spotListeners.forEach((l) => l());
const spotSubscribe = (l: () => void) => { spotListeners.add(l); return () => { spotListeners.delete(l); }; };
let spotRun: ((rested: boolean) => void) | null = null;
const rowOf = (uid: string) => document.querySelector<HTMLElement>(`li.dish[data-uid="${uid}"]`);

/* A scroll set by the page stops a fling on WebKit — every iPhone and iPad
   browser — which is also the one engine without scroll anchoring, so that
   tells it apart (as does a test turning anchoring off on body to stand in). */
const stopsFlings = () =>
  !CSS.supports("overflow-anchor", "auto") || getComputedStyle(document.body).overflowAnchor === "none";

/* hold: while rows other than the lit one change height, scroll the page by
   whatever the ones above the middle gain or lose, each frame before it is
   drawn (transitions have already advanced when animation frames run). */
const moving = new Map<HTMLElement, number>();   // a row changing height → its height last frame
let holdUntil = 0, holdFrame = 0, carry = 0, lastY = 0, lastMax = 0, quiet = 0;
const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
const holdEnd = () => {
  moving.clear();
  carry = 0;
  document.documentElement.style.overflowAnchor = "";   // the browser's own anchoring is back for fonts and the like
};
const holdStep = () => {
  holdFrame = 0;
  const line = lineY();
  let changed = false;
  moving.forEach((last, li) => {
    const r = li.getBoundingClientRect();
    if (Math.abs(r.height - last) > 0.01) changed = true;
    if (r.top + Math.min(last, r.height) <= line) carry += r.height - last;   // wholly above the middle
    moving.set(li, r.height);
  });
  // At the very bottom the browser has already pulled the page up by what it
  // lost (a page can't stay scrolled past its end): don't give that back twice.
  const max = maxScroll();
  if (lastY >= lastMax - 1 && max < lastMax && carry < 0) carry += Math.min(lastMax - max, -carry);
  // Only whole pixels: a browser rounds a scroll to its own grid, and a scroll
  // that moves nothing still stops a glide a tap has just started. Ask for it
  // all, see how far the page really moved, and keep the rest for later.
  if (Math.abs(carry) >= 1) {
    const y0 = window.scrollY;
    now(() => window.scrollBy(0, carry));
    carry -= window.scrollY - y0;
  }
  lastY = window.scrollY;
  lastMax = max;
  quiet = changed ? 0 : quiet + 1;
  if (performance.now() < holdUntil && quiet < 4) holdFrame = window.requestAnimationFrame(holdStep);
  else holdEnd();
};
const hold = (li: HTMLElement) => {
  if (!moving.has(li)) moving.set(li, li.getBoundingClientRect().height);
  holdUntil = performance.now() + 420;
  quiet = 0;
  if (!holdFrame) {
    // While the page corrects for these rows itself, the browser's anchoring
    // stays out of it: it would anchor on the first box that fits the screen,
    // often a list holding the closing photograph, and correct wrongly.
    document.documentElement.style.overflowAnchor = "none";
    lastY = window.scrollY;
    lastMax = maxScroll();
    holdFrame = window.requestAnimationFrame(holdStep);
  }
};
const holdNow = () => {
  if (holdFrame) window.cancelAnimationFrame(holdFrame);
  holdStep();
};

/* Finish at once everything still sliding or waiting — the lit dish's own
   opening too — holding the middle as it goes: when a tap lands (so a glide it
   starts aims at the final layout), and when a finger lands on an iPhone
   mid-slide (so its drag isn't fought). */
const settleNow = () => {
  const done: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>(".dish__drop").forEach((drop) => {
    const li = drop.parentElement as HTMLElement;
    const uid = li.dataset.uid ?? "";
    const waiting = spot.linger.has(uid);
    const sliding = drop.dataset.to === "open" ? drop.style.height !== "auto" : drop.getBoundingClientRect().height > 0.5;
    if (!waiting && !sliding) return;
    hold(li);
    if (waiting) { spot.linger.delete(uid); drop.dataset.to = "0"; }
    delete drop.dataset.frozen;
    drop.style.transition = "none";
    drop.style.height = drop.dataset.to === "open" ? "auto" : "0px";
    done.push(drop);
  });
  if (!done.length) return;
  holdNow();
  window.requestAnimationFrame(() => done.forEach((d) => { d.style.transition = ""; }));
  spotEmit();
};

/* A tap on a dish: an open one closes; any other glides to the middle, where
   it lights and opens once the page rests. */
const tapSpot = (uid: string, li: HTMLElement | null) => {
  if (!li) return;
  if (spot.open === uid || spot.linger.has(uid)) {
    spot.dismissed = uid;
    if (spot.open === uid) spot.open = null;
    spot.linger.delete(uid);
    spotEmit();
    return;
  }
  if (spot.dismissed === uid) spot.dismissed = null;
  const b = li.querySelector(".dish__btn")?.getBoundingClientRect();
  if (!b) return;
  const by = (b.top + b.bottom) / 2 - lineY();
  if (Math.abs(by) < 3) spotRun?.(true);
  else window.scrollTo({ top: window.scrollY + by, behavior: still() ? "auto" : "smooth" });
};

/* Runs the spotlight for a page: the menu, or a course's own page. */
function useSpotlight(touch: boolean) {
  useEffect(() => {
    if (!touch) return;
    watchHand();
    hand.tap = ++hand.n;       // a page just opened (or Back is restoring the place): not scrolled by hand yet
    const html = document.documentElement;
    const mq = window.matchMedia(ONE_COLUMN);
    let frame = 0, rest = 0, scrolling = false;
    const clear = () => { spot.lit = spot.open = spot.dismissed = null; spot.linger.clear(); };
    const run = (rested: boolean) => {
      if (!spot.on) return;
      const settled = rested && !scrolling && !finger.down;
      if (!settled && !byHand()) return;        // a tapped link is carrying the page: wait until it lands
      const line = lineY();
      // The lit dish stays lit until the middle is SLACK px past its edge.
      const cur = spot.lit ? rowOf(spot.lit) : null;
      const cb = cur?.getBoundingClientRect();
      const li = cur && cb && cb.height && line >= cb.top - SLACK && line <= cb.bottom + SLACK ? cur
        : document.elementFromPoint(window.innerWidth / 2, line)?.closest<HTMLElement>("li.dish[data-uid]") ?? null;
      const uid = li?.dataset.uid ?? null;
      let changed = false;
      if (uid !== spot.lit) {
        spot.lit = uid;
        if (spot.dismissed !== uid) spot.dismissed = null;
        changed = true;
      }
      const want = li && uid && li.classList.contains("has-photo") && uid !== spot.dismissed ? uid : null;
      if (want !== spot.open) {
        const prev = spot.open;
        spot.open = want;
        if (want) spot.linger.delete(want);
        if (prev && !settled && stopsFlings()) {
          const r = rowOf(prev)?.getBoundingClientRect();
          if (r && r.height && r.bottom <= line) spot.linger.add(prev);   // above the middle, mid-scroll: wait for rest
        }
        changed = true;
      }
      if (settled && spot.linger.size) { spot.linger.clear(); changed = true; }
      if (changed) spotEmit();
    };
    const onScroll = () => {
      scrolling = true;
      window.clearTimeout(rest);
      rest = window.setTimeout(() => { scrolling = false; run(true); }, 160);
      if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; run(false); });
    };
    const onLift = () => { window.setTimeout(() => run(true), 0); };
    const onDown = () => { if (stopsFlings() && moving.size) settleNow(); };
    const apply = () => {
      spot.on = mq.matches;
      html.toggleAttribute("data-spot", spot.on);
      clear();
      spotEmit();
      if (spot.on) run(true);
    };
    spotRun = run;
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchend", onLift, { passive: true });
    window.addEventListener("touchcancel", onLift, { passive: true });
    window.addEventListener("click", settleNow, { capture: true });
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onDown);
      window.removeEventListener("touchend", onLift);
      window.removeEventListener("touchcancel", onLift);
      window.removeEventListener("click", settleNow, { capture: true });
      window.clearTimeout(rest);
      window.cancelAnimationFrame(frame);
      spotRun = null;
      spot.on = false;
      html.removeAttribute("data-spot");
      clear();
      spotEmit();
    };
  }, [touch]);
}

/**
 * The menu. Each course opens to its full list of dishes; pointing at a dish
 * shows the restaurant's photograph of it, where one exists. Dishes with no
 * photograph fall back to a picture from the same course rather than an empty
 * frame, and nothing is ever shown against the wrong dish.
 *
 * On a phone the menu reads straight down: every course is already open, and
 * the pinned course bar spotlights whichever course is under it as the guest
 * scrolls. They are open from the first paint (sections.css shows them before
 * this script runs), because a course opening late, or above the one being
 * read, would shove the page and throw a #visit link off its mark. The middle
 * of the screen then works like a pointer resting on the menu: the dish under
 * it is lit, and its photograph, where there is one, slides open beneath it
 * until the middle moves on (see "The spotlight").
 *
 * Every course says who it is for before it is opened, and what sets it apart
 * once it is; its Reserve opens LINE with that course already in the message.
 */
export default function Courses({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [open, setOpen] = useState<string[]>(activeCourses[0] ? [activeCourses[0].id] : []);
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);
  const [touch, setTouch] = useState(false);
  const [phone, setPhone] = useState(false);
  const [live, setLive] = useState(false);
  const [spot, setSpot] = useState<string | null>(activeCourses[0]?.id ?? null);
  const barRef = useRef<HTMLElement>(null);
  const jumping = useRef(false);
  const settle = useRef<number | undefined>(undefined);
  const openRef = useRef(open);
  const spotRef = useRef(spot);
  const anchor = useRef<string | null>(null);

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { spotRef.current = spot; }, [spot]);

  useEffect(() => {
    setTouch(!hasPointer());
  }, []);
  useSpotlight(touch);

  /* A phone opens every course; a desktop keeps one. Crossing between the two
     (a rotated tablet, a resized window) keeps the course being read: it stays
     open and is brought back into view, rather than the menu snapping shut
     around the first course and leaving the guest somewhere past it. */
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const apply = (first: boolean) => {
      const cur = openRef.current;
      const reading = mq.matches ? (cur[0] ?? null) : spotRef.current;
      if (!first) anchor.current = reading;
      setPhone(mq.matches);
      setLive(true);
      setOpen(
        mq.matches ? activeCourses.map((c) => c.id)
        : !first && reading ? [reading]
        : cur.slice(0, 1),
      );
    };
    apply(true);
    const onChange = () => apply(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    const id = anchor.current;
    if (!id) return;
    anchor.current = null;
    const el = document.getElementById(`course-${id}`);
    if (el) now(() => el.scrollIntoView({ block: "start" }));
  }, [open, phone]);

  /* The spotlight: the last course whose heading has reached a line just
     below the pinned bar. Above the first course, the first is spotlit. */
  const measure = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    const line = bar.getBoundingClientRect().bottom + 24;
    let id = activeCourses[0]?.id ?? null;
    for (const c of activeCourses) {
      const el = document.getElementById(`course-${c.id}`);
      if (el && el.getBoundingClientRect().top <= line) id = c.id;
      else break;
    }
    setSpot(id);
  }, []);

  /* While a tapped shortcut is scrolling the page, the spotlight stays on the
     tapped course instead of passing over every course in between. It lets go
     once the page has been still for a moment, or the guest takes over. */
  const hold = useCallback((ms: number) => {
    jumping.current = true;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => { jumping.current = false; measure(); }, ms);
  }, [measure]);

  useEffect(() => {
    if (!phone) return;
    let frame = 0;
    const onScroll = () => {
      if (jumping.current) return hold(160);
      if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; measure(); });
    };
    // A finger, a wheel or a key means the guest is scrolling by hand now.
    const release = () => {
      if (!jumping.current) return;
      jumping.current = false;
      window.clearTimeout(settle.current);
      measure();
    };
    const input = ["touchstart", "wheel", "keydown"] as const;
    window.addEventListener("scroll", onScroll, { passive: true });
    input.forEach((e) => window.addEventListener(e, release, { passive: true }));
    measure();
    return () => {
      window.removeEventListener("scroll", onScroll);
      input.forEach((e) => window.removeEventListener(e, release));
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle.current);
      jumping.current = false;
    };
  }, [phone, measure, hold]);

  // The bar slides sideways to keep the spotlit course in view.
  useEffect(() => {
    const bar = barRef.current;
    if (!phone || !spot || !bar) return;
    const chip = bar.querySelector<HTMLElement>(`[data-course="${spot}"]`);
    if (!chip) return;
    const left = chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: still() ? "auto" : "smooth" });
  }, [phone, spot]);

  const openCourse = useMemo(
    () => activeCourses.find((c) => c.id === open[open.length - 1]) ?? null,
    [open],
  );

  // When a course opens, the stage shows that course until a dish is pointed
  // at — or nothing, when no photograph shows a dish from it.
  useEffect(() => {
    const first = openCourse?.photos[0];
    if (!openCourse || !first) return setPreview(null);
    setPreview({
      src: first,
      label: locale === "th" ? openCourse.nameTh : openCourse.nameEn,
    });
  }, [openCourse, locale]);

  // On a desktop one course is open at a time; on a phone each keeps its own state.
  const toggle = useCallback((id: string) => {
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : phone ? [...cur, id] : [id]));
  }, [phone]);

  /* The shortcuts: every course with its price, one tap from the top of the
     menu. Choosing a course here always opens it, never closes it, and brings
     its heading into view under the header. */
  const jumpTo = useCallback((id: string) => {
    setOpen((cur) => (phone ? (cur.includes(id) ? cur : [...cur, id]) : [id]));
    if (phone) { setSpot(id); hold(500); }
    window.requestAnimationFrame(() => {
      document.getElementById(`course-${id}`)?.scrollIntoView({ behavior: still() ? "auto" : "smooth", block: "start" });
    });
  }, [phone, hold]);

  // The advisor above, and the comparison below, ask for a course by id.
  useEffect(() => {
    const onCourse = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      jumpTo(id);
      // Keyboard focus follows the view, so the next Tab carries on from the course.
      requestAnimationFrame(() => requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`#course-${id} .course__btn`)?.focus({ preventScroll: true })));
    };
    window.addEventListener(COURSE_EVENT, onCourse);
    return () => window.removeEventListener(COURSE_EVENT, onCourse);
  }, [jumpTo]);

  // On a phone the bar spotlights the course being read; on a desktop, the open one.
  const lit = phone ? spot : (open[0] ?? null);

  return (
    <div className={`menu ${live ? "is-live" : ""}`}>
      <nav className="menu__jump" aria-label={t.coursesSection.jumpLabel} ref={barRef}>
        {activeCourses.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`jump ${lit === c.id ? "is-on" : ""}`}
            onClick={() => jumpTo(c.id)}
            aria-controls={`course-panel-${c.key}`}
            aria-current={lit === c.id ? "true" : undefined}
            data-course={c.id}
          >
            <span className="jump__name">{locale === "th" ? c.nameTh : c.nameEn}</span>
            <span className="jump__price u-numeral">{formatBaht(c.price)}</span>
          </button>
        ))}
      </nav>

      <h2 className="vh">{t.coursesSection.label}</h2>
      <ul className="menu__list">
        {activeCourses.map((c) => (
          <CourseRow
            key={c.id}
            course={c}
            locale={locale}
            isOpen={open.includes(c.id)}
            onToggle={() => toggle(c.id)}
            onPreview={setPreview}
            touch={touch}
          />
        ))}
      </ul>

      {/* Desktop stage — follows whatever is being pointed at. */}
      <aside className="menu__stage" aria-hidden="true">
        <div className="menu__frame">
          {preview ? (
            <Image
              key={preview.src}
              src={asset(preview.src)}
              alt=""
              fill
              sizes="(max-width: 75rem) 0px, 30vw"
              className="menu__img"
            />
          ) : null}
        </div>
        {preview && <p className="menu__caption">{preview.label}</p>}
      </aside>

      <p className="menu__foot">{t.coursesSection.footnote}</p>
    </div>
  );
}

/* ── Reserve this course ──────────────────────────────────────────────────
   On a phone, LINE opens with the course already in the message. A desktop
   can't open that chat, so there the reservation drawer shows the QR and the
   message to copy. Without the script, the link still opens LINE. */
function ReserveCourse({ course, locale }: { course: Course; locale: Locale }) {
  const c = advisorCopy[locale];
  const name = locale === "th" ? course.nameTh : course.nameEn;
  return (
    <a
      className="btn"
      href={reserveLink(course, locale)}
      onClick={(e) => {
        if (!hasPointer()) return;
        e.preventDefault();
        openReserve(course.id);
      }}
    >
      {fill(c.course.reserve, { course: name })} <Arrow />
    </a>
  );
}

/* ── Best for, and what sets it apart ─────────────────────────────────────── */
function AdviceBlock({ id, locale, full }: { id: string; locale: Locale; full?: boolean }) {
  const adv = adviceFor(id);
  const k = courseById(id);
  if (!adv || !k) return null;
  const c = advisorCopy[locale];
  const name = locale === "th" ? k.nameTh : k.nameEn;
  return (
    <dl className="advice">
      <div className="advice__row">
        <dt className="u-label">{c.course.bestFor}</dt>
        <dd>
          {adv.bestFor.map((b, i) => (
            <span key={i} className="advice__best">{b[locale]}</span>
          ))}
        </dd>
      </div>
      {(full || !adv.why) && (
        <div className="advice__row advice__row--wide">
          <dt className="u-label">{c.course.who}</dt>
          <dd>{adv.who[locale]}</dd>
        </div>
      )}
      {adv.why && (
        <div className="advice__row advice__row--wide">
          <dt className="u-label">{fill(c.course.why, { course: name })}</dt>
          <dd>{adv.why[locale]}</dd>
        </div>
      )}
    </dl>
  );
}

/* ── One course ───────────────────────────────────────────────────────────── */
function CourseRow({
  course, locale, isOpen, onToggle, onPreview, touch,
}: {
  course: Course;
  locale: Locale;
  isOpen: boolean;
  onToggle: () => void;
  onPreview: (p: { src: string; label: string } | null) => void;
  touch: boolean;
}) {
  const t = getDict(locale);
  const c = advisorCopy[locale];
  const th = locale === "th";
  const adv = adviceFor(course.id);
  const panelId = `course-panel-${course.key}`;
  const name = th ? course.nameTh : course.nameEn;
  const unit = th ? course.unitTh : course.unitEn;
  const listLabel = th ? course.listLabelTh : course.listLabelEn;
  const desc = th ? course.descTh : course.descEn;
  const forWho = th ? course.forTh : course.forEn;

  // A dish without its own photograph borrows one from its course, so the
  // stage never goes blank — but it is never captioned as that dish.
  const fallback = course.photos[0];
  const show = (d: Dish) => {
    const src = d.photo ?? fallback;
    if (!src) return;
    onPreview({ src, label: d.photo ? (d.nameTh ?? d.nameEn) : name });
  };

  const groups = course.menus
    ? course.menus.map((m) => ({ label: th ? m.labelTh : m.labelEn, dishes: m.dishes }))
    : [{ label: "", dishes: course.dishes ?? [] }];

  const total = course.menus ? course.menus.length : allDishes(course).length;

  return (
    <li className={`course ${isOpen ? "is-open" : ""}`} id={`course-${course.id}`}>
      <h3 className="course__h">
        <button className="course__btn" onClick={onToggle} aria-expanded={isOpen} aria-controls={panelId}>
          <span className="course__idx u-numeral">{course.index}</span>
          <span className="course__kanji" aria-hidden="true">{course.kanji}</span>
          <span className="course__name">{name}</span>
          <span className="course__meta">
            {adv && <span className="course__tag">{adv.tag[locale]}</span>}
            <span className="course__count u-numeral">{course.count} {unit}</span>
            <span className="course__price u-numeral">{formatBaht(course.price)}<i>++</i></span>
          </span>
          <Chevron />
        </button>
      </h3>

      <div className="course__panel" id={panelId} role="region" hidden={!isOpen}>
        <div className="course__inner">
          <p className="course__desc">{desc}</p>
          {/* The age is on the heading and "Best for" says the rest, so the
              old one-line tagline would only repeat them. */}
          {forWho && !adv && <p className="course__for">{forWho}</p>}
          <AdviceBlock id={course.id} locale={locale} />

          <div className="course__listhead">
            <span className="u-label">{listLabel}</span>
            {course.listIsPartial && (
              <span className="course__partial">{t.coursesSection.partialNote}</span>
            )}
          </div>

          <DishGroups cid={course.id} groups={groups} locale={locale} touch={touch} onShow={show} />

          <div className="course__acts">
            <ReserveCourse course={course} locale={locale} />
            <Link className="link-arrow" href={`/${locale}/courses/${course.slug}/`}>
              {fill(c.course.open, { course: name })} <Arrow />
            </Link>
            <span className="course__total u-numeral">
              {total} {unit}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

function DishGroups({
  cid, groups, locale, touch, onShow,
}: {
  cid: string;
  groups: { label: string; dishes: Dish[] }[];
  locale: Locale;
  touch: boolean;
  onShow: (d: Dish) => void;
}) {
  return (
    <>
      {groups.map((g, gi) => (
        <div className="course__group" key={gi}>
          {g.label && <p className="course__grouph u-label">{g.label}</p>}
          <ol className="dishes" start={1}>
            {g.dishes.map((d, i) => (
              <DishRow
                key={`${gi}-${i}`}
                uid={`${cid}-${gi}-${i}`}
                dish={d}
                n={i + 1}
                locale={locale}
                touch={touch}
                onShow={() => onShow(d)}
              />
            ))}
          </ol>
        </div>
      ))}
    </>
  );
}

/* ── A course on its own page ─────────────────────────────────────────────
   The link a member of staff sends to answer "which course for my
   thirteen-year-old?": the course, who it is for, every dish, and Reserve. */
export function CourseDetail({ id, locale }: { id: string; locale: Locale }) {
  const [touch, setTouch] = useState(false);
  useEffect(() => { setTouch(!hasPointer()); }, []);
  useSpotlight(touch);
  const course = courseById(id);
  if (!course) return null;
  const c = advisorCopy[locale];
  const th = locale === "th";
  const adv = adviceFor(id);
  const name = th ? course.nameTh : course.nameEn;
  const unit = th ? course.unitTh : course.unitEn;
  const groups = course.menus
    ? course.menus.map((m) => ({ label: th ? m.labelTh : m.labelEn, dishes: m.dishes }))
    : [{ label: "", dishes: course.dishes ?? [] }];

  return (
    <article className="cdetail">
      <header className="cdetail__head">
        {adv && <span className="course__tag cdetail__tag">{adv.tag[locale]}</span>}
        <h1 className="display cdetail__h">{name}</h1>
        <p className="cdetail__facts u-numeral">
          {course.count} {unit} · {formatBaht(course.price)}<i>++</i>
        </p>
      </header>
      {course.photos[0] && (
        <figure className="cdetail__photo">
          <Image
            src={asset(course.photos[0])}
            alt=""
            width={1200}
            height={900}
            sizes="(max-width: 52rem) 100vw, 52rem"
            className="cdetail__img"
            priority
          />
        </figure>
      )}
      <p className="u-lede cdetail__desc">{th ? course.descTh : course.descEn}</p>
      <AdviceBlock id={id} locale={locale} full />
      <div className="cdetail__list">
        <span className="u-label">{th ? course.listLabelTh : course.listLabelEn}</span>
        <DishGroups cid={course.id} groups={groups} locale={locale} touch={touch} onShow={() => {}} />
      </div>
      <div className="course__acts">
        <ReserveCourse course={course} locale={locale} />
        <Link className="link-arrow" href={`/${locale}/#courses`}>{c.course.all} <Arrow /></Link>
      </div>
    </article>
  );
}

/* ── One dish ─────────────────────────────────────────────────────────────── */
function DishRow({
  dish, n, uid, locale, touch, onShow,
}: {
  dish: Dish;
  n: number;
  uid: string;
  locale: Locale;
  touch: boolean;
  onShow: () => void;
}) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const name = locale === "th" ? (dish.nameTh ?? dish.nameEn) : dish.nameEn;
  /* Only a dish's own photograph opens under its name. Falling back to the
     course's picture here put a photograph of a different dish directly under
     this one's name on phones. The desktop stage still borrows the course
     picture, but captions it with the course, never the dish. */
  const src = dish.photo;
  const ratio = src ? photoRatio(src) : 0.75;   // its height ÷ width, known before the picture loads
  // Just before a photograph above the screen folds: its list's height and the page's position.
  const folding = useRef<{ h: number; y: number } | null>(null);

  // On a phone the spotlight decides what is lit and open (useSpotlight); on a tablet, a tap.
  const spotting = useSyncExternalStore(spotSubscribe, () => spot.on, () => false) && touch;
  const lit = useSyncExternalStore(spotSubscribe, () => spot.lit === uid, () => false);
  const opened = useSyncExternalStore(spotSubscribe, () => spot.open === uid || spot.linger.has(uid), () => false);
  const leaving = useSyncExternalStore(spotSubscribe, () => spot.linger.has(uid), () => false);
  const open = spotting ? opened : shown;
  // Fetched the first time it is wanted, then kept, so it opens at once after that.
  const [wanted, setWanted] = useState(false);
  useEffect(() => { if (open) setWanted(true); }, [open]);
  // A tablet's tapped-open photo doesn't come back after a turn through phone width.
  useEffect(() => { if (spotting) setShown(false); }, [spotting]);
  // On a tablet, opening or closing a photo re-balances the two columns and can
  // lift the tapped dish 40–80px: the page follows it, so it stays under the finger.
  const tapAt = useRef<number | null>(null);
  useLayoutEffect(() => {
    const t = tapAt.current;
    tapAt.current = null;
    const b = ref.current?.querySelector(".dish__btn")?.getBoundingClientRect();
    if (t === null || !b) return;
    if (Math.abs(b.top - t) > 0.5) now(() => window.scrollBy(0, b.top - t));
  }, [shown]);

  /* The phone's photograph slides open and shut at its true height. Heights
     are set here, in pixels, so a slide can be frozen part-way (a photo that
     loses the middle on an iPhone mid-fling keeps exactly the space it has)
     and so every slide interpolates. A row that isn't the lit one tells hold()
     before it changes, so the dish at the middle stays where it is. */
  const dropRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const drop = dropRef.current, li = ref.current;
    if (!spotting || !drop || !li) return;
    if (leaving) {
      const h = drop.getBoundingClientRect().height;   // read first: stopping the slide jumps it to its end
      drop.dataset.frozen = "1";
      drop.style.transition = "none";
      drop.style.height = `${h}px`;
      return;
    }
    const to = open ? "open" : "0";
    if (drop.dataset.to === to && !drop.dataset.frozen) return;
    delete drop.dataset.frozen;
    drop.dataset.to = to;
    if (spot.lit !== uid) hold(li);
    const from = drop.getBoundingClientRect().height;
    const target = open ? (drop.firstElementChild as HTMLElement).scrollHeight : 0;
    drop.style.transition = "none";
    drop.style.height = `${from}px`;
    void drop.offsetHeight;
    drop.style.transition = "";
    drop.style.height = `${target}px`;
    // No slide to speak of (reduced motion shortens every transition to next to nothing): done at once.
    if (Math.max(...getComputedStyle(drop).transitionDuration.split(",").map(parseFloat)) < 0.05) {
      if (open) drop.style.height = "auto";
      if (spot.lit !== uid) holdNow();
    }
  }, [open, leaving, spotting, uid]);
  // Once fully open, its height follows the picture (a turned phone, a font arriving).
  useEffect(() => {
    const drop = dropRef.current;
    if (!drop) return;
    const end = (e: TransitionEvent) => {
      if (e.target === drop && e.propertyName === "height" && drop.dataset.to === "open" && !drop.dataset.frozen) drop.style.height = "auto";
    };
    drop.addEventListener("transitionend", end);
    return () => drop.removeEventListener("transitionend", end);
  }, [spotting]);

  /* An opened photograph folds itself away once the guest has scrolled past
     it, either way, so the menu stays tidy.
     - Wholly below the screen, it folds at once: nothing in sight moves.
     - Wholly above it, under the fixed header and the pinned course bar, it
       waits until the page has been still for a moment with no finger on the
       glass, so it never interrupts a fling or a drag. Then it folds and puts
       the page back by exactly the height the page lost, so what the guest is
       reading stays where it is (iPhones have no scroll anchoring to do it).
     - While any of it is on screen, it stays open.
     In a two-column dish list (tablets, a phone on its side) folding one photo
     re-balances the columns, so there it waits until the whole list is out of
     sight. Everything is measured live on each scroll: the header compacts and
     the course bar pins itself as the page moves. */
  useEffect(() => {
    const li = ref.current;
    const list = li?.closest<HTMLElement>(".dishes");
    if (!touch || spotting || !shown || !li || !list) return;
    watchHand();
    const watched = () => {
      const cols = getComputedStyle(list).columnCount;
      return cols !== "auto" && Number(cols) > 1 ? list : li;
    };
    let idle = 0, frame = 0, waiting = false;
    const fold = () => {
      waiting = false;
      if (!li.getBoundingClientRect().height) return setShown(false);   // its course was closed: nothing to give back
      folding.current = { h: list.getBoundingClientRect().height, y: window.scrollY };
      document.documentElement.style.overflowAnchor = "none";            // the only correction is ours
      setShown(false);
    };
    const arm = () => {
      waiting = true;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        if (finger.down) return;                                          // a resting finger is not "still"
        if (watched().getBoundingClientRect().bottom > cover()) { waiting = false; return; }
        fold();
      }, 180);
    };
    const check = () => {
      frame = 0;
      if (!li.getBoundingClientRect().height) return setShown(false);
      const w = watched().getBoundingClientRect();
      if (w.top >= window.innerHeight) return setShown(false);            // wholly below the screen
      if (w.bottom <= cover()) return arm();                              // wholly above, out of sight
      waiting = false;
      window.clearTimeout(idle);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(check); };
    const up = () => { if (waiting) arm(); };   // the finger lifted: start the wait again
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchend", up, { passive: true });
    window.addEventListener("touchcancel", up, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchcancel", up);
      window.clearTimeout(idle);
      window.cancelAnimationFrame(frame);
    };
  }, [touch, shown, spotting]);

  // Put the page back by exactly the height it lost, so nothing on screen moves.
  // The target is absolute, so a page shortened at its very bottom (where the
  // browser clamps the scroll position itself) is not corrected twice.
  useLayoutEffect(() => {
    const f = folding.current;
    if (shown || !f) return;
    folding.current = null;
    if (!giveBack.open) {
      giveBack.open = true;
      giveBack.y = f.y;
      giveBack.lists.clear();
      window.requestAnimationFrame(() => {
        giveBack.open = false;
        document.documentElement.style.overflowAnchor = "";
      });
    }
    const list = ref.current?.closest<HTMLElement>(".dishes");
    if (list) giveBack.lists.set(list, Math.max(0, f.h - list.getBoundingClientRect().height));
    let gone = 0;
    giveBack.lists.forEach((g) => { gone += g; });
    if (gone > 0.5) now(() => window.scrollTo(0, giveBack.y - gone));
  }, [shown]);

  return (
    <li
      ref={ref}
      data-uid={uid}
      className={`dish ${src ? "has-photo" : ""} ${open ? "is-shown" : ""} ${spotting && lit ? "is-lit" : ""} ${spotting && leaving ? "is-leaving" : ""}`}
      onMouseEnter={touch ? undefined : onShow}
      onFocus={onShow}
    >
      <button
        className="dish__btn"
        onClick={() => {
          onShow();
          if (!touch) return;
          if (spotting) tapSpot(uid, ref.current);
          else if (src) {
            tapAt.current = ref.current?.querySelector(".dish__btn")?.getBoundingClientRect().top ?? null;
            setShown((v) => !v);
          }
        }}
        aria-expanded={touch && src ? open : undefined}
      >
        <span className="dish__n u-numeral">{String(n).padStart(2, "0")}</span>
        <span className="dish__name">{name}</span>
        {src && <span className="dish__dot" aria-hidden="true" />}
      </button>

      {/* On touch the picture opens under the dish, since there is no hover. On
          a phone it slides open and shut (sections.css, .dish__drop); on a
          tablet it appears on a tap. */}
      {touch && src && spotting && (
        <div className="dish__drop" aria-hidden={!open} ref={dropRef}>
          <div className="dish__shot">
            {(open || wanted) && (
              <Image src={asset(src)} alt="" width={640} height={Math.round(640 * ratio)} className="dish__shotimg" sizes="90vw" loading="eager" />
            )}
          </div>
        </div>
      )}
      {touch && src && !spotting && shown && (
        <div className="dish__shot">
          <Image src={asset(src)} alt="" width={640} height={Math.round(640 * ratio)} className="dish__shotimg" sizes="90vw" />
        </div>
      )}
    </li>
  );
}
