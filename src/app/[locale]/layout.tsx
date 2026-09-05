import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Noto_Serif_Thai, IBM_Plex_Sans_Thai } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import "../chrome.css";
import "../sections.css";
import "../pages.css";
import { dict, locales, type Locale } from "@/content/dictionary";
import { restaurant } from "@/content/restaurant";
import { courses } from "@/content/courses";
import { SITE, OG_IMAGE } from "@/lib/site";
import Curtain from "@/components/Curtain";

/* Display — Mincho for Latin and the Japanese numerals in the course names.
   Thai has no glyphs in Shippori, so the stack falls through to Noto Serif
   Thai for Thai characters automatically, script by script. */
const display = Shippori_Mincho({
  subsets: ["latin"], weight: ["400", "500"],
  variable: "--font-display", display: "swap",
});
const displayThai = Noto_Serif_Thai({
  subsets: ["thai"], weight: ["400", "500"],
  variable: "--font-display-th", display: "swap",
});
/* One body face for both languages — Plex Sans Thai carries Latin too, so
   English and Thai sit on the same skeleton instead of two unrelated fonts. */
const body = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"], weight: ["300", "400", "500", "600"],
  variable: "--font-body", display: "swap",
});


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
    metadataBase: new URL(SITE),
    title: { default: t.meta.title, template: `%s — ${restaurant.name.en}` },
    description: t.meta.description,
    keywords:
      locale === "th"
        ? ["โอมากาเสะ นนทบุรี", "ร้านโอมากาเสะ นนทบุรี", "สวน เซน โอมากาเสะ",
           "ร้านอาหารญี่ปุ่น นนทบุรี", "โอมากาเสะ ซอยนนทบุรี 48", "อิซากายะ นนทบุรี"]
        : ["omakase Nonthaburi", "Suan Zen Omakase", "sushi Nonthaburi",
           "Japanese restaurant Nonthaburi", "omakase near Bangkok", "izakaya Nonthaburi"],
    alternates: {
      canonical: `${SITE}/${locale}`,
      languages: { en: `${SITE}/en`, th: `${SITE}/th`, "x-default": `${SITE}/en` },
    },
    openGraph: {
      type: "website", siteName: restaurant.name.en,
      title: t.meta.title, description: t.meta.description,
      url: `${SITE}/${locale}`,
      locale: locale === "th" ? "th_TH" : "en_US",
      alternateLocale: locale === "th" ? "en_US" : "th_TH",
      images: [{ url: OG_IMAGE, width: 1200, height: 900, alt: t.meta.title }],
    },
    twitter: {
      card: "summary_large_image", title: t.meta.title,
      description: t.meta.description, images: [OG_IMAGE],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b08" },
    { media: "(prefers-color-scheme: light)", color: "#0b0b08" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const t = dict[locale as Locale];
  const a = restaurant.address;

  /* Prices and courses come from the restaurant. Seating rounds and the
     open-days question are still unconfirmed, so they are left out rather
     than published to Google as fact. */
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Restaurant",
        "@id": `${SITE}/#restaurant`,
        name: restaurant.name.en,
        alternateName: restaurant.name.th,
        url: `${SITE}/${locale}`,
        telephone: restaurant.contact.phoneIntl.value,
        servesCuisine: ["Japanese", "Sushi", "Omakase"],
        priceRange: "฿฿฿",
        currenciesAccepted: "THB",
        address: {
          "@type": "PostalAddress",
          streetAddress: a.street.value,
          addressLocality: a.district.value,
          addressRegion: a.province.value,
          postalCode: a.postalCode.value,
          addressCountry: a.country.value,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: restaurant.geo.value.lat,
          longitude: restaurant.geo.value.lng,
        },
        hasMap: restaurant.maps.directions.value,
        acceptsReservations: restaurant.contact.lineUrl.value,
        amenityFeature: [
          { "@type": "LocationFeatureSpecification", name: "Parking", value: true },
          { "@type": "LocationFeatureSpecification", name: "Counter seating", value: true },
        ],
        sameAs: [
          restaurant.social.instagram.value,
          restaurant.social.facebook.value,
          restaurant.social.tiktok.value,
        ],
        hasMenu: {
          "@type": "Menu",
          name: locale === "th" ? "คอร์สโอมากาเสะ" : "Omakase courses",
          hasMenuSection: {
            "@type": "MenuSection",
            name: "Omakase",
            hasMenuItem: courses
              .filter((c) => c.active)
              .map((c) => ({
                "@type": "MenuItem",
                name: c.nameEn,
                description: locale === "th" ? c.descTh : c.descEn,
                offers: { "@type": "Offer", price: c.price, priceCurrency: "THB" },
              })),
          },
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: SITE,
        name: restaurant.name.en,
        inLanguage: locale === "th" ? "th-TH" : "en-US",
        publisher: { "@id": `${SITE}/#restaurant` },
      },
    ],
  };

  return (
    <html
      lang={t.htmlLang}
      data-world="night"
      className={`${display.variable} ${displayThai.variable} ${body.variable}`}
    >
      <body>
        <a className="skip" href="#main">{t.a11y.skip}</a>
        <Curtain />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </body>
    </html>
  );
}
