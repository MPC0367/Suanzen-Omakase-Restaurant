import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Chrome from "@/components/Chrome";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import LineCard from "@/components/LineCard";
import { restaurant } from "@/content/restaurant";
import { dict, getDict, locales, type Locale } from "@/content/dictionary";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const t = dict[locale as Locale];
  return {
    title: t.booking.heading,
    description: t.booking.intro,
    alternates: {
      canonical: `/${locale}/book`,
      languages: { en: "/en/book", th: "/th/book" },
    },
  };
}

export default async function BookPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!locales.includes(raw as Locale)) notFound();
  const locale = raw as Locale;
  const t = getDict(locale);

  return (
    <>
      <Chrome locale={locale} />
      <main id="main" className="page" data-section-world="night">
        <div className="shell">
          <div className="bkwrap">
            <div className="bkmain">
              <header className="pagehead reveal">
                <span className="u-label">{t.booking.label}</span>
                <h1 className="display display--section">{t.booking.heading}</h1>
                <p className="u-lede">{t.booking.intro}</p>
              </header>
              <BookingForm locale={locale} />
            </div>

            <aside className="bkside reveal">
              <LineCard locale={locale} />
              <dl className="bkside__facts">
                <div>
                  <dt className="u-label">{t.visit.hoursLabel}</dt>
                  <dd className="u-numeral">
                    {t.visit.everyday} · {restaurant.hours.everyday.value}
                  </dd>
                </div>
                <div>
                  <dt className="u-label">{t.visit.addressLabel}</dt>
                  <dd>
                    {locale === "th"
                      ? restaurant.address.oneLineTh.value
                      : restaurant.address.oneLineEn.value}
                  </dd>
                </div>
                <div>
                  <dt className="u-label">{t.reserve.dietaryHeading}</dt>
                  <dd>{restaurant.reservation.dietaryNote[locale]}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
