import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Noto_Serif_Thai, IBM_Plex_Sans_Thai, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import "../chrome.css";
import "../sections.css";
import "../pages.css";
import "../advisor.css";
import { dict, isLocale, localeInfo, locales, pick } from "@/content/dictionary";
import { restaurant } from "@/content/restaurant";
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
    /* A brochure, not a website: shared by link, never listed. Crawlers are
       still let in — blocking them in robots.txt would hide this instruction
       from the very search engines it is addressed to. There are no keywords
       and no structured data either: both exist only for search engines, and
       the structured data used to publish every course's price as fact. */
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
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

  return (
    <html
      lang={localeInfo[locale].html}
      className={`${display.variable} ${displayThai.variable} ${body.variable} ${bodyZh.variable} ${displayZh.variable}`}
    >
      <body>
        <a className="skip" href="#main">{t.a11y.skip}</a>
        <Backdrop />
        <Curtain />
        {children}
      </body>
    </html>
  );
}
