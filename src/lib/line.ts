import type { L10n, Locale } from "@/content/dictionary";
import type { Course } from "@/content/courses";

/**
 * Reserving a particular course on LINE.
 *
 * The site has no server, so the only thing that can carry "which course" to
 * the restaurant is the message itself. LINE's own URL scheme opens a chat
 * with an official account and types a message into the box, which the guest
 * then sends:
 *
 *   https://line.me/R/oaMessage/{percent-encoded LINE ID}/?{percent-encoded text}
 *
 * developers.line.biz/en/docs/messaging-api/using-line-url-scheme/ — LINE for
 * iOS and Android only; LINE for PC does not open these links, so on a desktop
 * the reservation drawer shows the QR and a message to copy instead.
 *
 * The ID is the one the restaurant publishes (its Facebook post of
 * 2024-09-06, "Line OA @suanzenomakase"). LINE's own server confirms it is the
 * same account the restaurant's short link lin.ee/ubxSiHp opens (Basic ID
 * @847pimpq). QR codes keep using the short link: a Thai or Chinese message
 * makes this URL far too long for the site's QR encoder.
 */
export const LINE_ID = "@suanzenomakase";

/** Strict percent-encoding, as LINE asks: encodeURIComponent plus ! ' ( ) *. */
const enc = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

type Booked = Pick<Course, "name">;

/** The message the guest sends, in their own voice and language: the course,
    then blanks to fill. The Thai names the course in both scripts, so staff
    reading it can match it to the menu either way. */
const messages: L10n<(c: Booked) => string> = {
  en: (c) => `Hello, I'd like to book ${c.name.en}.\nDate:\nSeating:\nGuests:\nAllergies or anything we don't eat:`,
  th: (c) => `ขอจองคอร์ส ${c.name.th} (${c.name.en})\nวันที่ :\nรอบ :\nจำนวน :  คน\nอาหารที่แพ้หรือไม่ทาน :`,
  zh: (c) => `您好，我想预约 ${c.name.zh} 套餐。\n日期：\n用餐时段：\n人数：\n过敏食物或忌口：`,
};

export function reserveMessage(course: Booked, locale: Locale): string {
  return messages[locale](course);
}

/** Opens the restaurant's LINE chat with that message typed in. */
export function reserveLink(course: Booked, locale: Locale): string {
  return `https://line.me/R/oaMessage/${enc(LINE_ID)}/?${enc(reserveMessage(course, locale))}`;
}
