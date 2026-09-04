import type { BookingRequest } from "./booking";

/**
 * Booking requests → the restaurant's Google Sheet.
 *
 * Posts to an Apps Script web app bound to the sheet (see tools/sheet-webhook.gs).
 * That keeps a private key out of this codebase entirely: the only secrets are a
 * URL and a shared string, both in the environment.
 *
 * This is deliberately best-effort. The booking has already been written to disk
 * by the time this runs, so if Sheets is slow, down, or simply not configured
 * yet, the guest still gets their reference and the restaurant still has the
 * request. A spreadsheet is a convenience, not the system of record.
 */

export type SheetRow = {
  ref: string;
  receivedAt: string;
  status: string;
  date: string;
  seatingTime: string;
  course: string;
  party: number;
  name: string;
  phone: string;
  lineId?: string;
  notes?: string;
  locale: string;
};

export type SheetResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "timeout" | "rejected" | "error"; detail?: string };

const TIMEOUT_MS = 6000;

export async function sendToSheet(row: SheetRow): Promise<SheetResult> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;

  if (!url || !secret) return { sent: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, booking: row }),
      signal: controller.signal,
      // Apps Script answers a POST with a 302 to a googleusercontent URL that
      // carries the actual body; fetch follows it by default, which is what we
      // want, but it means a redirect is normal rather than a failure.
      redirect: "follow",
    });

    const text = await res.text();
    let ok = res.ok;
    try {
      ok = ok && JSON.parse(text).ok === true;
    } catch {
      // Apps Script returns an HTML error page when the script itself throws.
      ok = false;
    }

    return ok
      ? { sent: true }
      : { sent: false, reason: "rejected", detail: text.slice(0, 200) };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      sent: false,
      reason: aborted ? "timeout" : "error",
      detail: err instanceof Error ? err.message.slice(0, 200) : undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Flatten a stored booking into the columns the sheet expects. */
export function toSheetRow(
  record: BookingRequest & { ref: string; receivedAt: string; status: string; seatingTime: string },
  courseName: string,
): SheetRow {
  return {
    ref: record.ref,
    receivedAt: record.receivedAt,
    status: record.status,
    date: record.date,
    seatingTime: record.seatingTime,
    course: courseName,
    party: record.party,
    name: record.name,
    phone: record.phone,
    lineId: record.lineId || "",
    notes: record.notes || "",
    locale: record.locale,
  };
}
