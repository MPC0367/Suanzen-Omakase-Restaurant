import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { booking } from "@/content/booking";
import { validate, reference, type BookingRequest } from "@/lib/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Takes a booking request and files it. It does not confirm a table — the
 * restaurant does that on LINE, and the response says so.
 *
 * Requests are appended to .data/reservations.jsonl so the restaurant has them
 * even with nothing else wired up. TO CONNECT PROPERLY: pass `record` on to
 * whatever the restaurant actually reads — the LINE Messaging API, a Google
 * Sheet, email, or a booking platform — in the marked block below.
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

  const seating = booking.seatings.find((s) => s.id === candidate.seatingId)!;
  const record = {
    ref: reference(),
    receivedAt: new Date().toISOString(),
    status: "requested" as const, // never "confirmed" — a person does that
    ...candidate,
    seatingTime: seating.time,
  };

  try {
    await fs.mkdir(path.dirname(STORE), { recursive: true });
    await fs.appendFile(STORE, JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    console.error("[reservations] could not file request", err);
    return NextResponse.json({ ok: false, error: "store_failed" }, { status: 500 });
  }

  // ── WIRE THE RESTAURANT UP HERE ────────────────────────────────────────────
  // await notifyLine(record);
  // await appendToSheet(record);
  // await sendMail(record);
  // ───────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ ok: true, ref: record.ref, status: record.status });
}
