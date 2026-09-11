/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE COURSE ADVISOR — which Suan Zen course is right for whom, and why
 * ─────────────────────────────────────────────────────────────────────────────
 *  Clarity before poetry: every line here is something a guest can use to
 *  choose — who a course is for, how many bites, what it is mostly made of,
 *  what sets it apart from the others. Nothing ranks the courses by price or
 *  "premium", and nothing claims a course is best value.
 *
 *  Each fact carries its source (see Source). What the restaurant still has to
 *  confirm is in src/content/OPEN-QUESTIONS.md, which no page loads: this file
 *  ships to the browser, so anything written here can be read there.
 *
 *  Thai course names inside running text use a no-break space ("เซน ซัง"),
 *  so a line never breaks between the two words of a name.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Locale } from "./dictionary";

export type Source =
  /** The restaurant's own Facebook post "5 Courses available…", 2024-09-06. */
  | "restaurant-2024"
  /** The studio brief of 2026-09-11, from the restaurant. */
  | "studio-brief"
  /** Counted from the course's own bite list on this site. */
  | "menu-count"
  /** The two earlier Suan Zen builds, made with the restaurant. */
  | "earlier-build";

export type Audience = "younger" | "teen" | "adult" | "dessert";

type Text = { en: string; th: string };

export type Advice = {
  id: string;
  audience: Audience;
  /** The short label every course carries, open or closed: its age or its kind. */
  tag: Text & { source: Source };
  /** "Best for": one or two lines of fact. */
  bestFor: (Text & { source: Source })[];
  /** "Who is it for?": one or two sentences. */
  who: Text;
  /** "Why choose it?": adult courses only — what sets it apart from the other three. */
  why?: Text;
  /** For the side-by-side comparison of the adult courses. */
  compare?: { food: Text; choice: Text };
};

