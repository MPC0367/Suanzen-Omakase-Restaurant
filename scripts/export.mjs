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

/**
 * Next lives in node_modules/.bin, which npm puts on PATH for `npm run` but
 * nothing puts there for a bare `node scripts/export.mjs` — which is how CI
 * invokes this. Resolve the binary rather than trusting the environment.
 */
const NEXT = (() => {
  const local = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
  if (fs.existsSync(local)) return JSON.stringify(local);
  return 'next';   // fall back to PATH and let it fail loudly if absent
})();

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

  execSync(`${NEXT} build`, {
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

// GitHub Pages runs Jekyll by default, which drops folders beginning with _.
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// There is no server to redirect / to /en/, so ship a page that does it.
const prefix = basePath || '';
// The root address is the one the handover QR encodes and the one the LINE OA
// will most likely send, so this redirect page carries the same link preview
// and the same do-not-list instruction as the pages it forwards to. It is
// bilingual because it speaks for both. Keep the image in step with OG_IMAGE
// in src/lib/site.ts.
const origin = (process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://mpc0367.github.io').replace(/\/$/, '');
const preview = `${origin}${prefix}/og/suan-zen.jpg`;
fs.writeFileSync(
  path.join(OUT, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suan Zen Omakase — Menu · เมนู</title>
<meta name="description" content="The omakase menu: seven courses and every dish, with prices. · เมนูโอมากาเสะ 7 คอร์ส พร้อมรายการอาหารทุกจานและราคา">
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Suan Zen Omakase">
<meta property="og:title" content="Suan Zen Omakase — Menu · เมนู">
<meta property="og:description" content="The omakase menu: seven courses and every dish, with prices. · เมนูโอมากาเสะ 7 คอร์ส พร้อมรายการอาหารทุกจานและราคา">
<meta property="og:url" content="${origin}${prefix}/">
<meta property="og:image" content="${preview}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="800">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${preview}">
<link rel="canonical" href="${origin}${prefix}/en/">
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
// Next writes its own not-found page to 404.html and 404/index.html, marked
// only "noindex"; replace both with the redirect page above, so a mistyped
// address lands on the menu and says noindex, nofollow like every other page.
for (const f of ['404.html', path.join('404', 'index.html')]) {
  if (fs.existsSync(path.join(OUT, path.dirname(f)))) {
    fs.copyFileSync(path.join(OUT, 'index.html'), path.join(OUT, f));
  }
}

// Course links without a language — /courses/zen-ichi/ — for staff to send in
// LINE. Each one forwards to the guest's language and keeps the course; it
// carries that course's own link preview, and says noindex like every page.
const courseDir = path.join(OUT, 'en', 'courses');
if (fs.existsSync(courseDir)) {
  for (const slug of fs.readdirSync(courseDir)) {
    const page = path.join(courseDir, slug, 'index.html');
    if (!fs.existsSync(page)) continue;
    const preview = (fs.readFileSync(page, 'utf8').match(/<meta (?:property|name)="(?:og|twitter):[^>]*>/g) || []).join('\n');
    const to = `${prefix}/en/courses/${slug}/`;
    const dir = path.join(OUT, 'courses', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suan Zen Omakase</title>
<meta name="robots" content="noindex, nofollow">
${preview}
<link rel="canonical" href="${origin}${to}">
<meta http-equiv="refresh" content="0; url=${to}">
<script>
  var th = (navigator.language || '').toLowerCase().indexOf('th') === 0;
  location.replace('${prefix}/' + (th ? 'th' : 'en') + '/courses/${slug}/');
</script>
</head>
<body><p><a href="${to}">Suan Zen Omakase</a></p></body>
</html>
`,
    );
  }
}

const size = execSync(`du -sh "${OUT}"`).toString().trim().split(/\s+/)[0];
const files = execSync(`find "${OUT}" -type f | wc -l`).toString().trim();
console.log(`\nStatic site in out/  —  ${files} files, ${size}`);
console.log(basePath ? `Built for a project site at ${basePath}/` : 'Built for a domain root.');
