import { Mark } from "./Mark";
import Address from "./Address";
import O2Credit from "./O2Credit";
import { restaurant } from "@/content/restaurant";
import { getDict, type Locale, pick } from "@/content/dictionary";

export default function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const r = restaurant;

  return (
    <footer className="foot">
      <div className="shell foot__in">
        <div className="foot__brand">
          <Mark size={40} />
          <p className="foot__name">{pick(r.name, locale)}</p>
          <p className="foot__tag">{t.footer.tagline}</p>
        </div>

        <div className="foot__col">
          <span className="u-label">{t.visit.addressLabel}</span>
          <address className="foot__addr">
            <Address locale={locale} />
          </address>
          <a className="foot__link" href={r.maps.directions.value} target="_blank" rel="noopener noreferrer">
            {t.cta.directions}
          </a>
        </div>

        <div className="foot__col">
          <span className="u-label">{t.visit.contactLabel}</span>
          <a className="foot__link" href={`tel:${r.contact.phoneIntl.value}`}>{r.contact.phone.value}</a>
          <a className="foot__link" href={r.contact.lineUrl.value} target="_blank" rel="noopener noreferrer">
            LINE {r.contact.lineDisplayId.value}
          </a>
        </div>

        <div className="foot__col">
          <span className="u-label">{t.footer.followUs}</span>
          <a className="foot__link" href={r.social.instagram.value} target="_blank" rel="noopener noreferrer">Instagram</a>
          <a className="foot__link" href={r.social.facebook.value} target="_blank" rel="noopener noreferrer">Facebook</a>
          <a className="foot__link" href={r.social.tiktok.value} target="_blank" rel="noopener noreferrer">TikTok</a>
        </div>
      </div>

      <div className="shell foot__base">
        <p>© {new Date().getFullYear()} {r.name.en}. {t.footer.rights}</p>
        <O2Credit locale={locale} />
        <a href="#main" className="foot__top">{t.a11y.toTop}</a>
      </div>
    </footer>
  );
}