export const advice: Advice[] = [
  {
    id: "zen-kids",
    audience: "younger",
    tag: { en: "Ages 7–11", th: "อายุ 7–11 ปี", source: "restaurant-2024" },
    bestFor: [{ en: "Younger diners, ages 7–11", th: "น้อง ๆ อายุ 7–11 ปี", source: "restaurant-2024" }],
    who: {
      en: "A Suan Zen course created for younger guests, recommended for ages 7–11. Nine bites, counting the yuzu juice.",
      th: "คอร์สที่ทางร้านทำไว้สำหรับแขกตัวเล็ก แนะนำสำหรับอายุ 7–11 ปี มี 9 คำ นับรวมน้ำยูซุด้วย",
    },
  },
  {
    id: "zen-ichi",
    audience: "teen",
    tag: { en: "Ages 12–14", th: "อายุ 12–14 ปี", source: "studio-brief" },
    bestFor: [{ en: "Teenage diners, ages 12–14", th: "วัยรุ่น อายุ 12–14 ปี", source: "studio-brief" }],
    who: {
      en: "Recommended for diners aged 12–14, as the step between Zen Kids and the adult courses. Fourteen bites, counting the yuzu juice.",
      th: "แนะนำสำหรับอายุ 12–14 ปี เป็นก้าวต่อจาก เซน คิดส์ ก่อนถึงคอร์สของผู้ใหญ่ มี 14 คำ นับรวมน้ำยูซุด้วย",
    },
  },
  {
    id: "zen-ni",
    audience: "adult",
    tag: { en: "Adults", th: "ผู้ใหญ่", source: "studio-brief" },
    bestFor: [{ en: "Fish and seafood, with one wagyu bite", th: "คนที่ชอบปลาและอาหารทะเล (มีวากิวหนึ่งคำ)", source: "menu-count" }],
    who: {
      en: "Adult diners who enjoy fish and seafood: sixteen bites, one of them wagyu.",
      th: "สำหรับผู้ใหญ่ที่ชอบปลาและอาหารทะเล มี 16 คำ ในนั้นมีวากิวหนึ่งคำ",
    },
    why: {
      en: "Seafood-led like Zen San, with sixteen bites — one fewer than Zen San. ฿2,890++ (Zen San ฿3,890++).",
      th: "เน้นปลาและอาหารทะเลเหมือน เซน ซัง มี 16 คำ น้อยกว่า เซน ซัง หนึ่งคำ ราคา ฿2,890++ (เซน ซัง ฿3,890++)",
    },
    compare: {
      food: { en: "Fish and seafood, one wagyu bite", th: "ปลาและอาหารทะเล วากิวหนึ่งคำ" },
      choice: { en: "Dessert: panna cotta, raspberry or passion fruit", th: "ของหวาน: พานาคอตต้า ราสเบอร์รีหรือเสาวรส" },
    },
  },
  {
    id: "zen-san",
    audience: "adult",
    tag: { en: "Adults", th: "ผู้ใหญ่", source: "studio-brief" },
    bestFor: [
      { en: "Fish and seafood, with one wagyu bite", th: "คนที่ชอบปลาและอาหารทะเล (มีวากิวหนึ่งคำ)", source: "menu-count" },
      { en: "The most bites: 17", th: "คนที่อยากได้จำนวนคำมากที่สุด 17 คำ", source: "menu-count" },
    ],
    who: {
      en: "Adult diners who want the most bites: seventeen, mostly fish and seafood, one of them wagyu.",
      th: "สำหรับผู้ใหญ่ที่อยากได้จำนวนคำมากที่สุด มี 17 คำ ส่วนใหญ่เป็นปลาและอาหารทะเล และมีวากิวหนึ่งคำ",
    },
    why: {
      en: "Seafood-led like Zen Ni, with the most bites of any course: seventeen. The restaurant calls it its “fine” course, where Western and Eastern flavours meet.",
      th: "เน้นปลาและอาหารทะเลเหมือน เซน นิ แต่มีจำนวนคำมากที่สุด 17 คำ ทางร้านเรียกว่าคอร์ส “ไฟน์” ที่รสตะวันตกและตะวันออกมาบรรจบกัน",
    },
    compare: {
      food: { en: "Fish and seafood, one wagyu bite", th: "ปลาและอาหารทะเล วากิวหนึ่งคำ" },
      choice: { en: "Dessert: raspberry mousse or tiramisu shot", th: "ของหวาน: มูสราสเบอร์รีหรือช็อตทีรามิสุ" },
    },
  },
  {
    id: "zen-boss",
    audience: "adult",
    tag: { en: "Adults", th: "ผู้ใหญ่", source: "studio-brief" },
    bestFor: [
      {
        en: "Choosing two bites yourself: Wagyu Sun or grilled hotate, foie gras or king crab",
        th: "คนที่อยากเลือกเองสองอย่าง คือวากิวซันหรือโฮตาเตะย่าง และฟัวกราส์หรือปูทาราบะ",
        source: "earlier-build",
      },
    ],
    who: {
      en: "Adult diners who'd like fewer bites — twelve — and two choices of their own.",
      th: "สำหรับผู้ใหญ่ที่อยากได้จำนวนคำน้อยลง มี 12 คำ และมีสองคำที่เลือกเองได้",
    },
    why: {
      en: "Two of its bites are yours to choose — Wagyu Sun or grilled hotate, foie gras or king crab — and so is dessert. Twelve bites, the fewest of the adult courses.",
      th: "มี 12 คำ น้อยที่สุดในคอร์สผู้ใหญ่ สองคำในคอร์สนี้เลือกเองได้ คือวากิวซันหรือโฮตาเตะย่าง และฟัวกราส์หรือปูทาราบะ แล้วยังเลือกของหวานได้เอง",
    },
    compare: {
      food: { en: "Fish and seafood, wagyu as a choice", th: "ปลาและอาหารทะเล เลือกวากิวได้" },
      choice: { en: "Two bites, and your dessert", th: "เลือกเองได้สองอย่าง และของหวาน" },
    },
  },
  {
    id: "zen-yon",
    audience: "adult",
    tag: { en: "Adults", th: "ผู้ใหญ่", source: "studio-brief" },
    bestFor: [{ en: "Beef lovers", th: "คนรักเนื้อ", source: "restaurant-2024" }],
    who: {
      en: "Adult diners who love beef: thirteen bites, ten of them wagyu. It opens with sake, or a starter instead.",
      th: "สำหรับผู้ใหญ่ที่รักเนื้อ มี 13 คำ เป็นวากิว 10 คำ เปิดด้วยสาเก หรือเปลี่ยนเป็นจานเรียกน้ำย่อยก็ได้",
    },
    why: {
      en: "The one adult course that isn't seafood-led: wagyu in ten of its thirteen bites. The restaurant made it for meat lovers.",
      th: "คอร์สผู้ใหญ่คอร์สเดียวที่ไม่ได้เน้นอาหารทะเล เป็นวากิว 10 จาก 13 คำ ทางร้านทำคอร์สนี้สำหรับคนรักเนื้อโดยเฉพาะ",
    },
    compare: {
      food: { en: "Wagyu in 10 of 13 bites", th: "วากิว 10 จาก 13 คำ" },
      choice: { en: "Sake or a starter to open", th: "เปิดด้วยสาเกหรือจานเรียกน้ำย่อย" },
    },
  },
  {
    id: "zen-sweet",
    audience: "dessert",
    tag: { en: "Dessert", th: "ของหวาน", source: "earlier-build" },
    bestFor: [{ en: "Coming for dessert", th: "คนที่แวะมาทานของหวาน", source: "earlier-build" }],
    who: {
      en: "Anyone who has come for dessert: three menus, A, B and C, chosen when you book.",
      th: "สำหรับคนที่แวะมาทานของหวาน มีสามเมนูให้เลือก คือ A B และ C เลือกตอนจอง",
    },
  },
];

