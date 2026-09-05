/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SUAN ZEN OMAKASE — booking requests → this spreadsheet
 * ─────────────────────────────────────────────────────────────────────────────
 *  Paste this whole file into the Apps Script editor attached to the booking
 *  sheet, then Deploy → Manage deployments → edit → Version: New version.
 *
 *  It accepts a booking two ways.
 *
 *  1 · FROM THE PAGE ITSELF (the artifact, GitHub Pages, anywhere)
 *      The browser posts straight here. There is no server in between, so the
 *      key it sends travels inside the page and ANYONE CAN READ IT. That is
 *      why PUBLIC_KEY below is not treated as a secret — it only turns away
 *      bots that stumble on the URL. What actually protects the sheet is the
 *      rate limit further down.
 *
 *  2 · FROM A SERVER (Vercel, Netlify)
 *      The site's API route posts with SECRET, which never leaves the server.
 *      That path skips the rate limit, because it has already done its own.
 *
 *  Both write the same row. Run setup() once to tidy the sheet.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1 · KEYS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Public. Ships inside the page. Must match SZ_KEY in the website. */
var PUBLIC_KEY = 'szpk_jCMrkhtmzqLb-ROl';

/** Private. Only a server ever sends this. Change it to your own. */
var SECRET = 'change-me-to-something-long-and-random';

/** Most bookings one browser-visible key may file per hour, across everyone. */
var MAX_PER_HOUR = 60;

var SHEET_NAME = '';           // empty = the first tab
var TIMEZONE = 'Asia/Bangkok';

var HEADERS = [
  'Reference', 'Received', 'Status', 'Date', 'Seating', 'Course',
  'Guests', 'Name', 'Phone', 'LINE ID', 'Notes', 'Language',
];

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
    } catch (err) {
      return json({ ok: false, error: 'bad_json' });
    }
    if (!body) return json({ ok: false, error: 'bad_json' });

    var trusted = body.secret === SECRET;
    var fromPage = body.key === PUBLIC_KEY;
    if (!trusted && !fromPage) return json({ ok: false, error: 'bad_key' });

    // A field no person can see, so anything that fills it in is a bot.
    if (body.company) return json({ ok: true, ref: 'ignored' });

    var b = body.booking;
    if (!b) return json({ ok: false, error: 'no_booking' });
    if (!b.name || String(b.name).trim().length < 2) return json({ ok: false, error: 'need_name' });
    if (!validPhone(b.phone)) return json({ ok: false, error: 'need_phone' });
    if (!b.date) return json({ ok: false, error: 'need_date' });

    // Only the page-side path is rate limited; a server has its own.
    if (!trusted && overRate()) return json({ ok: false, error: 'rate_limited' });

    var sheet = targetSheet();
    ensureHeader(sheet);

    var ref = b.ref || makeRef();

    // A leading apostrophe keeps Sheets from reading "19.00" as 19 and from
    // dropping the leading zero of "081...".
    sheet.appendRow([
      ref,
      received(b.receivedAt),
      'requested',                       // never "confirmed" — a person does that
      b.date ? "'" + b.date : '',
      b.seatingTime ? "'" + b.seatingTime : '',
      b.course || '',
      b.party || '',
      String(b.name).slice(0, 120),
      b.phone ? "'" + String(b.phone).slice(0, 30) : '',
      String(b.lineId || '').slice(0, 80),
      String(b.notes || '').slice(0, 600),
      b.locale || '',
    ]);

    // Newest directly under the header, for whoever is working the phone.
    var last = sheet.getLastRow();
    if (last > 2) sheet.moveRows(sheet.getRange(last, 1, 1, HEADERS.length), 2);

    return json({ ok: true, ref: ref });
  } catch (err) {
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

/** A rolling count in script properties. Apps Script has no request IP. */
function overRate() {
  try {
    var props = PropertiesService.getScriptProperties();
    var hour = Utilities.formatDate(new Date(), TIMEZONE, 'yyyyMMddHH');
    var keyName = 'n_' + hour;
    var n = Number(props.getProperty(keyName) || 0) + 1;
    props.setProperty(keyName, String(n));
    // Drop the previous hour's counter so properties do not grow forever.
    var prev = Utilities.formatDate(new Date(Date.now() - 3600000), TIMEZONE, 'yyyyMMddHH');
    if (prev !== hour) props.deleteProperty('n_' + prev);
    return n > MAX_PER_HOUR;
  } catch (err) {
    return false;   // never block a real booking because bookkeeping failed
  }
}

/** Thai mobile: 0X XXXX XXXX or the +66 form. */
function validPhone(raw) {
  if (!raw) return false;
  var p = String(raw).replace(/[\s\-()]/g, '');
  return /^(0\d{8,9}|\+66\d{8,9})$/.test(p);
}

/** SZ-XXXXXX, with no look-alike characters. */
function makeRef() {
  var a = 'ACDEFGHJKLMNPQRSTUVWXY3456789', s = '';
  for (var i = 0; i < 6; i++) s += a.charAt(Math.floor(Math.random() * a.length));
  return 'SZ-' + s;
}

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

/** The site sends UTC; staff read Bangkok time. */
function received(iso) {
  var d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  return Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd HH:mm');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · RUN ONCE (optional) — tidy the sheet
   ═══════════════════════════════════════════════════════════════════════════ */

function setup() {
  var sheet = targetSheet();
  ensureHeader(sheet);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  var widths = [110, 140, 90, 100, 80, 110, 70, 170, 130, 110, 320, 90];
  for (var i = 0; i < widths.length; i++) sheet.setColumnWidth(i + 1, widths[i]);
  SpreadsheetApp.getActive().toast('Sheet ready for bookings.');
}

/** Drop a sample row in, to see the shape before the site is connected. */
function testRow() {
  Logger.log(doPost({
    postData: {
      contents: JSON.stringify({
        key: PUBLIC_KEY,
        booking: {
          date: '2026-09-20', seatingTime: '19.00', course: 'Zen Ni', party: 2,
          name: 'Test Booking', phone: '0812345678', lineId: '@test',
          notes: 'From testRow() — safe to delete.', locale: 'en',
        },
      }),
    },
  }).getContent());
}
