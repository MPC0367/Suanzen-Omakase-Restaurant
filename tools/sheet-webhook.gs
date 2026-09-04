/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Suan Zen — booking requests → Google Sheet
 * ─────────────────────────────────────────────────────────────────────────────
 *  Paste this into the Apps Script editor attached to the booking sheet. It
 *  receives a booking from the website and appends one row.
 *
 *  WHY THIS RATHER THAN THE SHEETS API: the API needs a Google Cloud service
 *  account and a private key living in the server's environment. This needs one
 *  URL and one shared secret, and the sheet's owner stays the only account with
 *  access to it. Less to leak, less to rotate.
 *
 *  ── SETUP ───────────────────────────────────────────────────────────────────
 *  1. Open the sheet → Extensions → Apps Script.
 *  2. Delete whatever is in Code.gs and paste this file in.
 *  3. Change SECRET below to a long random string of your own.
 *  4. Save, then Deploy → New deployment → type "Web app".
 *       Execute as:        Me
 *       Who has access:    Anyone
 *     ("Anyone" means anyone who knows the URL — the SECRET is what actually
 *      guards it. Google will ask you to authorise the script once.)
 *  5. Copy the Web app URL it gives you.
 *  6. In the website, create .env.local:
 *       SHEETS_WEBHOOK_URL=<the URL from step 5>
 *       SHEETS_WEBHOOK_SECRET=<the SECRET from step 3>
 *     On Vercel or Netlify, add those two as environment variables instead.
 *
 *  To check it works: Deploy → Test deployments, or just take a booking on the
 *  site and watch the row arrive.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Change this. Anything long and random — it is the only thing standing
// between your sheet and whoever finds the URL.
var SECRET = 'change-me-to-something-long-and-random';

var HEADERS = [
  'Reference', 'Received', 'Status', 'Date', 'Seating', 'Course',
  'Guests', 'Name', 'Phone', 'LINE ID', 'Notes', 'Language',
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'no_body' });
    }

    var body = JSON.parse(e.postData.contents);

    if (body.secret !== SECRET) {
      return json({ ok: false, error: 'bad_secret' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Put the header row in if the sheet is empty or was started fresh.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var b = body.booking || {};
    sheet.appendRow([
      b.ref || '',
      b.receivedAt || new Date().toISOString(),
      b.status || 'requested',
      b.date || '',
      b.seatingTime || '',
      b.course || '',
      b.party || '',
      b.name || '',
      // Leading apostrophe so Sheets keeps "081..." as text and does not
      // helpfully drop the zero.
      b.phone ? "'" + b.phone : '',
      b.lineId || '',
      b.notes || '',
      b.locale || '',
    ]);

    // Keep the newest at the top for whoever is working the phone.
    if (sheet.getLastRow() > 2) {
      sheet.moveRows(sheet.getRange(sheet.getLastRow(), 1, 1, HEADERS.length), 2);
    }

    return json({ ok: true, row: sheet.getLastRow() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** A GET returns a heartbeat, so you can check the deployment in a browser. */
function doGet() {
  return json({ ok: true, service: 'suan-zen booking sink' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
