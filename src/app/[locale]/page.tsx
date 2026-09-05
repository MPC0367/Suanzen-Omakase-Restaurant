import Link from "next/link";
import Chrome from "@/components/Chrome";
import Courses from "@/components/Courses";
import Gallery from "@/components/Gallery";
import Media from "@/components/Media";
import { LiveStrip } from "@/components/InstagramFeed";
import Hero from "@/components/Hero";
import Reserve from "@/components/Reserve";
import Warmth from "@/components/Warmth";
import ALaCarte from "@/components/ALaCarte";
import { gardenShots, counterShot, afterDarkShot } from "@/lib/slots";
import Footer from "@/components/Footer";
import { Mark } from "@/components/Mark";
import { restaurant } from "@/content/restaurant";
import { getDict, locales, type Locale } from "@/content/dictionary";
import { notFound } from "next/navigation";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!locales.includes(raw as Locale)) notFound();
  const locale = raw as Locale;
  const t = getDict(locale);
  const r = restaurant;

  return (
    <>
      <Chrome locale={locale} />

      <main id="main">
        <Hero locale={locale} />

        {/* ── 02 · SUAN ZEN ───────────────────────────────────────────────── */}
        <section className="section prop" data-section-world="night">
          <div className="shell grid">
            <div className="prop__text reveal">
              <span className="u-label">{t.proposition.label}</span>
              <h2 className="display display--section prop__h">{t.proposition.heading}</h2>
              <p className="u-lede">{t.proposition.body}</p>
              <p className="prop__aside">{t.proposition.aside}</p>
            </div>
            <div className="prop__mark reveal" style={{ ["--d" as string]: "160ms" }} aria-hidden="true">
              <Mark size={112} />
            </div>
          </div>
        </section>

        {/* ── 03 · THE GARDEN ─────────────────────────────────────────────── */}
        <section className="section garden" id="garden" data-section-world="night">
          <div className="shell">
            <header className="secthead reveal">
              <span className="u-label">{t.garden.label}</span>
              <h2 className="display display--section">{t.garden.heading}</h2>
            </header>

            <div className="garden__grid">
              <figure className="garden__a reveal">
                <Media src={gardenShots[0]?.file} seed="garden-sign" tone="night" motif="garden" ratio={0.78}
                       alt={gardenShots[0] ? (locale === "th" ? gardenShots[0].altTh : gardenShots[0].altEn) : t.garden.captions[0]}
                       sizes="(max-width:48rem) 88vw, 38vw" />
                <figcaption className="cap">{t.garden.captions[0]}</figcaption>
              </figure>

              <div className="garden__copy reveal" style={{ ["--d" as string]: "120ms" }}>
                <p className="u-lede">{t.garden.body}</p>
              </div>

              <figure className="garden__b reveal" style={{ ["--d" as string]: "180ms" }}>
                <Media src={gardenShots[1]?.file} seed="garden-walk" tone="dusk" motif="garden" ratio={1.42}
                       alt={gardenShots[1] ? (locale === "th" ? gardenShots[1].altTh : gardenShots[1].altEn) : t.garden.captions[2]}
                       sizes="(max-width:48rem) 88vw, 46vw" />
                <figcaption className="cap">{t.garden.captions[2]}</figcaption>
              </figure>

              <figure className="garden__c reveal" style={{ ["--d" as string]: "240ms" }}>
                <Media src={gardenShots[2]?.file} seed="garden-door" tone="ember" motif="garden" ratio={0.82}
                       alt={gardenShots[2] ? (locale === "th" ? gardenShots[2].altTh : gardenShots[2].altEn) : t.garden.captions[3]}
                       sizes="(max-width:48rem) 88vw, 28vw" />
                <figcaption className="cap">{t.garden.captions[3]}</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ── 04 · THE COUNTER — the site steps into daylight here ─────────── */}
        <section className="section counter" id="counter" data-section-world="day">
          <div className="shell grid">
            <div className="counter__media reveal">
              <Media src={counterShot?.file} seed="counter-long" tone="day" motif="counter" ratio={1.34}
                     alt={counterShot ? (locale === "th" ? counterShot.altTh : counterShot.altEn) : t.counter.heading}
                     sizes="(max-width:48rem) 92vw, 54vw" />
            </div>
            <div className="counter__text reveal" style={{ ["--d" as string]: "140ms" }}>
              <span className="u-label">{t.counter.label}</span>
              <h2 className="display display--section">{t.counter.heading}</h2>
              <p className="u-lede">{t.counter.body}</p>
              <dl className="facts">
                {t.counter.points.map((p) => (
                  <div key={p.k}>
                    <dt className="u-label">{p.k}</dt>
                    <dd>{p.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── 05 · THE COURSES ────────────────────────────────────────────── */}
        <section className="section courses-sec" id="courses" data-section-world="day">
          <div className="shell">
            <header className="secthead secthead--wide reveal">
              <span className="u-label">{t.coursesSection.label}</span>
              <h2 className="display display--section">{t.coursesSection.heading}</h2>
              <p className="u-lede">{t.coursesSection.body}</p>
            </header>
            <Courses locale={locale} />
          </div>
        </section>

        {/* ── 05b · À LA CARTE ────────────────────────────────────────────── */}
        <ALaCarte locale={locale} />

        {/* ── 05c · THE ROOM, AND THE PEOPLE IN IT ────────────────────────── */}
        <section className="section warmsec" id="room" data-section-world="night">
          <div className="shell">
            <header className="secthead secthead--wide reveal">
              <span className="u-label">{t.warmth.label}</span>
              <h2 className="display display--section">{t.warmth.heading}</h2>
              <p className="u-lede">{t.warmth.body}</p>
            </header>
          </div>
          <Warmth locale={locale} />
        </section>

        {/* ── 06 · AFTER DARK — verified: Thu–Sat, 20.30–24.00 ─────────────── */}
        <section className="section dark" id="after-dark" data-section-world="night">
          <div className="dark__bg" aria-hidden="true">
            <Media src={afterDarkShot?.file} seed="izakaya-bar" tone="ember" motif="counter" ratio={2.4}
                   alt="" sizes="100vw" still />
          </div>
          <div className="shell dark__in">
            <div className="reveal">
              <span className="u-label">{t.afterDark.label}</span>
              <h2 className="display display--section">{t.afterDark.heading}</h2>
              <p className="u-lede">{t.afterDark.body}</p>
              <p className="dark__hours">
                <span className="u-label">{t.afterDark.hoursLabel}</span>
                <span className="u-numeral dark__time">
                  {locale === "th" ? r.izakaya.daysTh.value : r.izakaya.days.value}
                  {"  ·  "}
                  {r.izakaya.hours.value}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ── 07 · GALLERY ────────────────────────────────────────────────── */}
        <section className="section gal" id="gallery" data-section-world="night">
          <div className="shell">
            <header className="secthead reveal">
              <span className="u-label">{t.gallery.label}</span>
              <h2 className="display display--section">{t.gallery.heading}</h2>
            </header>
          </div>
          <Gallery locale={locale} />
        </section>

        {/* ── 08 · FROM SUAN ZEN ──────────────────────────────────────────── */}
        <section className="section social" data-section-world="night">
          <div className="shell grid">
            <div className="social__text reveal">
              <span className="u-label">{t.social.label}</span>
              <h2 className="display display--section">{t.social.heading}</h2>
              <p className="u-lede">{t.social.body}</p>
              <Link className="link-arrow social__link" href={`/${locale}/instagram`}>
                {t.journal.label} <Arrow />
              </Link>
              <p className="social__handle u-numeral">{t.social.handle}</p>
            </div>
            <div className="social__rail reveal" style={{ ["--d" as string]: "120ms" }}>
              <LiveStrip locale={locale} />
            </div>
          </div>
        </section>

        {/* ── 09 · VISIT ──────────────────────────────────────────────────── */}
        <Visit locale={locale} />

        {/* ── 10 · RESERVE ────────────────────────────────────────────────── */}
        <Reserve locale={locale} />
      </main>

      <Footer locale={locale} />
    </>
  );
}

