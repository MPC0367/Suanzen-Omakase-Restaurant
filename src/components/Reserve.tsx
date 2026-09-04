import Link from "next/link";
import { restaurant } from "@/content/restaurant";
import { getDict, type Locale } from "@/content/dictionary";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The closing conversion. The aperture opens into the reservation panel. */
export default function Reserve({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <section className="section resv" id="reserve" data-section-world="night">
      <div className="shell resv__in reveal">
        <span className="u-label">{t.reserve.label}</span>
        <h2 className="display display--hero resv__h">{t.reserve.heading}</h2>
        <p className="u-lede resv__lede">{t.reserve.body}</p>

        <div className="resv__acts">
          <Link className="btn resv__btn" href={`/${locale}/book`}>
            {t.booking.heading} <Arrow />
          </Link>
          <a className="link-arrow" href={restaurant.contact.lineUrl.value} target="_blank" rel="noopener noreferrer">
            {t.cta.reserveLine} <Arrow />
          </a>
          <a className="link-arrow" href={`tel:${restaurant.contact.phoneIntl.value}`}>
            {restaurant.contact.phone.value} <Arrow />
          </a>
        </div>

        <p className="resv__note">{restaurant.reservation.leadTimeNote[locale]}</p>
      </div>
    </section>
  );
}