export const adviceFor = (id: string) => advice.find((a) => a.id === id);
export const adultIds = advice.filter((a) => a.audience === "adult").map((a) => a.id);

/* ── The course finder ─────────────────────────────────────────────────────
   Two or three taps. Only options the menu itself supports: who is dining,
   then, for adults, beef or fish and seafood, then how many bites. */

export type Answer = {
  id: string;
  label: Text;
  hint?: Text;
} & ({ next: string } | { course: string; also?: string } | { compare: true });

export type Question = { id: string; legend: Text; answers: Answer[]; note?: Text };

export const finder: Question[] = [
  {
    id: "who",
    legend: { en: "Who is dining?", th: "ใครมาทานบ้าง" },
    note: {
      en: "Ages are Suan Zen's recommendations, not rules. For a guest aged 15 to 19, ask us on LINE which course suits.",
      th: "อายุเป็นคำแนะนำของทางร้าน ไม่ใช่ข้อบังคับ ถ้าอายุ 15–19 ปี ทักไลน์ถามได้ว่าคอร์สไหนเหมาะ",
    },
    answers: [
      { id: "younger", label: { en: "A child", th: "น้อง ๆ" }, hint: { en: "Ages 7–11", th: "อายุ 7–11 ปี" }, course: "zen-kids" },
      { id: "teen", label: { en: "A teenager", th: "วัยรุ่น" }, hint: { en: "Ages 12–14", th: "อายุ 12–14 ปี" }, course: "zen-ichi" },
      { id: "adult", label: { en: "An adult", th: "ผู้ใหญ่" }, next: "enjoy" },
    ],
  },
  {
    id: "enjoy",
    legend: { en: "What do you enjoy most?", th: "ชอบทานอะไรเป็นพิเศษ" },
    answers: [
      { id: "beef", label: { en: "Beef", th: "เนื้อ" }, course: "zen-yon" },
      { id: "sea", label: { en: "Fish and seafood", th: "ปลาและอาหารทะเล" }, next: "length" },
      { id: "unsure", label: { en: "Not sure yet", th: "ยังไม่แน่ใจ" }, hint: { en: "Compare the four", th: "เทียบทั้งสี่คอร์ส" }, compare: true },
    ],
  },
  {
    id: "length",
    legend: { en: "How many bites?", th: "อยากได้กี่คำ" },
    note: {
      en: "Suan Zen hasn't named one seafood course: Zen Ni, Zen San and Zen Boss are all led by fish and seafood. They differ in the number of bites, and Zen Boss lets you choose two of its bites.",
      th: "เซน นิ เซน ซัง และ เซน บอส เน้นปลาและอาหารทะเลเหมือนกัน ทางร้านไม่ได้กำหนดว่าคอร์สไหนเป็นคอร์สอาหารทะเล สามคอร์สนี้ต่างกันที่จำนวนคำ และ เซน บอส ให้เลือกเองได้สองอย่างระหว่างมื้อ",
    },
    answers: [
      { id: "twelve", label: { en: "12, with two choices", th: "12 คำ เลือกเองได้สองอย่าง" }, course: "zen-boss", also: "zen-ni" },
      { id: "sixteen", label: { en: "16", th: "16 คำ" }, course: "zen-ni", also: "zen-san" },
      { id: "seventeen", label: { en: "17, the most", th: "17 คำ มากที่สุด" }, course: "zen-san", also: "zen-ni" },
    ],
  },
];

