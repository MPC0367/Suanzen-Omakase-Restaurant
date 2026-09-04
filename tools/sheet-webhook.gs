/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SUAN ZEN OMAKASE — booking requests → this spreadsheet
 * ─────────────────────────────────────────────────────────────────────────────
 *  Paste this whole file into the Apps Script editor attached to the booking
 *  sheet. It receives a booking from the website and appends one row.
 *
 *  Setup instructions are in DEPLOY.md. The short version:
 *    1. Change SECRET below.
 *    2. Deploy → New deployment → Web app → Execute as Me → Access Anyone.
 *    3. Put the deployment URL and the SECRET in the website's environment as
 *       SHEETS_WEBHOOK_URL and SHEETS_WEBHOOK_SECRET.
 *
 *  Optional: run setup() once from the editor to bold and freeze the header row
 *  and widen the columns.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1 · CHANGE THIS
   Anything long and random. The deployment URL is public, so this string is
   the only thing standing between the sheet and whoever finds it. Do not
   commit it anywhere.
   ═══════════════════════════════════════════════════════════════════════════ */
var SECRET = 'change-me-to-something-long-and-random';

/* Leave empty to use the first tab, or name a specific one. */
var SHEET_NAME = '';

var HEADERS = [
  'Reference', 'Received', 'Status', 'Date', 'Seating', 'Course',
  'Guests', 'Name', 'Phone', 'LINE ID', 'Notes', 'Language',
];

var TIMEZONE = 'Asia/Bangkok';

/* ═══════════════════════════════════════════════════════════════════════════
   2 · THE ENDPOINT
   ═══════════════════════════════════════════════════════════════════════════ */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'no_body' });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return json({ ok: false, error: 'bad_json' });
    }

    if (!body || body.secret !== SECRET) {
      return json({ ok: false, error: 'bad_secret' });
    }

    var b = body.booking;
    if (!b || !b.name || !b.phone) {
      return json({ ok: false, error: 'incomplete_booking' });
    }

    var sheet = targetSheet();
    ensureHeader(sheet);

    // A leading apostrophe tells Sheets to keep the value as text. Without it
    // "19.00" is read as the number 19, and "081..." loses its leading zero.
    sheet.appendRow([
      b.ref || '',
      received(b.receivedAt),
      b.status || 'requested',
      b.date ? "'" + b.date : '',
      b.seatingTime ? "'" + b.seatingTime : '',
      b.course || '',
      b.party || '',
      b.name || '',
      b.phone ? "'" + b.phone : '',
      b.lineId || '',
      b.notes || '',
      b.locale || '',
    ]);

    // Newest directly under the header, for whoever is working the phone.
    var last = sheet.getLastRow();
    if (last > 2) {
      sheet.moveRows(sheet.getRange(last, 1, 1, HEADERS.length), 2);
    }

    return json({ ok: true, ref: b.ref || '', row: 2 });
  } catch (err) {
    // Never throw: the website treats a non-JSON reply as a failure and logs
    // it, but the booking is already saved on its side either way.
    return json({ ok: false, error: String(err) });
  }
}

/** Open the deployment URL in a browser to check it is alive. */
function doGet() {
  return json({ ok: true, service: 'suan zen booking sink' });
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function targetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (SHEET_NAME) {
    var named = ss.getSheetByName(SHEET_NAME);
    if (named) return named;
  }
  return ss.getSheets()[0];
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() !== 0) return;
  sheet.appendRow(HEADERS);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/** The website sends UTC; staff read Bangkok time. */
function received(iso) {
  var d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  return Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd HH:mm');
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · RUN ONCE (optional)
   Select setup in the function dropdown and press Run to tidy the sheet.
   ═══════════════════════════════════════════════════════════════════════════ */

function setup() {
  var sheet = targetSheet();
  ensureHeader(sheet);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  var widths = [110, 140, 90, 100, 80, 110, 70, 170, 130, 110, 320, 90];
  for (var i = 0; i < widths.length; i++) sheet.setColumnWidth(i + 1, widths[i]);
  sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).setVerticalAlignment('top');
  SpreadsheetApp.getActive().toast('Sheet ready for bookings.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · TEST (optional)
   Run this to drop a fake booking in, so you can see the shape before the
   website is connected. Delete the row afterwards.
   ═══════════════════════════════════════════════════════════════════════════ */

function testRow() {
  var out = doPost({
    postData: {
      contents: JSON.stringify({
        secret: SECRET,
        booking: {
          ref: 'SZ-TEST01',
          receivedAt: new Date().toISOString(),
          status: 'requested',
          date: '2026-09-20',
          seatingTime: '19.00',
          course: 'Zen Ni',
          party: 2,
          name: 'Test Booking',
          phone: '0812345678',
          lineId: '@test',
          notes: 'This row came from testRow() — safe to delete.',
          locale: 'en',
        },
      }),
    },
  });
  Logger.log(out.getContent());
}
