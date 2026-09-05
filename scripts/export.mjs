/**
 * Build the static site for GitHub Pages.
 *
 *   node scripts/export.mjs                 -> served from a domain root
 *   node scripts/export.mjs --base /repo    -> served from github.io/<repo>/
 *
 * Next cannot export a POST route handler, so the API is moved aside for the
 * duration of the build and put straight back — including if the build fails.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const API = path.join(root, 'src/app/api');
const STASH = path.join(root, '.api-stash');
const OUT = path.join(root, 'out');

const baseArg = process.argv.indexOf('--base');
const basePath = baseArg > -1 ? (process.argv[baseArg + 1] || '').replace(/\/$/, '') : '';

const restore = () => {
  if (fs.existsSync(STASH)) {
    fs.rmSync(API, { recursive: true, force: true });
    fs.renameSync(STASH, API);
  }
};
process.on('exit', restore);
process.on('SIGINT', () => { restore(); process.exit(1); });

try {
  if (fs.existsSync(API)) fs.renameSync(API, STASH);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });

  execSync('next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      STATIC_EXPORT: '1',
      NEXT_PUBLIC_STATIC_EXPORT: '1',
      BASE_PATH: basePath,
    },
  });
} finally {
  restore();
}

// Say plainly whether this build can reach the sheet, so nobody ships a site
// that quietly falls back to LINE and only finds out from an empty spreadsheet.
{
  // Ask the built files, not this process. Next reads .env.local itself, so the
  // wrapper's own environment is not evidence of what actually got compiled in.
  const chunks = path.join(OUT, '_next');
  let wired = false;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (wired) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js') && fs.readFileSync(full, 'utf8').includes('/macros/s/')) wired = true;
    }
  };
  if (fs.existsSync(chunks)) walk(chunks);
  console.log(
    wired
      ? '\n  bookings → Google Sheet (posted from the browser)'
      : '\n  bookings → LINE only. Set NEXT_PUBLIC_SHEET_URL and NEXT_PUBLIC_SHEET_KEY\n' +
        '                 in .env.local to write to the sheet instead.',
  );
}

// GitHub Pages runs Jekyll by default, which drops folders beginning with _.
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// There is no server to redirect / to /en/, so ship a page that does it.
const prefix = basePath || '';
fs.writeFileSync(
  path.join(OUT, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suan Zen Omakase — Omakase in Nonthaburi</title>
<link rel="canonical" href="${prefix}/en/">
<meta http-equiv="refresh" content="0; url=${prefix}/en/">
<script>
  // Send Thai browsers to the Thai site; everyone else to English.
  var th = (navigator.language || '').toLowerCase().indexOf('th') === 0;
  location.replace('${prefix}/' + (th ? 'th' : 'en') + '/');
</script>
<style>
  body{margin:0;background:#0b0b08;color:#f0ebe0;
       font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
       display:grid;place-items:center;min-height:100vh}
  a{color:#eeca0e}
</style>
</head>
<body>
  <p>Suan Zen Omakase — <a href="${prefix}/en/">English</a> · <a href="${prefix}/th/">ไทย</a></p>
</body>
</html>
`,
);

// A 404 that keeps people inside the site rather than on Pages' default page.
const notFound = path.join(OUT, '404.html');
if (!fs.existsSync(notFound)) {
  fs.copyFileSync(path.join(OUT, 'index.html'), notFound);
}

const size = execSync(`du -sh "${OUT}"`).toString().trim().split(/\s+/)[0];
const files = execSync(`find "${OUT}" -type f | wc -l`).toString().trim();
console.log(`\nStatic site in out/  —  ${files} files, ${size}`);
console.log(basePath ? `Built for a project site at ${basePath}/` : 'Built for a domain root.');
