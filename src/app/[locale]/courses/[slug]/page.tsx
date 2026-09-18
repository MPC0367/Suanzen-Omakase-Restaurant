import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Chrome from "@/components/Chrome";
import Footer from "@/components/Footer";
import { CourseDetail } from "@/components/Courses";
import { activeCourses } from "@/content/courses";
import { adviceFor, advisorCopy, fill } from "@/content/advisor";
import { isLocale, pick } from "@/content/dictionary";
import { restaurant } from "@/content/restaurant";
import { SITE, OG_IMAGE, languageAlternates, ogLocales } from "@/lib/site";

/**
 * One course on its own address — /en/courses/zen-ichi/ — so staff can send a
 * guest straight to it: "here is the course for your thirteen-year-old". Like
 * every page here it is unlisted, and its link preview carries no price.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return activeCourses.map((c) => ({ slug: c.slug }));
}

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const k = activeCourses.find((c) => c.slug === slug);
  const adv = k && adviceFor(k.id);
  if (!k || !adv) return {};
  const c = advisorCopy[locale];
  const name = pick(k.name, locale);
  const brand = pick(restaurant.name, locale);
  const title = fill(c.meta.courseTitle, { course: name, count: `${k.count} ${pick(k.unit, locale)}`, tag: pick(adv.tag, locale) });
  const description = fill(c.meta.courseDescription, { course: name, who: pick(adv.who, locale) });
  const url = `${SITE}/${locale}/courses/${slug}/`;

  // A page's metadata replaces the layout's openGraph, twitter and robots
  // wholesale, so each is given in full here.
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(`/courses/${slug}/`),
    },
    openGraph: {
      type: "website",
      siteName: restaurant.name.en,
      title: `${title} — ${brand}`,
      description,
      url,
      ...ogLocales(locale),
      images: [{ url: OG_IMAGE, width: 1200, height: 800, alt: `${name} — ${brand}` }],
    },
    twitter: { card: "summary_large_image", title: `${title} — ${brand}`, description, images: [OG_IMAGE] },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function CoursePage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const k = activeCourses.find((c) => c.slug === slug);
  if (!k) notFound();

  return (
    <>
      <Chrome locale={locale} path={`/courses/${k.slug}/`} />
      <main id="main">
        <section className="section coursepage" id="course">
          <div className="shell">
            <CourseDetail id={k.id} locale={locale} />
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
