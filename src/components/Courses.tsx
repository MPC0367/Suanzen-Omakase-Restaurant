"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { activeCourses, formatBaht, allDishes, type Course, type Dish } from "@/content/courses";
import { getDict, type Locale } from "@/content/dictionary";

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

/**
 * The menu. Each course opens to its full list of dishes; pointing at a dish
 * shows the restaurant's photograph of it, where one exists. Dishes with no
 * photograph fall back to a picture from the same course rather than an empty
 * frame, and nothing is ever shown against the wrong dish.
 */
export default function Courses({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [open, setOpen] = useState<string | null>(activeCourses[0]?.id ?? null);
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(!window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const openCourse = useMemo(
    () => activeCourses.find((c) => c.id === open) ?? null,
    [open],
  );

  // When a course opens, the stage shows that course until a dish is pointed at.
  useEffect(() => {
    if (!openCourse) return setPreview(null);
    const first = openCourse.photos[0];
    if (first) {
      setPreview({
        src: first,
        label: locale === "th" ? openCourse.nameTh : openCourse.nameEn,
      });
    }
  }, [openCourse, locale]);

  const toggle = useCallback((id: string) => {
    setOpen((cur) => (cur === id ? null : id));
  }, []);

  return (
    <div className="menu">
      <ul className="menu__list">
        {activeCourses.map((c) => (
          <CourseRow
            key={c.id}
            course={c}
            locale={locale}
            isOpen={open === c.id}
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
  const th = locale === "th";
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

  const total = allDishes(course).length;

  return (
    <li className={`course ${isOpen ? "is-open" : ""}`}>
      <h3 className="course__h">
        <button className="course__btn" onClick={onToggle} aria-expanded={isOpen} aria-controls={panelId}>
          <span className="course__idx u-numeral">{course.index}</span>
          <span className="course__kanji" aria-hidden="true">{course.kanji}</span>
          <span className="course__name">{name}</span>
          <span className="course__meta">
            <span className="course__count u-numeral">{course.count} {unit}</span>
            <span className="course__price u-numeral">{formatBaht(course.price)}<i>++</i></span>
          </span>
          <Chevron />
        </button>
      </h3>

      <div className="course__panel" id={panelId} role="region" hidden={!isOpen}>
        <div className="course__inner">
          <p className="course__desc">{desc}</p>
          {forWho && <p className="course__for">{forWho}</p>}

          <div className="course__listhead">
            <span className="u-label">{listLabel}</span>
            {course.listIsPartial && (
              <span className="course__partial">{t.coursesSection.partialNote}</span>
            )}
          </div>

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
                    onShow={() => show(d)}
                    fallback={fallback}
                  />
                ))}
              </ol>
            </div>
          ))}

          <div className="course__acts">
            <Link className="btn" href={`/${locale}/book?course=${course.slug}`}>
              {t.cta.reserve} <Arrow />
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

/* ── One dish ─────────────────────────────────────────────────────────────── */
function DishRow({
  dish, n, locale, touch, onShow, fallback,
}: {
  dish: Dish;
  n: number;
  locale: Locale;
  touch: boolean;
  onShow: () => void;
  fallback?: string;
}) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const name = locale === "th" ? (dish.nameTh ?? dish.nameEn) : dish.nameEn;
  const src = dish.photo ?? fallback;

  return (
    <li
      ref={ref}
      className={`dish ${dish.photo ? "has-photo" : ""} ${shown ? "is-shown" : ""}`}
      onMouseEnter={touch ? undefined : onShow}
      onFocus={onShow}
    >
      <button
        className="dish__btn"
        onClick={() => { onShow(); if (touch) setShown((v) => !v); }}
        aria-expanded={touch ? shown : undefined}
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
