/**
 * Booking helpers shared by the form and the API route. Pure and side-effect
 * free, so both sides validate identically — a client that skips validation
 * cannot push a bad request past the server.
 */
import { booking } from "@/content/booking";

export type BookingRequest = {
  date: string; // YYYY-MM-DD
  seatingId: string;
  courseId: string; // "undecided" is allowed
  party: number;
  name: string;
  phone: string;
  lineId?: string;
  notes?: string;
  locale: "en" | "th";
};

/** Bangkok, regardless of where the guest or the server happens to be. */
export function bangkokNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: booking.timeZone }));
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isClosed(date: Date): boolean {
  if ((booking.closedWeekdays as readonly number[]).includes(date.getDay())) return true;
  return (booking.closedDates as readonly string[]).includes(ymd(date));
}

/**
 * Open if the day is not closed, the date is in range, and the same-day cutoff
 * has not passed. This is not availability — see the note in content/booking.ts.
 */
export function seatingIsOpen(dateStr: string, seatingId: string): boolean {
  const date = parseYmd(dateStr);
  if (!date) return false;
  if (isClosed(date)) return false;

  const now = bangkokNow();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (days < 0 || days > booking.daysAhead) return false;

  const seating = booking.seatings.find((s) => s.id === seatingId);
  if (!seating) return false;

  if (days === 0) {
    const [h, m] = seating.time.split(".").map(Number);
    const start = new Date(date);
    start.setHours(h, m || 0, 0, 0);
    if (start.getTime() - now.getTime() < booking.cutoffMinutes * 60000) return false;
  }
  return true;
}

/** Thai mobile: 0X XXXX XXXX, or the +66 form. Spaces and dashes tolerated. */
export function validPhone(raw: string): boolean {
  const p = raw.replace(/[\s\-()]/g, "");
  return /^(0\d{8,9}|\+66\d{8,9})$/.test(p);
}

export function validate(r: Partial<BookingRequest>): string[] {
  const bad: string[] = [];
  if (!r.date || !parseYmd(r.date)) bad.push("date");
  if (!r.seatingId || !booking.seatings.some((s) => s.id === r.seatingId)) bad.push("seatingId");
  else if (r.date && !seatingIsOpen(r.date, r.seatingId)) bad.push("seatingId");
  if (!r.party || r.party < 1 || r.party > booking.maxParty) bad.push("party");
  if (!r.name || r.name.trim().length < 2) bad.push("name");
  if (!r.phone || !validPhone(r.phone)) bad.push("phone");
  return bad;
}

/** SZ-XXXXXX — short enough to read down a phone, no look-alike characters. */
export function reference(): string {
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXY3456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `SZ-${out}`;
}
