import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Chrome from "@/components/Chrome";
import Footer from "@/components/Footer";
import InstagramFeed from "@/components/InstagramFeed";
import { restaurant } from "@/content/restaurant";
import { posts } from "@/content/instagram";
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
    title: t.journal.heading,
    description: t.journal.intro,
    alternates: {
      canonical: `/${locale}/instagram`,
      languages: { en: "/en/instagram", th: "/th/instagram" },
    },
  };
}

export default async function InstagramPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!locales.includes(raw as Locale)) notFound();
  const locale = raw as Locale;
  const t = getDict(locale);

  const latest = posts.reduce((a, b) => (a.date > b.date ? a : b));

  return (
    <>
      <Chrome locale={locale} />
      <main id="main" className="page" data-section-world="night">
        <div className="shell">
          <header className="pagehead pagehead--wide reveal">
            <span className="u-label">{t.journal.label}</span>
            <h1 className="display display--section">{t.journal.heading}</h1>
            <p className="u-lede">{t.journal.intro}</p>
            <p className="pagehead__meta">
              <a
                className="pagehead__handle"
                href={restaurant.social.instagram.value}
                target="_blank"
                rel="noopener noreferrer"
              >
                {restaurant.social.instagramHandle.value}
              </a>
              <span className="pagehead__dot" aria-hidden="true">·</span>
              <span className="u-numeral">
                {t.journal.posted} {new Date(latest.date + "T00:00:00").toLocaleDateString(
                  locale === "th" ? "th-TH" : "en-GB",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
              </span>
            </p>
          </header>

          <InstagramFeed locale={locale} />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
