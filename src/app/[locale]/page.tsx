import Chrome from "@/components/Chrome";
import Courses from "@/components/Courses";
import CourseAdvisor from "@/components/CourseAdvisor";
import CourseCompare from "@/components/CourseCompare";
import ALaCarte from "@/components/ALaCarte";
import Footer from "@/components/Footer";
import { restaurant } from "@/content/restaurant";
import { getDict, locales, type Locale } from "@/content/dictionary";
import { notFound } from "next/navigation";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The menu as a course advisor. This page is the link Suan Zen sends in its
 * LINE OA to guests who already mean to come. It opens on the question they
 * all have — which course is right for me — answered first by who is dining;
 * then every course in family order, and the four adult courses side by side.
 * After the menu there is only what a guest needs next: when, how to reserve,
 * and where.
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!locales.includes(raw as Locale)) notFound();
  const locale = raw as Locale;

  return (
    <>
      <Chrome locale={locale} />

      <main id="main">
        {/* ── 01 · FIND YOUR COURSE, AND THE MENU ───────────────────────────── */}
        <section className="section courses-sec courses-sec--top" id="courses" data-section-world="day">
          <div className="shell">
            {/* Not a .reveal: the menu is the page, so nothing in it waits for
                the scripts before it can be seen. */}
            <CourseAdvisor locale={locale} />
            <Courses locale={locale} />
            <CourseCompare locale={locale} />
          </div>
        </section>

        {/* ── 02 · À LA CARTE ───────────────────────────────────────────────── */}
        <ALaCarte locale={locale} />

        {/* ── 03 · VISIT — when, how to reserve, and where ─────────────────── */}
        <Visit locale={locale} />
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
              <a className="btn" href={r.contact.lineUrl.value} target="_blank" rel="noopener noreferrer">
                {t.cta.reserveLine} <Arrow />
              </a>
              <a className="link-arrow" href={`tel:${r.contact.phoneIntl.value}`}>
                {t.cta.call} <Arrow />
              </a>
              <a className="link-arrow" href={r.maps.directions.value} target="_blank" rel="noopener noreferrer">
                {t.cta.directions} <Arrow />
              </a>
            </div>
          </div>

          {/* Google's own map, so it is properly interactive — pan, zoom, the
              place card. The ink plan sits underneath it: it is what shows while
              the embed loads, and what stays if the embed never arrives. The
              caption sits below rather than over the frame, so it never covers
              Google's logo or attribution. */}
          <figure className="visit__map reveal" style={{ ["--d" as string]: "140ms" }}>
            <div className="visit__canvas">
              <InkMap />
              <iframe
                className="visit__frame"
                src={mapEmbedUrl(locale)}
                title={t.visit.mapAria}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <figcaption className="visit__pinlabel">
              <span className="u-numeral">{g.lat.toFixed(4)}, {g.lng.toFixed(4)}</span>
              <a className="visit__open" href={r.maps.directions.value} target="_blank" rel="noopener noreferrer">
                {t.visit.mapHint} <Arrow />
              </a>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/**
 * Google's keyless embed — no API key, no billing account. The restaurant's
 * name with its verified coordinates, so it lands on the actual listing rather
 * than a bare pin, and hl gives Thai street names on the Thai page.
 */
function mapEmbedUrl(locale: Locale) {
  const { lat, lng } = restaurant.geo.value;
  const q = encodeURIComponent(restaurant.name.en);
  return `https://maps.google.com/maps?q=${q}&ll=${lat},${lng}&z=16&hl=${locale}&output=embed`;
}

/** An abstract river-and-roads plan of the area, with the restaurant lit.
    Now the map's loading state and fallback, beneath the live embed. */
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
