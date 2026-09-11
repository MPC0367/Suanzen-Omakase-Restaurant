import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Noto_Serif_Thai, IBM_Plex_Sans_Thai } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import "../chrome.css";
import "../sections.css";
import "../pages.css";
import "../advisor.css";
import { dict, locales, type Locale } from "@/content/dictionary";
import { restaurant } from "@/content/restaurant";
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
    title: { default: t.meta.title, template: `%s — ${restaurant.name[locale as Locale]}` },
    description: t.meta.description,
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
      images: [{ url: OG_IMAGE, width: 1200, height: 800, alt: t.meta.title }],
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

  return (
    <html
      lang={t.htmlLang}
      data-world="day"
      className={`${display.variable} ${displayThai.variable} ${body.variable}`}
    >
      <body>
        <a className="skip" href="#main">{t.a11y.skip}</a>
        <Curtain />
        {children}
      </body>
    </html>
  );
}
