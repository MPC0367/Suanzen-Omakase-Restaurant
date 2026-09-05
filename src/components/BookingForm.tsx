"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { booking } from "@/content/booking";
import { activeCourses, formatBaht } from "@/content/courses";
import { restaurant } from "@/content/restaurant";
import { getDict, type Locale } from "@/content/dictionary";
import { bangkokNow, isClosed, seatingIsOpen, validPhone, ymd } from "@/lib/booking";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Draft = {
  date: string;
  seatingId: string;
  courseId: string;
  party: number;
  name: string;
  phone: string;
  lineId: string;
  notes: string;
};

/* The static export has no server to post to, so the same form hands the
   booking to LINE instead. Baked in at build time by `npm run export`. */
const STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

/**
 * With no server there is nobody to keep a secret, so the static build posts
 * to Apps Script itself. Both values below ship inside the page and anyone
 * may read them; the script's own rate limit is what guards the sheet.
 * Unset, the form falls back to handing the booking to LINE.
 */
const SHEET_URL = process.env.NEXT_PUBLIC_SHEET_URL ?? "";
const SHEET_KEY = process.env.NEXT_PUBLIC_SHEET_KEY ?? "";

const EMPTY: Draft = {
  date: "", seatingId: "", courseId: "undecided", party: 0,
  name: "", phone: "", lineId: "", notes: "",
};

/** The next N bookable days, grouped into the months they fall in. */
function useCalendar() {
  return useMemo(() => {
    const now = bangkokNow();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days: { date: Date; key: string; closed: boolean }[] = [];
    for (let i = 0; i <= booking.daysAhead; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, key: ymd(d), closed: isClosed(d) });
    }
    const months = new Map<string, typeof days>();
    days.forEach((d) => {
      const k = `${d.date.getFullYear()}-${d.date.getMonth()}`;
      if (!months.has(k)) months.set(k, []);
      months.get(k)!.push(d);
    });
    return { days, months: [...months.values()] };
  }, []);
}

