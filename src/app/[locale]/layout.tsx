import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Noto_Serif_Thai, IBM_Plex_Sans_Thai, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import "../chrome.css";
import "../sections.css";
import "../pages.css";
import "../advisor.css";
import { dict, isLocale, localeInfo, locales, pick } from "@/content/dictionary";
import { restaurant, val } from "@/content/restaurant";
import { activeCourses, formatBaht } from "@/content/courses";
import { SITE, OG_IMAGE, languageAlternates, ogLocales } from "@/lib/site";
import Curtain from "@/components/Curtain";
import Backdrop from "@/components/Backdrop";

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
/* Simplified Chinese. Google serves these in about a hundred slices of
   characters, and a browser fetches only the slices holding characters the
   page shows — so they cost nothing on the English and Thai pages, where the
   stacks do not name them (globals.css, "CHINESE TYPOGRAPHY"). Nothing is
   preloaded: there is no one slice every page needs. One variable file per
   slice carries every weight, rather than a set of slices per weight. */
const bodyZh = Noto_Sans_SC({
  weight: "variable", subsets: ["latin"], preload: false,
  variable: "--font-body-zh", display: "swap",
});
const displayZh = Noto_Serif_SC({
  weight: "variable", subsets: ["latin"], preload: false,
  variable: "--font-display-zh", display: "swap",
});


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = dict[locale];

  return {
    metadataBase: new URL(SITE),
    title: { default: t.meta.title, template: `%s — ${pick(restaurant.name, locale)}` },
    description: t.meta.description,
    alternates: {
      canonical: `${SITE}/${locale}/`,
      languages: languageAlternates("/"),
    },
    openGraph: {
      type: "website", siteName: restaurant.name.en,
      title: t.meta.title, description: t.meta.description,
      url: `${SITE}/${locale}/`,
      ...ogLocales(locale),
      images: [{ url: OG_IMAGE, width: 1200, height: 800, alt: t.meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image", title: t.meta.title,
      description: t.meta.description, images: [OG_IMAGE],
    },
    /* Listed since 2026-09-24, at the owner's request: the menu lives on the
       restaurant's own domain now and is offered to search engines — sitemap
       in robots.txt, structured data below. The earlier unlisted posture
       (noindex everywhere, no sitemap) is documented in HOSTING.md history.
       Prices and the course line-up were confirmed by the restaurant's owners
       (relayed 2026-09-24), which is what unlocked publishing them as fact. */
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict[locale];

  /* Restaurant schema, from src/content/restaurant.ts — verified fields only.
     The price range is the courses' own printed prices, which the owners
     confirmed on 2026-09-24. Hours were withheld here until 2026-10-12, while
     the open days were in doubt; the restaurant's own Google Business Profile
     settled it (all seven days), so they are stated now — and they are the
     same hours the page itself prints. */
  const prices = activeCourses.map((c) => c.price);
  const a = restaurant.address;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE}/#restaurant`,
    name: restaurant.name.en,
    alternateName: restaurant.name.th,
    url: `${SITE}/${locale}/`,
    image: [OG_IMAGE, `${SITE}/photos/4ec2522c1b09.jpg`, `${SITE}/photos/3eb0559a8b3d.jpg`],
    servesCuisine: ["Japanese", "Omakase"],
    priceRange: `${formatBaht(Math.min(...prices))}–${formatBaht(Math.max(...prices))}++`,
    telephone: val(restaurant.contact.phoneIntl),
    address: {
      "@type": "PostalAddress",
      streetAddress: `${val(a.street)}, ${val(a.subDistrict)}`,
      addressLocality: val(a.district),
      addressRegion: val(a.province),
      postalCode: val(a.postalCode),
      addressCountry: val(a.country),
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: val(restaurant.geo).lat,
      longitude: val(restaurant.geo).lng,
    },
    hasMenu: `${SITE}/${locale}/`,
    hasMap: `https://www.google.com/maps?cid=${val(restaurant.maps.cid)}`,
    acceptsReservations: true,
    /* The hours the page prints, in the form a machine reads. Thursday to
       Saturday the kitchen runs to midnight. */
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Sunday"],
        opens: "12:30",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Thursday", "Friday", "Saturday"],
        opens: "12:30",
        closes: "00:00",
      },
    ],
    sameAs: [
      val(restaurant.social.instagram),
      val(restaurant.social.facebook),
      val(restaurant.social.tiktok),
      val(restaurant.contact.lineUrl),
    ],
  };

  return (
    <html
      lang={localeInfo[locale].html}
      className={`${display.variable} ${displayThai.variable} ${body.variable} ${bodyZh.variable} ${displayZh.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a className="skip" href="#main">{t.a11y.skip}</a>
        <Backdrop />
        <Curtain />
        {children}
      </body>
    </html>
  );
}
