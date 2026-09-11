"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { activeCourses, courseById, formatBaht, allDishes, type Course, type Dish } from "@/content/courses";
import { adviceFor, advisorCopy, fill } from "@/content/advisor";
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
 * read, would shove the page and throw a #visit link off its mark.
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

          <DishGroups groups={groups} locale={locale} touch={touch} onShow={show} />

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
  groups, locale, touch, onShow,
}: {
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
        <DishGroups groups={groups} locale={locale} touch={touch} onShow={() => {}} />
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
  dish, n, locale, touch, onShow,
}: {
  dish: Dish;
  n: number;
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
  // Just before a photograph above the screen folds: its list's height and the page's position.
  const folding = useRef<{ h: number; y: number } | null>(null);

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
    if (!touch || !shown || !li || !list) return;
    const cover = () => Math.max(
      0,
      document.querySelector(".hdr")?.getBoundingClientRect().bottom ?? 0,
      document.querySelector(".menu__jump")?.getBoundingClientRect().bottom ?? 0,
    );
    const watched = () => {
      const cols = getComputedStyle(list).columnCount;
      return cols !== "auto" && Number(cols) > 1 ? list : li;
    };
    let idle = 0, frame = 0, touching = false, waiting = false;
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
        if (touching) return;                                             // a resting finger is not "still"
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
    const down = () => { touching = true; };
    const up = () => { touching = false; if (waiting) arm(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchend", up, { passive: true });
    window.addEventListener("touchcancel", up, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchcancel", up);
      window.clearTimeout(idle);
      window.cancelAnimationFrame(frame);
    };
  }, [touch, shown]);

  // Put the page back by exactly the height it lost, so nothing on screen moves.
  // The target is absolute, so a page shortened at its very bottom (where the
  // browser clamps the scroll position itself) is not corrected twice.
  useLayoutEffect(() => {
    const f = folding.current;
    if (shown || !f) return;
    folding.current = null;
    const list = ref.current?.closest<HTMLElement>(".dishes");
    const gone = list ? f.h - list.getBoundingClientRect().height : 0;
    if (gone > 0.5) now(() => window.scrollTo(0, f.y - gone));
    window.requestAnimationFrame(() => { document.documentElement.style.overflowAnchor = ""; });
  }, [shown]);

  return (
    <li
      ref={ref}
      className={`dish ${dish.photo ? "has-photo" : ""} ${shown ? "is-shown" : ""}`}
      onMouseEnter={touch ? undefined : onShow}
      onFocus={onShow}
    >
      <button
        className="dish__btn"
        onClick={() => { onShow(); if (touch && src) setShown((v) => !v); }}
        aria-expanded={touch && src ? shown : undefined}
      >
        <span className="dish__n u-numeral">{String(n).padStart(2, "0")}</span>
        <span className="dish__name">{name}</span>
        {dish.photo && <span className="dish__dot" aria-hidden="true" />}
      </button>

      {/* On touch the picture opens under the dish, since there is no hover. */}
      {touch && shown && src && (
        <div className="dish__shot">
          <Image src={asset(src)} alt="" width={640} height={480} className="dish__shotimg" sizes="90vw" />
        </div>
      )}
    </li>
  );
}
