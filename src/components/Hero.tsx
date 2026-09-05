"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { asset } from "@/lib/asset";
import Media from "./Media";
import { heroShot } from "@/lib/slots";
import { restaurant } from "@/content/restaurant";
import { getDict, type Locale } from "@/content/dictionary";

/**
 * The threshold. Darkness, an amber point, the circle resolving, and then the
 * aperture opens onto the page. It is gated on the page actually being ready
 * and capped at ~1.1s — it never holds a guest back to look cinematic, it is
 * skipped entirely on a repeat visit in the same session, and reduced-motion
 * users go straight in.
 */
function useThreshold() {
  const [phase, setPhase] = useState<"hold" | "open" | "done">("hold");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try { seen = sessionStorage.getItem("sz:seen") === "1"; } catch { /* private mode */ }

    if (reduce || seen) { setPhase("done"); return; }

    try { sessionStorage.setItem("sz:seen", "1"); } catch { /* ignore */ }

    const open = window.setTimeout(() => setPhase("open"), 820);
    const done = window.setTimeout(() => setPhase("done"), 1720);
    return () => { clearTimeout(open); clearTimeout(done); };
  }, []);

  return phase;
}

export default function Hero({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const phase = useThreshold();
  const open = phase !== "hold";

  return (
    <>
      {phase !== "done" && (
        <div className={`thr ${open ? "is-open" : ""}`} aria-hidden="true">
          <div className="thr__circle">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle className="thr__ring" cx="60" cy="60" r="52" fill="none"
                      stroke="var(--amber)" strokeWidth="1" />
              <circle className="thr__dot" cx="60" cy="60" r="4" fill="var(--amber)" />
            </svg>
          </div>
        </div>
      )}

      <section className={`hero ${open ? "is-in" : ""}`} data-section-world="night">
        <div className="hero__media">
          <Media
            src={heroShot?.file}
            seed="hero-counter-dusk"
            tone="night"
            motif="counter"
            ratio={1.5}
            priority
            still
            alt={
              heroShot
                ? locale === "th" ? heroShot.altTh : heroShot.altEn
                : locale === "th"
                  ? "เคาน์เตอร์ของร้านสวน เซน โอมากาเสะ ตอนค่ำ"
                  : "The counter at Suan Zen Omakase at dusk"
            }
            sizes="100vw"
          />
          <div className="hero__scrim" aria-hidden="true" />
        </div>

        <div className="shell hero__in">
          <p className="hero__place u-label reveal-mask"><span>{t.hero.place}</span></p>

          <h1 className="hero__h display display--hero">
            {t.hero.headline.map((l, i) => (
              <span className="reveal-mask" key={i}>
                <span style={{ ["--d" as string]: `${120 + i * 110}ms` }}>{l}</span>
              </span>
            ))}
          </h1>

          <div className="hero__meta">
            <p className="hero__brandline reveal" style={{ ["--d" as string]: "420ms" }}>
              <span className="hero__brand">{t.hero.brand}</span>
              <span className="hero__sep" aria-hidden="true" />
              <span className="hero__cat">{t.hero.category}</span>
            </p>
            <p className="hero__stand u-lede reveal" style={{ ["--d" as string]: "500ms" }}>
              {t.hero.standfirst}
            </p>
          </div>

          <div className="hero__acts reveal" style={{ ["--d" as string]: "580ms" }}>
            <Link className="btn" href={`/${locale}/book`}>{t.cta.reserve}</Link>
            <a className="btn btn--ghost" href={asset(`/${locale}#courses`)}>{t.cta.viewCourses}</a>
          </div>

          <div className="hero__foot reveal" style={{ ["--d" as string]: "700ms" }}>
            <a className="hero__scroll" href={asset(`/${locale}#garden`)}>
              <span className="u-label">{t.hero.scroll}</span>
              <span className="hero__line" aria-hidden="true" />
            </a>
            <p className="hero__hours u-numeral">
              {t.visit.everyday} · {restaurant.hours.everyday.value}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
