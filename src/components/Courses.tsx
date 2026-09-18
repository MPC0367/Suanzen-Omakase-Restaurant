"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import CourseGallery from "@/components/CourseGallery";
import { activeCourses, courseById, formatBaht, allDishes, type Course, type Dish, named } from "@/content/courses";
import { adviceFor, advisorCopy, fill } from "@/content/advisor";
import { getDict, type Locale, pick } from "@/content/dictionary";
import { reserveLink } from "@/lib/line";
import { COURSE_EVENT, hasPointer, openReserve } from "@/lib/events";
import { placeFor } from "@/lib/place";

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
 * The menu. Each course opens to what it is, who it is for, the one photograph
 * the restaurant has sent of it, and its full list of dishes.
 *
 * The list itself is type: names, prices and the order they are served in.
 * Dish photographs used to open under each name as the guest scrolled — the
 * restaurant is sending better pictures, so that is gone, and with it the
 * machinery that held the page still while a picture opened or closed. One
 * picture stands for the whole course instead.
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
  const [phone, setPhone] = useState(false);
  const [live, setLive] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const openRef = useRef(open);
  const anchor = useRef<string | null>(null);

  useEffect(() => { openRef.current = open; }, [open]);

  /* Arriving from the same page in another language: the course the guest had
     open is open here too. Before the first paint, so the header's return to
     their place (Chrome) measures the page as it will stay. */
  useLayoutEffect(() => {
    const kept = placeFor(locale);
    if (kept) setOpen(kept.open.filter((id) => courseById(id)).slice(0, 1));
  }, [locale]);

  /* Which layout this is — the phone's pinned bar, or the desktop's. One course
     is open at a time on both, so crossing between them (a rotated tablet, a
     resized window) opens and closes nothing: the course being read stays open,
     and is brought back into view because the columns around it change width.
     Nothing is written to the open state on the first run: the client's first
     render has to match what the server sent, or the menu shifts under a guest
     who followed a link straight to #visit. */
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const apply = (first: boolean) => {
      if (!first) anchor.current = openRef.current[0] ?? null;
      setPhone(mq.matches);
      setLive(true);
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

  /* The bar slides sideways to keep the open course in view. It scrolls the
     bar itself, never the page — the page's scroll belongs to the guest.

     There used to be a second answer to "which course is the guest reading",
     worked out from the page's scroll position on every frame, because a phone
     held every course open at once and so "open" told you nothing. One course
     at a time is its own answer, and that machinery is gone: with it went the
     last path by which this menu could set the page's scroll behind the
     guest's back. */
  useEffect(() => {
    const bar = barRef.current;
    const id = open[0];
    if (!phone || !id || !bar) return;
    const chip = bar.querySelector<HTMLElement>(`[data-course="${id}"]`);
    if (!chip) return;
    const left = chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: still() ? "auto" : "smooth" });
  }, [phone, open]);

  // One course at a time: opening one closes the one before it. Tapping the
  // open course's own heading folds it away, leaving the menu closed.
  const toggle = useCallback((id: string) => {
    setOpen((cur) => (cur.includes(id) ? [] : [id]));
  }, []);

  /* The shortcuts: every course with its price, one tap from the top of the
     menu. Choosing a course here always opens it, never closes it, and brings
     its heading into view under the header. */
  const jumpTo = useCallback((id: string) => {
    setOpen([id]);
    /* Placed, not glided. Opening a course closes the one before it, and when
       that one sat above, everything below shifts in the same frame — a smooth
       scroll toward a target that is still moving lands somewhere else. The
       layout effect above puts the heading under the bar once the panels have
       changed, in the frame they change. */
    anchor.current = id;
  }, []);

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

  /* The bar lights the open course, on every screen. It used to work out what
     was being read from the page's scroll position, because on a phone every
     course was open at once and "open" said nothing. One course at a time is
     its own answer, and the page's scroll is left alone — which is the safer
     of the two, since a scroll the page sets itself kills a fling on an
     iPhone. */
  const lit = open[0] ?? null;

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
            <span className="jump__name">{pick(c.name, locale)}</span>
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
          />
        ))}
      </ul>

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
  const name = pick(course.name, locale);
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

/* ── The picture the restaurant sends for a course ─────────────────────────
   One photograph stands for the whole course, on the menu and on the course's
   own page. A course without one shows none: nothing is borrowed from another
   course, and no frame is left standing empty. */
function CoursePhoto({ course, className }: { course: Course; className: string }) {
  if (!course.sample) return null;
  return (
    <figure className={className}>
      <Image
        src={asset(course.sample.src)}
        alt=""
        width={course.sample.w}
        height={course.sample.h}
        sizes="(min-width: 64rem) 46rem, 100vw"
        className="course__img"
      />
    </figure>
  );
}

/* ── Best for, and what sets it apart ─────────────────────────────────────── */
function AdviceBlock({ id, locale, full }: { id: string; locale: Locale; full?: boolean }) {
  const adv = adviceFor(id);
  const k = courseById(id);
  if (!adv || !k) return null;
  const c = advisorCopy[locale];
  const name = pick(k.name, locale);
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
  course, locale, isOpen, onToggle,
}: {
  course: Course;
  locale: Locale;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = getDict(locale);
  const c = advisorCopy[locale];
  const adv = adviceFor(course.id);
  const panelId = `course-panel-${course.key}`;
  const name = pick(course.name, locale);
  const unit = pick(course.unit, locale);
  const listLabel = pick(course.listLabel, locale);
  const desc = pick(course.desc, locale);
  const forWho = pick(course.forWho, locale);

  const groups = course.menus
    ? course.menus.map((m) => ({ label: pick(m.label, locale), dishes: m.dishes }))
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
          {/* The course's own photographs, in the order they are served. A
              course the restaurant has not sent named pictures for shows its
              one sample here instead, rather than nothing. */}
          {course.gallery?.length
            ? <CourseGallery course={course} locale={locale} />
            : <CoursePhoto course={course} className="course__photo" />}
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

          <DishGroups groups={groups} locale={locale} />

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

/* ── The dishes, in the order they are served ─────────────────────────────── */
function DishGroups({
  groups, locale,
}: {
  groups: { label: string; dishes: Dish[] }[];
  locale: Locale;
}) {
  return (
    <>
      {groups.map((g, gi) => (
        <div className="course__group" key={gi}>
          {g.label && <p className="course__grouph u-label">{g.label}</p>}
          <ol className="dishes" start={1}>
            {g.dishes.map((d, i) => (
              <li className="dish" key={`${gi}-${i}`}>
                <span className="dish__n u-numeral">{String(i + 1).padStart(2, "0")}</span>
                <span className="dish__name">{named(d.name, locale)}</span>
              </li>
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
  const course = courseById(id);
  if (!course) return null;
  const c = advisorCopy[locale];
  const adv = adviceFor(id);
  const name = pick(course.name, locale);
  const unit = pick(course.unit, locale);
  const groups = course.menus
    ? course.menus.map((m) => ({ label: pick(m.label, locale), dishes: m.dishes }))
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
      <CoursePhoto course={course} className="cdetail__photo" />
      <p className="u-lede cdetail__desc">{pick(course.desc, locale)}</p>
      <AdviceBlock id={id} locale={locale} full />
      <div className="cdetail__list">
        <span className="u-label">{pick(course.listLabel, locale)}</span>
        <DishGroups groups={groups} locale={locale} />
      </div>
      <div className="course__acts">
        <ReserveCourse course={course} locale={locale} />
        <Link className="link-arrow" href={`/${locale}/#courses`}>{c.course.all} <Arrow /></Link>
      </div>
    </article>
  );
}
