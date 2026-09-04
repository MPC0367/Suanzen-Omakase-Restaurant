/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BOOKING CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 *  What the booking engine is allowed to offer. The restaurant edits this file
 *  and the form follows — no code changes.
 *
 *  IMPORTANT, AND DELIBERATE: this engine takes a *request*. It does not hold a
 *  table and it never tells a guest a seating is confirmed, because there is no
 *  live table system behind it to ask. `capacity` below caps how many requests
 *  one seating will accept before it stops offering itself — that is throttling,
 *  not availability. The restaurant confirms on LINE. If a real POS or table
 *  system is connected later, replace `seatsTakenFor()` in lib/booking.ts with
 *  a call to it and the rest of the flow is unchanged.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Seating = {
  id: string;
  time: string;
  service: "lunch" | "dinner";
  /** Requests accepted for this seating per day before it stops being offered. */
  capacity: number;
};

export const booking = {
  /** From the restaurant's own TikTok. Flagged unverified in restaurant.ts. */
  seatings: [
    { id: "s1200", time: "12.00", service: "lunch",  capacity: 10 },
    { id: "s1500", time: "15.00", service: "lunch",  capacity: 10 },
    { id: "s1700", time: "17.00", service: "dinner", capacity: 10 },
    { id: "s1900", time: "19.00", service: "dinner", capacity: 10 },
  ] as Seating[],

  /** How far ahead the calendar opens. */
  daysAhead: 30,

  /** 0 = Sunday. Empty because the Instagram bio says the restaurant opens
   *  daily; an older restaurant TikTok says Mondays are closed. Add 1 here if
   *  the restaurant confirms Monday closing. */
  closedWeekdays: [] as number[],

  /** Specific dates the restaurant is closed, "YYYY-MM-DD". */
  closedDates: [] as string[],

  /** Party sizes the form offers. Larger parties are sent to LINE. */
  partySizes: [1, 2, 3, 4, 5],
  maxParty: 5,

  /** Same-day requests close this many minutes before a seating starts. */
  cutoffMinutes: 120,

  timeZone: "Asia/Bangkok",
} as const;
