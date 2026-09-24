/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SUAN ZEN OMAKASE — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every fact the website states about the restaurant lives here.
 *  Edit this file to update the site. Nothing is hard-coded in components.
 *
 *  `verified` marks facts confirmed against restaurant-owned channels
 *  (Instagram bio, the restaurant's own TikTok, its Google Business listing).
 *  Anything `false` renders as a soft state in the UI — never as a fake number.
 *
 *  RESEARCH LOG — 2026-09-04
 *  ✔ Instagram bio @suanzenomakase ......... phone, daily hours, LINE, map pin
 *  ✔ Google Maps place (resolved short URL) . address, geo, place id
 *  ✔ Restaurant's own TikTok @suan.zen.omakase seating rounds, izakaya, parking
 *  ✔ Logo pixels sampled from IG avatar ..... amber #F4C92B / falloff #AB6C14
 *  ✔ Diner reviews (Lemon8 ×2) .............. Zen Ichi 14 courses ฿2,000++,
 *                                             zen garden, counter, live music
 *  ⚠ CONFLICT — hours: IG bio says "Everyday"; the restaurant's TikTok post
 *    says Tue–Sun (closed Mon). IG bio is the more current owner-controlled
 *    surface, so it is used. FLAGGED for confirmation.
 *  ⚠ CONFLICT — round times: TikTok says 12.00/15.00/17.00/19.00; IG bio opens
 *    12.30. The first round now follows the opening time (studio, 2026-09-25);
 *    the rounds are still shown as unverified.
 *  ✘ NOT USED — third-party aggregator price tiers (2,500/4,500/6,500/9,500).
 *    They contradict the diner-reported ฿2,000++ for Zen Ichi. Excluded.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { L10n } from "./dictionary";

export type Verified<T> = { value: T; verified: boolean; note?: string };

const v = <T,>(value: T, verified = true, note?: string): Verified<T> => ({
  value,
  verified,
  note,
});

export const restaurant = {
  /* The brand stays in Latin letters on the Chinese page: it is the name on
     the sign, the LINE account and the map, and there is no Chinese name the
     restaurant uses. */
  name: { en: "Suan Zen Omakase", th: "สวน เซน โอมากาเสะ", zh: "Suan Zen Omakase" } satisfies L10n,
  shortName: { en: "Suan Zen", th: "สวน เซน", zh: "Suan Zen" } satisfies L10n,

  /** สวน (suan) = "garden". The brand name literally reads "Zen Garden". */
  nameMeaning: {
    en: "In Thai, suan means garden.",
    th: "“สวน” คือคำที่อยู่ในชื่อร้านตั้งแต่ต้น",
    zh: "在泰语中，suan 的意思是“花园”。",
  } satisfies L10n,

  category: { en: "Omakase", th: "โอมากาเสะ", zh: "Omakase" } satisfies L10n,
  city: { en: "Nonthaburi", th: "นนทบุรี", zh: "暖武里府" } satisfies L10n,

  address: {
    street: v("35/2 Soi Nonthaburi 48"),
    streetTh: v("35/2 ซอยนนทบุรี 48"),
    subDistrict: v("Tha Sai"),
    subDistrictTh: v("ท่าทราย"),
    district: v("Mueang Nonthaburi"),
    districtTh: v("อำเภอเมืองนนทบุรี"),
    province: v("Nonthaburi"),
    provinceTh: v("นนทบุรี"),
    postalCode: v("11000"),
    country: v("TH"),
    /* The Chinese keeps the district, sub-district and soi in Latin letters:
       those are what a taxi, Grab or a map search will match, and they have no
       settled Chinese forms. The page shows the English line under it. */
    oneLine: v<L10n>({
      en: "35/2 Soi Nonthaburi 48, Tha Sai, Mueang Nonthaburi, Nonthaburi 11000",
      th: "35/2 ซอยนนทบุรี 48 ท่าทราย อำเภอเมืองนนทบุรี นนทบุรี 11000",
      zh: "泰国暖武里府 Mueang Nonthaburi 县 Tha Sai 区 Soi Nonthaburi 48，35/2 号，邮编 11000",
    }),
    /** Which pages also print the English address under their own. */
    romanisedBelow: { en: false, th: false, zh: true } satisfies L10n<boolean>,
  },

  geo: v({ lat: 13.8732794, lng: 100.5083385 }),

  contact: {
    phone: v("062-458-5588"),
    phoneIntl: v("+66624585588"),
    /* The restaurant's own Facebook post (2024-09-06) gives "Line OA
       @suanzenomakase"; LINE's server shows it is the account lin.ee/ubxSiHp
       opens (Basic ID @847pimpq). The site used to show @suan.zen.omakase,
       which is the TikTok handle and does not exist on LINE. */
    lineDisplayId: v("@suanzenomakase"),
    lineUrl: v("https://lin.ee/ubxSiHp"),
  },

  social: {
    instagram: v("https://www.instagram.com/suanzenomakase"),
    instagramHandle: v("@suanzenomakase"),
    facebook: v("https://www.facebook.com/omakase.suanzen"),
    tiktok: v("https://www.tiktok.com/@suan.zen.omakase"),
  },

  maps: {
    directions: v(
      "https://www.google.com/maps/place/Suan+Zen+Omakase/@13.8732846,100.5057582,17z",
    ),
    placeId: v("0x30e2858dff33491f:0x54a12fde06eb5391"),
  },

  /** Per the Instagram bio — the restaurant's own, most current surface. */
  hours: {
    everyday: v("12.30 – 21.00"),
    lateNights: v("12.30 – 24.00", true, "Thursday to Saturday"),
    openDaysNote: v(
      "Open daily",
      false,
      "IG bio says daily; an older restaurant TikTok says Tue–Sun. Confirm.",
    ),
  },

  /** Omakase is served in fixed seatings, not walk-in. */
  seatings: v(
    ["12.30", "15.00", "17.00", "19.00"],
    false,
    "From the restaurant's TikTok, which says 12.00; the first round is shown as "
      + "12.30 to match the opening time (studio, 2026-09-25). Confirm the rounds.",
  ),

  izakaya: {
    active: v(true),
    days: v<L10n>({ en: "Thursday – Saturday", th: "พฤหัสบดี – เสาร์", zh: "周四至周六" }),
    hours: v("20.30 – 24.00"),
  },

  liveMusic: v(
    "Friday – Sunday evenings",
    false,
    "Reported by a diner review, not yet confirmed by the restaurant.",
  ),

  amenities: {
    parking: v(true),
    counterSeating: v(true),
    garden: v(true),
    reservationsRequired: v(true),
    dietaryOnRequest: v(
      true,
      true,
      "Diner reviews confirm the kitchen adapts courses with advance notice.",
    ),
  },

  reservation: {
    /** LINE is the real, working reservation channel. No fake booking engine. */
    primaryChannel: "line" as const,
    leadTimeNote: {
      en: "Seatings are limited. We recommend booking a few days ahead.",
      th: "ที่นั่งต่อรอบมีจำกัด แนะนำให้จองล่วงหน้า",
      zh: "座位有限，建议提前几天预约。",
    } satisfies L10n,
    dietaryNote: {
      en: "Tell us about allergies or anything you don't eat when you book — the chef will adjust the course.",
      th: "แจ้งอาหารที่แพ้หรือไม่ทานตอนจอง เชฟปรับคอร์สให้ได้",
      zh: "预约时请告知过敏食物或忌口，主厨会为您调整套餐。",
    } satisfies L10n,
  },
} as const;

export type Restaurant = typeof restaurant;

/** Unwrap a Verified<T> for display. */
export const val = <T,>(f: Verified<T>): T => f.value;
