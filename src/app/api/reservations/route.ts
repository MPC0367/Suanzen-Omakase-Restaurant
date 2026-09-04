import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { booking } from "@/content/booking";
import { validate, reference, type BookingRequest } from "@/lib/booking";
import { sendToSheet, toSheetRow } from "@/lib/sheet";
import { courses } from "@/content/courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Takes a booking request and files it. It does not confirm a table — the
 * restaurant does that on LINE, and the response says so.
 *
 * Requests are appended to .data/reservations.jsonl first — that file is the
 * system of record and is written before anything else is attempted — and then
 * forwarded to the restaurant's Google Sheet.
 *
 * The sheet is best-effort on purpose. If it is slow, down, or not configured,
 * the guest still gets their reference and the booking is still on disk. Losing
 * a table because a spreadsheet was unreachable would be the worse failure.
 *
 * Set SHEETS_WEBHOOK_URL and SHEETS_WEBHOOK_SECRET to switch it on; see
 * tools/sheet-webhook.gs for the script that receives it.
 */

const STORE = path.join(process.cwd(), ".data", "reservations.jsonl");

/** Crude but effective: one address cannot file more than 5 in 10 minutes. */
const recent = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 600000);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 500) recent.clear();
  return hits.length > 5;
}

/** Control characters have no business in a booking field. */
const CONTROL = new RegExp("[\\u0000-\\u001F\\u007F]", "g");
const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(CONTROL, "").trim().slice(0, max) : "";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: Partial<BookingRequest>;
  try {
    body = (await req.json()) as Partial<BookingRequest>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const candidate: Partial<BookingRequest> = {
    date: clean(body.date, 10),
    seatingId: clean(body.seatingId, 24),
    courseId: clean(body.courseId, 40) || "undecided",
    party: Number(body.party),
    name: clean(body.name, 80),
    phone: clean(body.phone, 24),
    lineId: clean(body.lineId, 60),
    notes: clean(body.notes, 600),
    locale: body.locale === "th" ? "th" : "en",
  };

  // The same validation the form runs, so a tampered client gains nothing.
  const bad = validate(candidate);
  if (bad.length) {
    return NextResponse.json({ ok: false, error: "invalid", fields: bad }, { status: 422 });
  }

  // validate() has just proved every required field is present, so the partial
  // can be treated as complete from here on.
  const booked = candidate as BookingRequest;

  const seating = booking.seatings.find((s) => s.id === booked.seatingId)!;
  const record = {
    ref: reference(),
    receivedAt: new Date().toISOString(),
    status: "requested" as const, // never "confirmed" — a person does that
    ...booked,
    seatingTime: seating.time,
  };

  try {
    await fs.mkdir(path.dirname(STORE), { recursive: true });
    await fs.appendFile(STORE, JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    console.error("[reservations] could not file request", err);
    return NextResponse.json({ ok: false, error: "store_failed" }, { status: 500 });
  }

  // ── Forward to the restaurant's sheet ──────────────────────────────────────
  // Already safely on disk above, so a failure here is logged, not raised.
  const course = courses.find((c) => c.id === record.courseId);
  const sheet = await sendToSheet(
    toSheetRow(record, course ? course.nameEn : "Undecided"),
  );
  if (!sheet.sent && sheet.reason !== "not_configured") {
    console.error(`[reservations] ${record.ref} not written to the sheet:`, sheet);
  }

  // Other channels can hang off the same record — LINE push, email, a booking
  // platform. Each should stay best-effort for the same reason.

  return NextResponse.json({
    ok: true,
    ref: record.ref,
    status: record.status,
    // Useful when setting the sheet up; harmless once it works.
    sheet: sheet.sent ? "written" : sheet.reason,
  });
}
