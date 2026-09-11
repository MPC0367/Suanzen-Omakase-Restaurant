import type { Locale } from "@/content/dictionary";

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
 * @847pimpq). QR codes keep using the short link: a Thai message makes this URL
 * far too long for the site's QR encoder.
 */
export const LINE_ID = "@suanzenomakase";

/** Strict percent-encoding, as LINE asks: encodeURIComponent plus ! ' ( ) *. */
const enc = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

type Named = { nameEn: string; nameTh: string };

/** The message the guest sends, in their own voice: the course, then blanks to fill. */
export function reserveMessage(course: Named, locale: Locale): string {
  return locale === "th"
    ? `ขอจองคอร์ส ${course.nameTh} (${course.nameEn})\nวันที่ :\nรอบ :\nจำนวน :  คน\nอาหารที่แพ้หรือไม่ทาน :`
    : `Hello, I'd like to book ${course.nameEn}.\nDate:\nSeating:\nGuests:\nAllergies or anything we don't eat:`;
}

/** Opens the restaurant's LINE chat with that message typed in. */
export function reserveLink(course: Named, locale: Locale): string {
  return `https://line.me/R/oaMessage/${enc(LINE_ID)}/?${enc(reserveMessage(course, locale))}`;
}