export default function BookingForm({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const b = t.booking;
  const { months } = useCalendar();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ ref: string; message?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendError, setSendError] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Arriving from a course row carries the choice over. Read from the URL
  // directly rather than useSearchParams so the page stays static.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("course");
    if (!slug) return;
    const course = activeCourses.find((c) => c.slug === slug);
    if (course) setDraft((d) => ({ ...d, courseId: course.id }));
  }, []);

  // Move focus to the new step so the flow works on a keyboard and a screen
  // reader, but don't steal focus on first paint.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    headingRef.current?.focus();
  }, [step, done]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => { const n = { ...e }; delete n[k as string]; return n; });
  };

  const dayName = (d: Date) =>
    d.toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { weekday: "short" });
  const monthName = (d: Date) =>
    d.toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { month: "long", year: "numeric" });
  const longDate = (s: string) =>
    s
      ? new Date(s + "T00:00:00").toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", {
          weekday: "long", day: "numeric", month: "long",
        })
      : "";

  const seatingsForDate = booking.seatings.map((s) => ({
    ...s,
    open: draft.date ? seatingIsOpen(draft.date, s.id) : false,
  }));
  const anySeatingOpen = seatingsForDate.some((s) => s.open);

  const validateStep = (i: number): boolean => {
    const e: Record<string, string> = {};
    if (i === 0 && !draft.date) e.date = b.errDate;
    if (i === 1 && !draft.seatingId) e.seatingId = b.errSeating;
    if (i === 3 && !draft.party) e.party = b.errParty;
    if (i === 4) {
      if (draft.name.trim().length < 2) e.name = b.errName;
      if (!validPhone(draft.phone)) e.phone = b.errPhone;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 5)); };
  const back = () => { setErrors({}); setStep((s) => Math.max(s - 1, 0)); };

  /** The booking written out as a message a person can read. */
  const composeMessage = () => {
    const course = activeCourses.find((c) => c.id === draft.courseId);
    const seat = booking.seatings.find((s) => s.id === draft.seatingId);
    const lines = [
      locale === "th" ? "ขอจองโต๊ะครับ/ค่ะ" : "I'd like to book a seating.",
      `${b.steps[0]}: ${longDate(draft.date)}`,
      `${b.steps[1]}: ${seat?.time ?? ""}`,
      `${b.steps[2]}: ${course ? (locale === "th" ? course.nameTh : course.nameEn) : b.undecided}`,
      `${b.steps[3]}: ${draft.party}`,
      `${b.name}: ${draft.name}`,
      `${b.phone}: ${draft.phone}`,
    ];
    if (draft.lineId) lines.push(`${b.lineId}: ${draft.lineId}`);
    if (draft.notes) lines.push(`${b.notes}: ${draft.notes}`);
    return lines.join("\n");
  };

  const submit = async () => {
    if (!validateStep(4)) { setStep(4); return; }

    // No server in the static build. Post straight to the sheet when it is
    // configured; otherwise hand the booking to LINE rather than pretend to
    // file it.
    if (STATIC) {
      if (!SHEET_URL || !SHEET_KEY) {
        setDone({ ref: "", message: composeMessage() });
        return;
      }
      setSending(true);
      setSendError("");
      try {
        // text/plain keeps this a "simple" request, so the browser sends it
        // without a preflight — Apps Script answers preflights with a redirect
        // and the booking would never arrive.
        const res = await fetch(SHEET_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            key: SHEET_KEY,
            company: "",                        // honeypot, always empty here
            booking: { ...draft, locale, receivedAt: new Date().toISOString() },
          }),
          redirect: "follow",
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "failed");
        setDone({ ref: json.ref || "" });
      } catch {
        // The sheet is unreachable; the booking is not lost, it goes to LINE.
        setDone({ ref: "", message: composeMessage() });
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, locale }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "failed");
      setDone({ ref: json.ref });
    } catch {
      setSendError(b.errSend);
    } finally {
      setSending(false);
    }
  };

  /* ── Confirmation ─────────────────────────────────────────────────────── */
  if (done) {
    const course = activeCourses.find((c) => c.id === draft.courseId);
    return (
      <div className="bk bk--done">
        <span className="u-label">{b.label}</span>
        <h2 className="display display--course" tabIndex={-1} ref={headingRef}>
          {done.message ? b.staticHeading : b.doneHeading}
        </h2>

        {done.message ? (
          <>
            <p className="u-lede">{b.staticBody}</p>
            <pre className="bk__msg">{done.message}</pre>
            <button
              className="btn btn--ghost bk__copy"
              onClick={() => {
                navigator.clipboard?.writeText(done.message!).then(
                  () => { setCopied(true); window.setTimeout(() => setCopied(false), 2400); },
                  () => {},
                );
              }}
            >
              {copied ? b.copied : b.copy}
            </button>
          </>
        ) : (
          <>
            <p className="bk__ref">
              <span className="u-label">{b.reference}</span>
              <span className="bk__refcode u-numeral">{done.ref}</span>
            </p>
            <p className="bk__pending">{b.notConfirmed}</p>
            <p className="u-lede">{b.doneBody}</p>
          </>
        )}

        <dl className="bk__summary">
          <div><dt className="u-label">{b.steps[0]}</dt><dd>{longDate(draft.date)}</dd></div>
          <div>
            <dt className="u-label">{b.steps[1]}</dt>
            <dd className="u-numeral">
              {booking.seatings.find((s) => s.id === draft.seatingId)?.time}
            </dd>
          </div>
          <div>
            <dt className="u-label">{b.steps[2]}</dt>
            <dd>{course ? (locale === "th" ? course.nameTh : course.nameEn) : b.undecided}</dd>
          </div>
          <div>
            <dt className="u-label">{b.steps[3]}</dt>
            <dd className="u-numeral">
              {draft.party} {draft.party === 1 ? b.guest : b.guests}
            </dd>
          </div>
        </dl>

        <div className="bk__acts">
          <a className="btn" href={restaurant.contact.lineUrl.value} target="_blank" rel="noopener noreferrer">
            {b.doneLine} <Arrow />
          </a>
          <button
            className="link-arrow"
            onClick={() => { setDone(null); setDraft(EMPTY); setStep(0); }}
          >
            {b.doneAgain} <Arrow />
          </button>
        </div>
      </div>
    );
  }

  /* ── The flow ─────────────────────────────────────────────────────────── */
  const headings = [
    b.dateHeading, b.seatingHeading, b.courseHeading,
    b.partyHeading, b.contactHeading, b.reviewHeading,
  ];

  return (
    <div className="bk">
      {/* Progress — states where you are without pretending to be a wizard. */}
      <ol className="bk__steps">
        {b.steps.map((label, i) => (
          <li
            key={label}
            className={`bk__step ${i === step ? "is-on" : ""} ${i < step ? "is-done" : ""}`}
          >
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
            >
              <span className="u-numeral">{String(i + 1).padStart(2, "0")}</span>
              <span className="bk__steplabel">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="bk__panel">
        <p className="bk__of u-label">
          {b.stepOf} <span className="u-numeral">{step + 1}</span> {b.of}{" "}
          <span className="u-numeral">{b.steps.length}</span>
        </p>
        <h2 className="display display--course bk__h" tabIndex={-1} ref={headingRef}>
          {headings[step]}
        </h2>

        {/* ── 1 · DATE ───────────────────────────────────────────────────── */}
        {step === 0 && (
          <fieldset className="bk__field">
            <legend className="u-sr">{b.dateHeading}</legend>
            <p className="bk__hint">{b.dateHint}</p>
            {months.map((month, mi) => (
              <div className="cal" key={mi}>
                <p className="cal__month u-label">{monthName(month[0].date)}</p>
                <div className="cal__days">
                  {month.map(({ date, key, closed }) => {
                    const on = draft.date === key;
                    return (
                      <label key={key} className={`cal__day ${on ? "is-on" : ""} ${closed ? "is-closed" : ""}`}>
                        <input
                          type="radio"
                          name="date"
                          value={key}
                          checked={on}
                          disabled={closed}
                          onChange={() => { set("date", key); set("seatingId", ""); }}
                          className="u-sr"
                        />
                        <span className="cal__dow">{dayName(date)}</span>
                        <span className="cal__num u-numeral">{date.getDate()}</span>
                        {closed && <span className="cal__closed">{b.closedDay}</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            {errors.date && <p className="bk__err" role="alert">{errors.date}</p>}
          </fieldset>
        )}

        {/* ── 2 · SEATING ────────────────────────────────────────────────── */}
        {step === 1 && (
          <fieldset className="bk__field">
            <legend className="u-sr">{b.seatingHeading}</legend>
            <p className="bk__hint">{b.seatingHint}</p>
            {!anySeatingOpen && <p className="bk__err" role="alert">{b.todayLate}</p>}
            <div className="seats">
              {seatingsForDate.map((s) => {
                const on = draft.seatingId === s.id;
                return (
                  <label key={s.id} className={`seat ${on ? "is-on" : ""} ${!s.open ? "is-off" : ""}`}>
                    <input
                      type="radio"
                      name="seating"
                      value={s.id}
                      checked={on}
                      disabled={!s.open}
                      onChange={() => set("seatingId", s.id)}
                      className="u-sr"
                    />
                    <span className="seat__time u-numeral">{s.time}</span>
                    <span className="seat__svc u-label">
                      {s.service === "lunch" ? b.lunch : b.dinner}
                    </span>
                    {!s.open && <span className="seat__off">{b.seatingFull}</span>}
                  </label>
                );
              })}
            </div>
            {errors.seatingId && <p className="bk__err" role="alert">{errors.seatingId}</p>}
          </fieldset>
        )}

        {/* ── 3 · COURSE ─────────────────────────────────────────────────── */}
        {step === 2 && (
          <fieldset className="bk__field">
            <legend className="u-sr">{b.courseHeading}</legend>
            <p className="bk__hint">{b.courseHint}</p>
            <div className="picks">
              {activeCourses.map((c) => {
                const on = draft.courseId === c.id;
                return (
                  <label key={c.id} className={`pick ${on ? "is-on" : ""}`}>
                    <input
                      type="radio" name="course" value={c.id} checked={on}
                      onChange={() => set("courseId", c.id)} className="u-sr"
                    />
                    <span className="pick__name">{locale === "th" ? c.nameTh : c.nameEn}</span>
                    <span className="pick__meta">
                      <span className="u-numeral">
                        {c.count} {locale === "th" ? c.unitTh : c.unitEn}
                      </span>
                      <span className="pick__price u-numeral">{formatBaht(c.price)}++</span>
                    </span>
                  </label>
                );
              })}
              <label className={`pick ${draft.courseId === "undecided" ? "is-on" : ""}`}>
                <input
                  type="radio" name="course" value="undecided"
                  checked={draft.courseId === "undecided"}
                  onChange={() => set("courseId", "undecided")} className="u-sr"
                />
                <span className="pick__name">{b.undecided}</span>
                <span className="pick__meta">{b.undecidedHint}</span>
              </label>
            </div>
          </fieldset>
        )}

        {/* ── 4 · PARTY ──────────────────────────────────────────────────── */}
        {step === 3 && (
          <fieldset className="bk__field">
            <legend className="u-sr">{b.partyHeading}</legend>
            <div className="party">
              {booking.partySizes.map((n) => {
                const on = draft.party === n;
                return (
                  <label key={n} className={`party__n ${on ? "is-on" : ""}`}>
                    <input
                      type="radio" name="party" value={n} checked={on}
                      onChange={() => set("party", n)} className="u-sr"
                    />
                    <span className="u-numeral">{n}</span>
                  </label>
                );
              })}
            </div>
            <p className="bk__hint">
              {b.partyHint}{" "}
              <a className="bk__inline" href={restaurant.contact.lineUrl.value} target="_blank" rel="noopener noreferrer">
                {restaurant.contact.lineDisplayId.value}
              </a>
            </p>
            {errors.party && <p className="bk__err" role="alert">{errors.party}</p>}
          </fieldset>
        )}

        {/* ── 5 · CONTACT ────────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="bk__field bk__form">
            <label className="fld">
              <span className="fld__l">
                {b.name} <i className="fld__req">{b.required}</i>
              </span>
              <input
                type="text" value={draft.name} autoComplete="name"
                onChange={(e) => set("name", e.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "err-name" : undefined}
              />
              {errors.name && <p className="bk__err" id="err-name" role="alert">{errors.name}</p>}
            </label>

            <label className="fld">
              <span className="fld__l">
                {b.phone} <i className="fld__req">{b.required}</i>
              </span>
              <input
                type="tel" value={draft.phone} inputMode="tel" autoComplete="tel"
                placeholder="08X XXX XXXX"
                onChange={(e) => set("phone", e.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "err-phone" : undefined}
              />
              {errors.phone && <p className="bk__err" id="err-phone" role="alert">{errors.phone}</p>}
            </label>

            <label className="fld">
              <span className="fld__l">
                {b.lineId} <i className="fld__opt">{b.optional}</i>
              </span>
              <input
                type="text" value={draft.lineId}
                onChange={(e) => set("lineId", e.target.value)}
                aria-describedby="hint-line"
              />
              <span className="fld__hint" id="hint-line">{b.lineIdHint}</span>
            </label>

            <label className="fld">
              <span className="fld__l">
                {b.notes} <i className="fld__opt">{b.optional}</i>
              </span>
              <textarea
                rows={4} value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
                aria-describedby="hint-notes"
              />
              <span className="fld__hint" id="hint-notes">{b.notesHint}</span>
            </label>
          </div>
        )}

        {/* ── 6 · REVIEW ─────────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="bk__field">
            <dl className="bk__summary">
              {[
                { k: b.steps[0], v: longDate(draft.date), go: 0 },
                { k: b.steps[1], v: booking.seatings.find((s) => s.id === draft.seatingId)?.time ?? "", go: 1 },
                {
                  k: b.steps[2],
                  v: (() => {
                    const c = activeCourses.find((x) => x.id === draft.courseId);
                    return c ? (locale === "th" ? c.nameTh : c.nameEn) : b.undecided;
                  })(),
                  go: 2,
                },
                { k: b.steps[3], v: `${draft.party} ${draft.party === 1 ? b.guest : b.guests}`, go: 3 },
                { k: b.name, v: draft.name, go: 4 },
                { k: b.phone, v: draft.phone, go: 4 },
                ...(draft.lineId ? [{ k: b.lineId, v: draft.lineId, go: 4 }] : []),
                ...(draft.notes ? [{ k: b.notes, v: draft.notes, go: 4 }] : []),
              ].map((row) => (
                <div key={row.k + row.v}>
                  <dt className="u-label">{row.k}</dt>
                  <dd>
                    {row.v}
                    <button className="bk__edit" onClick={() => setStep(row.go)}>{b.edit}</button>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="bk__pending">{b.notConfirmed}</p>
            {sendError && <p className="bk__err" role="alert">{sendError}</p>}
          </div>
        )}

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className="bk__nav">
          {step > 0 && (
            <button className="link-arrow bk__back" onClick={back} disabled={sending}>
              {b.back}
            </button>
          )}
          {step < 5 ? (
            <button className="btn" onClick={next}>{b.next} <Arrow /></button>
          ) : (
            <button className="btn" onClick={submit} disabled={sending}>
              {sending ? b.sending : b.submit} {!sending && <Arrow />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