/* ── Copy ────────────────────────────────────────────────────────────────── */

const en = {
  label: "Find your course",
  heading: "Which course is right for you?",
  intro:
    "Each Suan Zen course is made for a different diner. Start with who is dining — and for adults, what you enjoy most.",
  family: {
    label: "A course for each of you",
    younger: "Younger diners",
    teen: "Teenage diners",
    adult: "Adult diners",
  },
  finder: {
    open: "Help me choose",
    back: "Back",
    again: "Start again",
    result: "We recommend",
    also: "You may also like",
    view: "View {course}",
    compare: "Compare the adult courses",
    compareNote:
      "The four adult courses are set side by side below: how many bites, what each is mostly made of, the choices, and the price.",
  },
  course: {
    bestFor: "Best for",
    who: "Who is it for?",
    why: "Why choose {course}?",
    reserve: "Reserve {course}",
    open: "View {course}",
    all: "All courses",
    copy: "Copy the message",
    copied: "Copied",
    desktopNote: "On a computer, scan the code with your phone to open our LINE, then send this message:",
  },
  compare: {
    heading: "The four adult courses, side by side",
    caption: "Adult courses compared by number of bites, what they are mostly made of, choices and price",
    course: "Course",
    bites: "Bites",
    food: "Mostly",
    choice: "Choices",
    price: "Price",
    pick: "Compare two",
    pickHint: "Choose two courses to compare",
  },
  meta: {
    courseTitle: "{course} — {count} · {tag}",
    courseDescription: "{course}: {who}",
  },
};

const th: typeof en = {
  label: "เลือกคอร์ส",
  heading: "คอร์สไหนเหมาะกับคุณ",
  intro: "สวน เซน มีหลายคอร์ส แต่ละคอร์สเหมาะกับแขกต่างกัน เริ่มจากดูว่าใครมาทานบ้าง ถ้าเป็นผู้ใหญ่ ลองดูว่าชอบทานอะไรเป็นพิเศษ",
  family: {
    label: "มีคอร์สสำหรับทุกคน",
    younger: "น้อง ๆ",
    teen: "วัยรุ่น",
    adult: "ผู้ใหญ่",
  },
  finder: {
    open: "ช่วยเลือกคอร์ส",
    back: "ย้อนกลับ",
    again: "เริ่มใหม่",
    result: "คอร์สที่แนะนำ",
    also: "หรือลองดู",
    view: "ดู {course}",
    compare: "เทียบคอร์สผู้ใหญ่",
    compareNote: "สี่คอร์สผู้ใหญ่เทียบกันไว้ด้านล่าง ทั้งจำนวนคำ วัตถุดิบหลัก ตัวเลือก และราคา",
  },
  course: {
    bestFor: "เหมาะสำหรับ",
    who: "คอร์สนี้เหมาะกับใคร",
    why: "ทำไมถึงเลือก {course}",
    reserve: "จอง {course}",
    open: "ดู {course}",
    all: "คอร์สทั้งหมด",
    copy: "คัดลอกข้อความ",
    copied: "คัดลอกแล้ว",
    desktopNote: "ถ้าเปิดจากคอมพิวเตอร์ สแกนโค้ดด้วยมือถือเพื่อเปิด LINE ของร้าน แล้วส่งข้อความตามนี้",
  },
  compare: {
    heading: "เทียบสี่คอร์สผู้ใหญ่",
    caption: "เทียบคอร์สผู้ใหญ่ตามจำนวนคำ วัตถุดิบหลัก ตัวเลือก และราคา",
    course: "คอร์ส",
    bites: "จำนวนคำ",
    food: "เน้น",
    choice: "ตัวเลือก",
    price: "ราคา",
    pick: "เทียบสองคอร์ส",
    pickHint: "เลือกสองคอร์สที่อยากเทียบ",
  },
  meta: {
    courseTitle: "{course} — {count} · {tag}",
    courseDescription: "{course}: {who}",
  },
};

export const advisorCopy: Record<Locale, typeof en> = { en, th };

/** Fill {placeholders} in a copy string. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
