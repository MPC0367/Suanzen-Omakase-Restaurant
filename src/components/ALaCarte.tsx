import Image from "next/image";
import { asset } from "@/lib/asset";
import { alaCarte, alaSections, alaIsPublished } from "@/content/alacarte";
import { restaurant } from "@/content/restaurant";
import { getDict, type Locale } from "@/content/dictionary";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The à la carte, served alongside the izakaya. Until the restaurant sends the
 * list, this renders a real answer — what it is, when it is served, and a way to
 * ask for tonight's — rather than an empty menu or invented dishes.
 */
export default function ALaCarte({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const th = locale === "th";

  return (
    <section className="section ala" id="alacarte" data-section-world="night">
      <div className="shell">
        <header className="secthead secthead--wide reveal">
          <span className="u-label">{t.ala.label}</span>
          <h2 className="display display--section">{t.ala.heading}</h2>
          <p className="u-lede">{t.ala.body}</p>
        </header>

        {alaIsPublished ? (
          <div className="ala__grid reveal">
            {alaSections.map((sec) => (
              <div className="ala__sec" key={sec.id}>
                <h3 className="ala__h u-label">{th ? sec.titleTh : sec.titleEn}</h3>
                <ul className="ala__items">
                  {sec.items.map((it, i) => (
                    <li className="ala__item" key={i}>
                      {it.photo && (
                        <Image
                          src={asset(it.photo)}
                          alt=""
                          width={160}
                          height={120}
                          className="ala__thumb"
                          sizes="80px"
                        />
                      )}
                      <span className="ala__name">
                        {th ? (it.nameTh ?? it.nameEn) : it.nameEn}
                        {(it.noteEn || it.noteTh) && (
                          <span className="ala__note">{th ? it.noteTh : it.noteEn}</span>
                        )}
                      </span>
                      <span className="ala__price u-numeral">
                        {it.price ? `฿${it.price.toLocaleString("en-US")}` : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="ala__pending reveal">
            <p className="ala__pendingtext">{t.ala.pending}</p>
            <dl className="ala__when">
              <dt className="u-label">{t.ala.served}</dt>
              <dd>{th ? alaCarte.servedTh : alaCarte.servedEn}</dd>
            </dl>
            <a
              className="btn"
              href={restaurant.contact.lineUrl.value}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.ala.askOnLine} <Arrow />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
