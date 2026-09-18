"use client";

import { useState } from "react";
import { courseById, formatBaht } from "@/content/courses";
import { adultIds, adviceFor, advisorCopy } from "@/content/advisor";
import { pick, type Locale } from "@/content/dictionary";
import { showCourse } from "@/lib/events";

/**
 * The four adult courses side by side: a real table, so a screen reader reads
 * it as one. A desktop shows all four columns; a phone would crush four into
 * its width, so there the guest picks two to set against each other.
 */
export default function CourseCompare({ locale }: { locale: Locale }) {
  const c = advisorCopy[locale].compare;
  const [picked, setPicked] = useState<string[]>(adultIds.slice(0, 2));

  // Up to two at a time: a third drops the one chosen longest ago.
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? (p.length > 1 ? p.filter((x) => x !== id) : p) : [...p.slice(-1), id]));

  const cols = adultIds.map((id) => ({ id, k: courseById(id)!, adv: adviceFor(id)! })).filter((x) => x.k && x.adv);
  const cell = (id: string) => (picked.includes(id) ? "is-picked" : undefined);

  return (
    <div className="compare" id="compare">
      <h2 className="display compare__h">{c.heading}</h2>

      <div className="compare__pick" role="group" aria-label={c.pickHint}>
        <span className="u-label">{c.pick}</span>
        {cols.map(({ id, k }) => (
          <button
            key={id}
            type="button"
            className="compare__chip"
            aria-pressed={picked.includes(id)}
            onClick={() => toggle(id)}
          >
            {pick(k.name, locale)}
          </button>
        ))}
      </div>

      <div className="compare__scroll">
        <table className="compare__table">
          <caption className="vh">{c.caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="compare__corner">{c.course}</th>
              {cols.map(({ id, k }) => (
                <th scope="col" key={id} data-course={id} className={cell(id)}>
                  <a
                    href={`#course-${id}`}
                    onClick={(e) => { e.preventDefault(); showCourse(id); }}
                  >
                    {pick(k.name, locale)}
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{c.bites}</th>
              {cols.map(({ id, k }) => (
                <td key={id} data-course={id} className={cell(id)}>
                  <span className="u-numeral">{k.count}</span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">{c.food}</th>
              {cols.map(({ id, adv }) => (
                <td key={id} data-course={id} className={cell(id)}>{adv.compare?.food[locale]}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">{c.choice}</th>
              {cols.map(({ id, adv }) => (
                <td key={id} data-course={id} className={cell(id)}>{adv.compare?.choice[locale]}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">{c.price}</th>
              {cols.map(({ id, k }) => (
                <td key={id} data-course={id} className={cell(id)}>
                  <span className="u-numeral">{formatBaht(k.price)}++</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
