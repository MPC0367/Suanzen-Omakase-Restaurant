"use client";

import { useEffect, useRef, useState } from "react";
import { courseById, formatBaht } from "@/content/courses";
import { adultIds, adviceFor, advisorCopy, finder, fill, type Answer } from "@/content/advisor";
import type { Locale } from "@/content/dictionary";
import { reserveLink } from "@/lib/line";
import { hasPointer, openReserve, showCourse } from "@/lib/events";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Find your course. The page opens on the question every guest has — which
 * course is right for me — and answers it for a family at a glance: younger
 * diners, teenage diners, adult diners, each with its course. The finder is
 * there for adults choosing between the four: two or three taps, no form.
 */
export default function CourseAdvisor({ locale }: { locale: Locale }) {
  const c = advisorCopy[locale];
  const th = locale === "th";
  const name = (id: string) => {
    const k = courseById(id);
    return k ? (th ? k.nameTh : k.nameEn) : id;
  };
  const size = (id: string) => {
    const k = courseById(id);
    return k ? `${k.count} ${th ? k.unitTh : k.unitEn}` : "";
  };

  // Links still work without the script; with it, the menu opens the course.
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    showCourse(id);
  };

  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string[]>([finder[0].id]);
  const [result, setResult] = useState<{ answer: Answer; from: string } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLFieldSetElement>(null);
  const started = useRef(false);

  const q = finder.find((x) => x.id === path[path.length - 1]) ?? finder[0];

  // Focus follows the finder: each new question's first answer, then the result.
  useEffect(() => {
    if (!started.current) return;
    if (result) resultRef.current?.querySelector<HTMLElement>(".finder__name, .finder__why")?.focus();
    else questionRef.current?.querySelector<HTMLButtonElement>(".finder__a")?.focus();
  }, [path, result]);

  const choose = (a: Answer) => {
    started.current = true;
    if ("next" in a) setPath((p) => [...p, a.next]);
    else setResult({ answer: a, from: q.id });
  };
  const back = () => { started.current = true; setPath((p) => (p.length > 1 ? p.slice(0, -1) : p)); };
  const again = () => { started.current = true; setResult(null); setPath([finder[0].id]); };

  const reserveClick = (id: string) => (e: React.MouseEvent) => {
    if (!hasPointer()) return;
    e.preventDefault();
    openReserve(id);
  };

  const family: { who: string; ids: string[] }[] = [
    { who: c.family.younger, ids: ["zen-kids"] },
    { who: c.family.teen, ids: ["zen-ichi"] },
    { who: c.family.adult, ids: adultIds },
  ];

  const note = result ? finder.find((x) => x.id === result.from)?.note : undefined;
  const answer = result?.answer;

  return (
    <div className="advisor">
      <header className="advisor__head">
        <span className="u-label">{c.label}</span>
        <h1 className="display advisor__h">{c.heading}</h1>
        <p className="u-lede advisor__intro">{c.intro}</p>
      </header>

      {/* A course for each member of the family, readable in a glance. */}
      <ol className="family" aria-label={c.family.label}>
        {family.map((f) => (
          <li className={`family__step ${f.ids.length > 1 ? "family__step--adult" : ""}`} key={f.who}>
            <span className="family__who">{f.who}</span>
            <ul className="family__courses">
              {f.ids.map((id) => (
                <li key={id}>
                  <a className="family__course" href={`#course-${id}`} onClick={go(id)}>
                    <span className="family__name">{name(id)}</span>
                    <span className="family__tag">
                      {f.ids.length > 1 ? size(id) : adviceFor(id)?.tag[locale]}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="finder">
        <button
          type="button"
          className="finder__open"
          aria-expanded={open}
          aria-controls="finder-panel"
          onClick={() => setOpen((v) => !v)}
        >
          {c.finder.open}
        </button>

        <div id="finder-panel" className="finder__panel" hidden={!open}>
          <div className="finder__live">
            {!answer ? (
              <fieldset className="finder__q" key={q.id} ref={questionRef}>
                <legend className="finder__legend">{q.legend[locale]}</legend>
                <div className="finder__answers">
                  {q.answers.map((a) => (
                    <button type="button" className="finder__a" key={a.id} onClick={() => choose(a)}>
                      <span className="finder__al">{a.label[locale]}</span>
                      {a.hint && <span className="finder__ah">{a.hint[locale]}</span>}
                    </button>
                  ))}
                </div>
                {q.note && <p className="finder__note">{q.note[locale]}</p>}
                {path.length > 1 && (
                  <button type="button" className="finder__text" onClick={back}>{c.finder.back}</button>
                )}
              </fieldset>
            ) : "compare" in answer ? (
              <div className="finder__result" ref={resultRef}>
                <p className="finder__why" tabIndex={-1}>{c.finder.compareNote}</p>
                <div className="finder__acts">
                  <a className="btn" href="#compare">{c.finder.compare} <Arrow /></a>
                </div>
                <button type="button" className="finder__text" onClick={again}>{c.finder.again}</button>
              </div>
            ) : "course" in answer ? (
              <Result
                id={answer.course}
                also={answer.also}
                locale={locale}
                note={note?.[locale]}
                name={name}
                size={size}
                go={go}
                reserveClick={reserveClick}
                again={again}
                refEl={resultRef}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Result({
  id, also, locale, note, name, size, go, reserveClick, again, refEl,
}: {
  id: string;
  also?: string;
  locale: Locale;
  note?: string;
  name: (id: string) => string;
  size: (id: string) => string;
  go: (id: string) => (e: React.MouseEvent) => void;
  reserveClick: (id: string) => (e: React.MouseEvent) => void;
  again: () => void;
  refEl: React.RefObject<HTMLDivElement | null>;
}) {
  const c = advisorCopy[locale];
  const k = courseById(id);
  const adv = adviceFor(id);
  if (!k || !adv) return null;
  return (
    <div className="finder__result" ref={refEl}>
      <span className="u-label">{c.finder.result}</span>
      <h2 className="display finder__name" tabIndex={-1}>{name(id)}</h2>
      <p className="finder__facts u-numeral">
        {size(id)} · {adv.tag[locale]} · {formatBaht(k.price)}++
      </p>
      <p className="finder__why">{(adv.why ?? adv.who)[locale]}</p>
      {note && <p className="finder__note">{note}</p>}
      <div className="finder__acts">
        <a className="btn" href={reserveLink(k, locale)} onClick={reserveClick(id)}>
          {fill(c.course.reserve, { course: name(id) })} <Arrow />
        </a>
        <a className="link-arrow" href={`#course-${id}`} onClick={go(id)}>
          {fill(c.finder.view, { course: name(id) })} <Arrow />
        </a>
      </div>
      {also && (
        <p className="finder__also">
          <span className="u-label">{c.finder.also}</span>{" "}
          <a href={`#course-${also}`} onClick={go(also)}>{name(also)}</a>
          <span className="finder__alsotag"> · {size(also)} · {adviceFor(also)?.tag[locale]}</span>
        </p>
      )}
      <button type="button" className="finder__text" onClick={again}>{c.finder.again}</button>
    </div>
  );
}
