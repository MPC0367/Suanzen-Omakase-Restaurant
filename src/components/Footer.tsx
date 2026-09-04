import Link from "next/link";
import { Mark } from "./Mark";
import { restaurant } from "@/content/restaurant";
import { getDict, type Locale } from "@/content/dictionary";

export default function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const r = restaurant;

  return (
    <footer className="foot" data-section-world="night">
      <div className="shell foot__in">
        <div className="foot__brand">
          <Mark size={40} />
          <p className="foot__name">{locale === "th" ? r.name.th : r.name.en}</p>
          <p className="foot__tag">{t.footer.tagline}</p>
        </div>

        <div className="foot__col">
          <span className="u-label">{t.visit.addressLabel}</span>
          <address className="foot__addr">
            {locale === "th" ? r.address.oneLineTh.value : r.address.oneLineEn.value}
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
          <Link className="foot__link" href={`/${locale}/book`}>{t.nav.book}</Link>
        </div>

        <div className="foot__col">
          <span className="u-label">{t.footer.followUs}</span>
          <Link className="foot__link" href={`/${locale}/instagram`}>{t.journal.label}</Link>
          <a className="foot__link" href={r.social.instagram.value} target="_blank" rel="noopener noreferrer">Instagram</a>
          <a className="foot__link" href={r.social.facebook.value} target="_blank" rel="noopener noreferrer">Facebook</a>
          <a className="foot__link" href={r.social.tiktok.value} target="_blank" rel="noopener noreferrer">TikTok</a>
        </div>
      </div>

      <div className="shell foot__base">
        <p>© {new Date().getFullYear()} {r.name.en}. {t.footer.rights}</p>
        <a href="#main" className="foot__top">{t.a11y.toTop}</a>
      </div>
    </footer>
  );
}
