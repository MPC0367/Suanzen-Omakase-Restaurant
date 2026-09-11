import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Chrome from "@/components/Chrome";
import Footer from "@/components/Footer";
import { CourseDetail } from "@/components/Courses";
import { activeCourses } from "@/content/courses";
import { adviceFor, advisorCopy, fill } from "@/content/advisor";
import { locales, type Locale } from "@/content/dictionary";
import { restaurant } from "@/content/restaurant";
import { SITE, OG_IMAGE } from "@/lib/site";

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
  const { locale: raw, slug } = await params;
  if (!locales.includes(raw as Locale)) return {};
  const locale = raw as Locale;
  const k = activeCourses.find((c) => c.slug === slug);
  const adv = k && adviceFor(k.id);
  if (!k || !adv) return {};
  const c = advisorCopy[locale];
  const th = locale === "th";
  const name = th ? k.nameTh : k.nameEn;
  const title = fill(c.meta.courseTitle, { course: name, count: `${k.count} ${th ? k.unitTh : k.unitEn}`, tag: adv.tag[locale] });
  const description = fill(c.meta.courseDescription, { course: name, who: adv.who[locale] });
  const url = `${SITE}/${locale}/courses/${slug}/`;

  // A page's metadata replaces the layout's openGraph, twitter and robots
  // wholesale, so each is given in full here.
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${SITE}/en/courses/${slug}/`, th: `${SITE}/th/courses/${slug}/` },
    },
    openGraph: {
      type: "website",
      siteName: restaurant.name.en,
      title: `${title} — ${restaurant.name[locale]}`,
      description,
      url,
      locale: th ? "th_TH" : "en_US",
      alternateLocale: th ? "en_US" : "th_TH",
      images: [{ url: OG_IMAGE, width: 1200, height: 800, alt: `${name} — ${restaurant.name[locale]}` }],
    },
    twitter: { card: "summary_large_image", title: `${title} — ${restaurant.name[locale]}`, description, images: [OG_IMAGE] },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function CoursePage({ params }: Params) {
  const { locale: raw, slug } = await params;
  if (!locales.includes(raw as Locale)) notFound();
  const locale = raw as Locale;
  const k = activeCourses.find((c) => c.slug === slug);
  if (!k) notFound();

  return (
    <>
      <Chrome locale={locale} />
      <main id="main">
        <section className="section coursepage" id="course" data-section-world="day">
          <div className="shell">
            <CourseDetail id={k.id} locale={locale} />
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
