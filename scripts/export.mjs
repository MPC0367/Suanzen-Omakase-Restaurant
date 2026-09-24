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

/* Which edition a browser gets, from the languages it asks for, in its own
   order of preference: Thai to /th/; Simplified Chinese (zh-CN, zh-SG,
   zh-Hans, or plain zh) to /zh/; Traditional Chinese (zh-TW, zh-HK, zh-MO,
   zh-Hant) to English, since the Chinese edition is in simplified characters
   and a Taiwan or Hong Kong reader is better served by the English than by a
   script they read as foreign. English, or nothing recognised, to /en/. The
   query and #section come along. Written once and inlined into each page
   that redirects. */
const pickLocale = `function(){
    var ask = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
    for (var i = 0; i < ask.length; i++) {
      var t = String(ask[i] || '').toLowerCase().split('_').join('-');
      if (t === 'th' || t.indexOf('th-') === 0) return 'th';
      if (t === 'zh' || t.indexOf('zh-') === 0) {
        if (/(^|-)hans(-|$)/.test(t)) return 'zh';
        if (/(^|-)(hant|tw|hk|mo)(-|$)/.test(t)) return 'en';
        return 'zh';
      }
      if (t === 'en' || t.indexOf('en-') === 0) return 'en';
    }
    return 'en';
  }`;
// The root address is the one the handover QR encodes and the one the LINE OA
// will most likely send, so this redirect page carries the same link preview
// as the pages it forwards to, and a canonical pointing at /en/ so search
// engines list the English menu, not this chooser. It is in all three
// languages because it speaks for all three. Keep the image in step with
// OG_IMAGE in src/lib/site.ts.
const origin = (process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://mpc0367.github.io').replace(/\/$/, '');
const preview = `${origin}${prefix}/og/suan-zen.jpg`;
fs.writeFileSync(
  path.join(OUT, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suan Zen Omakase — Menu · เมนู · 菜单</title>
<meta name="description" content="The omakase menu: seven courses and every item, with prices. · เมนูโอมากาเสะ 7 คอร์ส ครบทุกรายการ พร้อมราคา · Suan Zen Omakase 套餐菜单：7款套餐、完整菜品与价格。">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Suan Zen Omakase">
<meta property="og:title" content="Suan Zen Omakase — Menu · เมนู · 菜单">
<meta property="og:description" content="The omakase menu: seven courses and every item, with prices. · เมนูโอมากาเสะ 7 คอร์ส ครบทุกรายการ พร้อมราคา · Suan Zen Omakase 套餐菜单：7款套餐、完整菜品与价格。">
<meta property="og:url" content="${origin}${prefix}/">
<meta property="og:image" content="${preview}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="800">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${preview}">
<link rel="canonical" href="${origin}${prefix}/en/">
<meta http-equiv="refresh" content="0; url=${prefix}/en/">
<script>
  location.replace('${prefix}/' + (${pickLocale})() + '/' + location.search + location.hash);
</script>
<style>
  body{margin:0;background:#0a0a0a;color:#f0ebe0;
       font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
       display:grid;place-items:center;min-height:100vh}
  a{color:#eeca0e}
</style>
</head>
<body>
  <p>Suan Zen Omakase — <a href="${prefix}/en/" hreflang="en">English</a> · <a href="${prefix}/th/" hreflang="th" lang="th">ไทย</a> · <a href="${prefix}/zh/" hreflang="zh-CN" lang="zh-CN">简体中文</a></p>
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
  location.replace('${prefix}/' + (${pickLocale})() + '/courses/${slug}/' + location.search + location.hash);
</script>
</head>
<body><p><a href="${to}">Suan Zen Omakase</a></p></body>
</html>
`,
    );
  }
}

// fs, not du/find: this also runs on the Windows studio machine.
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [fs.statSync(path.join(d, e.name)).size],
  );
const sizes = walk(OUT);
const mb = (sizes.reduce((a, b) => a + b, 0) / 1048576).toFixed(1);
console.log(`\nStatic site in out/  —  ${sizes.length} files, ${mb} MB`);
console.log(basePath ? `Built for a project site at ${basePath}/` : 'Built for a domain root.');