/* ── VISIT ────────────────────────────────────────────────────────────────── */
function Visit({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const r = restaurant;
  const a = r.address;
  const g = r.geo.value;

  return (
    <section className="section visit" id="visit" data-section-world="night">
      <div className="shell">
        <header className="secthead reveal">
          <span className="u-label">{t.visit.label}</span>
          <h2 className="display display--section">{t.visit.heading}</h2>
        </header>

        <div className="visit__grid">
          <div className="visit__info reveal">
            <dl className="facts facts--stack">
              <div>
                <dt className="u-label">{t.visit.addressLabel}</dt>
                <dd>{locale === "th" ? a.oneLineTh.value : a.oneLineEn.value}</dd>
              </div>
              <div>
                <dt className="u-label">{t.visit.hoursLabel}</dt>
                <dd>
                  <span className="u-numeral">{t.visit.everyday} · {r.hours.everyday.value}</span>
                  <br />
                  <span className="u-numeral visit__late">
                    {t.visit.lateNights} · {r.hours.lateNights.value}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="u-label">{t.visit.seatingsLabel}</dt>
                <dd className="u-numeral">{r.seatings.value.join("  ·  ")}</dd>
              </div>
              <div>
                <dt className="u-label">{t.visit.parkingLabel}</dt>
                <dd>{t.visit.parkingValue}</dd>
              </div>
              <div>
                <dt className="u-label">{t.visit.contactLabel}</dt>
                <dd>
                  <a href={`tel:${r.contact.phoneIntl.value}`} className="visit__a">{r.contact.phone.value}</a>
                  <br />
                  <a href={r.contact.lineUrl.value} target="_blank" rel="noopener noreferrer" className="visit__a">
                    LINE {r.contact.lineDisplayId.value}
                  </a>
                </dd>
              </div>
            </dl>

            <div className="visit__acts">
              <a className="btn" href={r.maps.directions.value} target="_blank" rel="noopener noreferrer">
                {t.cta.directions} <Arrow />
              </a>
              <a className="link-arrow" href={`tel:${r.contact.phoneIntl.value}`}>
                {t.cta.call} <Arrow />
              </a>
            </div>
          </div>

          {/* Ink map — styled, but it is a real link to real navigation. */}
          <a
            className="visit__map reveal"
            href={r.maps.directions.value}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.visit.mapAria} — ${t.visit.mapHint}`}
            style={{ ["--d" as string]: "140ms" }}
          >
            <InkMap />
            <span className="visit__pinlabel">
              <span className="u-numeral">{g.lat.toFixed(4)}, {g.lng.toFixed(4)}</span>
              <span className="visit__open">{t.visit.mapHint} <Arrow /></span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

/** An abstract river-and-roads plan of the area, with the restaurant lit. */
function InkMap() {
  return (
    <svg viewBox="0 0 800 560" className="inkmap" role="presentation" aria-hidden="true">
      <defs>
        <radialGradient id="pinGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="560" fill="var(--indigo-deep)" />
      {/* The Chao Phraya, west of the restaurant. */}
      <path d="M118 -20 C150 120 96 200 130 300 C160 392 118 470 150 580"
            stroke="var(--indigo)" strokeWidth="46" fill="none" opacity="0.85" />
      <path d="M118 -20 C150 120 96 200 130 300 C160 392 118 470 150 580"
            stroke="#25405e" strokeWidth="2" fill="none" opacity="0.5" />
      {/* Road grid, thinning away from the centre. */}
      <g stroke="#2b3f56" strokeWidth="1.5" opacity="0.62">
        <path d="M0 176h800M0 300h800M0 424h800M280 0v560M470 0v560M640 0v560" />
      </g>
      <g stroke="#3a5372" strokeWidth="3" opacity="0.75">
        <path d="M180 300h620M470 0v560" />
      </g>
      {/* Soi Nonthaburi 48, running to the door. */}
      <path d="M470 300 L470 236 L556 236" stroke="var(--amber-deep)" strokeWidth="3.4" fill="none" opacity="0.95" />
      <circle cx="556" cy="236" r="62" fill="url(#pinGlow)" />
      <circle cx="556" cy="236" r="7.5" fill="var(--amber)" />
      <circle cx="556" cy="236" r="17" fill="none" stroke="var(--amber)" strokeWidth="1.2" opacity="0.65" />
      <circle cx="556" cy="236" r="30" fill="none" stroke="var(--amber)" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}
