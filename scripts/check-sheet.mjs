/**
 * Check the Google Sheet connection end to end.
 *
 *   npm run check:sheet
 *
 * Reads SHEETS_WEBHOOK_URL and SHEETS_WEBHOOK_SECRET from .env.local, pings the
 * deployment, then sends one clearly-labelled test booking. Delete the row from
 * the sheet afterwards.
 */
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.SHEETS_WEBHOOK_URL;
const secret = process.env.SHEETS_WEBHOOK_SECRET;

const die = (msg) => { console.error('\n  ✗ ' + msg + '\n'); process.exit(1); };

if (!url) die('SHEETS_WEBHOOK_URL is not set. Add it to .env.local.');
if (!secret) {
  die(
    'SHEETS_WEBHOOK_SECRET is not set.\n' +
    '    Open .env.local and paste the SECRET from the top of your Code.gs\n' +
    '    after SHEETS_WEBHOOK_SECRET= (no quotes).',
  );
}

const say = (ok, label, detail = '') =>
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? '  ' + detail : ''}`);

console.log('\nChecking the sheet connection\n');

// 1 — is the deployment alive?
try {
  const r = await fetch(url, { redirect: 'follow' });
  const t = (await r.text()).trim();
  if (!t.startsWith('{')) {
    say(false, 'deployment reachable', 'got HTML, not JSON');
    die('That usually means access is not set to "Anyone".\n' +
        '    Apps Script → Deploy → Manage deployments → edit → Who has access: Anyone.');
  }
  say(true, 'deployment reachable', JSON.parse(t).service || '');
} catch (err) {
  say(false, 'deployment reachable', err.message);
  die('Check SHEETS_WEBHOOK_URL is the /exec URL from Manage deployments.');
}

// 2 — is the secret right? An empty booking cannot write a row either way.
{
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, booking: {} }),
    redirect: 'follow',
  });
  const t = (await r.text()).trim();
  let j = {};
  try { j = JSON.parse(t); } catch { /* html */ }

  if (j.error === 'bad_secret') {
    say(false, 'secret accepted');
    die('SHEETS_WEBHOOK_SECRET does not match SECRET in Code.gs.\n' +
        '    They must be character-for-character identical.\n' +
        '    If you changed Code.gs, redeploy: Deploy → Manage deployments →\n' +
        '    edit → Version: New version. Saving alone does not update the URL.');
  }
  if (j.error !== 'incomplete_booking') {
    say(false, 'secret accepted', t.slice(0, 120));
    die('Unexpected reply from the script.');
  }
  say(true, 'secret accepted');
}

// 3 — write one real row.
{
  const now = new Date();
  const inAWeek = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      booking: {
        ref: 'SZ-CHECK',
        receivedAt: now.toISOString(),
        status: 'requested',
        date: inAWeek,
        seatingTime: '19.00',
        course: 'Zen Ni',
        party: 2,
        name: 'Connection test',
        phone: '0812345678',
        lineId: '@test',
        notes: 'Written by npm run check:sheet — safe to delete.',
        locale: 'en',
      },
    }),
    redirect: 'follow',
  });
  const t = (await r.text()).trim();
  let j = {};
  try { j = JSON.parse(t); } catch { /* html */ }
  if (!j.ok) {
    say(false, 'test row written', t.slice(0, 140));
    die('The script refused the booking.');
  }
  say(true, 'test row written', 'ref SZ-CHECK');
}

console.log(
  '\n  The connection works. Open the sheet — the newest row is directly under\n' +
  '  the header. Delete the SZ-CHECK row when you are done.\n',
);
