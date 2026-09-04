import { restaurant } from "@/content/restaurant";
import { getDict, type Locale } from "@/content/dictionary";
import { qrPath } from "@/lib/qr";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The LINE handoff. Rendered on the server — the QR is generated at build time,
 * so it costs the guest nothing and works with JavaScript disabled.
 */
export default function LineCard({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const url = restaurant.contact.lineUrl.value;
  const qr = qrPath(url);

  return (
    <div className="linecard">
      <span className="u-label">{t.reserve.scanLabel}</span>
      <div className="linecard__row">
        <div className="linecard__qr">
          <svg
            viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`}
            width="120"
            height="120"
            role="img"
            aria-label={`${t.reserve.scanLabel} — ${restaurant.contact.lineDisplayId.value}`}
          >
            <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} fill="#f5efe3" />
            <path d={qr.d} fill="#0b0b08" />
          </svg>
        </div>
        <div className="linecard__text">
          <p className="linecard__id">{restaurant.contact.lineDisplayId.value}</p>
          <a className="link-arrow" href={url} target="_blank" rel="noopener noreferrer">
            {t.cta.reserveLine} <Arrow />
          </a>
          <p className="linecard__or">
            {t.reserve.orCall}{" "}
            <a href={`tel:${restaurant.contact.phoneIntl.value}`} className="linecard__tel">
              {restaurant.contact.phone.value}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
