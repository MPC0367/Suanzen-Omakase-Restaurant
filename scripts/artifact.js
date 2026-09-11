(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── photographs ────────────────────────────────────────────────────────
     Each picture lives once in window.SZ_P; elements carry its id. */
  var P = window.SZ_P || {};
  var uri = function (id) { return (id && P[id]) || ''; };
  document.querySelectorAll('img[data-p]').forEach(function (im) {
    var src = uri(im.getAttribute('data-p'));
    if (src) im.src = src;
  });

  /* ── the curtain ────────────────────────────────────────────────────────
     CSS plays it as the page opens; this only replays it on a change of
     language, the way the site raises it on a change of route. */
  var curtain = document.getElementById('curtain');
  function raiseCurtain() {
    if (!curtain || reduce) return;
    curtain.classList.remove('is-up');
    void curtain.offsetWidth;
    curtain.classList.add('is-up');
  }

  /* ── language ───────────────────────────────────────────────────────────
     Every bilingual node carries both strings. Swapping is a text change, so
     scroll position and the open course survive it. */
  var lang = 'en';
  function setLang(next, quiet) {
    if (!quiet) raiseCurtain();
    lang = next;
    document.documentElement.setAttribute('lang', next === 'th' ? 'th' : 'en');
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var v = el.getAttribute('data-' + next);
      if (v !== null) el.textContent = v;
    });
    var btn = document.getElementById('lang');
    btn.textContent = next === 'en' ? 'ไทย' : 'EN';
    btn.setAttribute('aria-label', next === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Read in English');
    try { localStorage.setItem('sz:lang', next); } catch (e) {}
    if (stage.course) paintStage(stage.course, stage.dish);
  }
  document.getElementById('lang').addEventListener('click', function () {
    setLang(lang === 'en' ? 'th' : 'en');
  });

  /* ── header ─────────────────────────────────────────────────────────────
     Always there — the course bar pins itself under it — and compact once the
     page moves. Its height is published so the bar knows where to sit. */
  var hdr = document.getElementById('hdr');
  function solid() { hdr.classList.toggle('is-solid', scrollY > 24); }
  addEventListener('scroll', solid, { passive: true });
  solid();
  function publishHeight() { document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px'); }
  publishHeight();
  if ('ResizeObserver' in window) new ResizeObserver(publishHeight).observe(hdr);
  else addEventListener('resize', publishHeight);

  /* ── mobile sheet ───────────────────────────────────────────────────── */
  var sheet = document.getElementById('sheet'), burger = document.getElementById('burger');
  function closeSheet() {
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    var open = !sheet.classList.contains('is-open');
    sheet.classList.toggle('is-open', open);
    sheet.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  sheet.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeSheet); });

  /* ── day / night ────────────────────────────────────────────────────────
     Whatever section crosses a thin line across the viewport owns it. A
     share-of-section rule can never be met by a section more than about twice
     the viewport's height — the menu is — so it would never turn to day. */
  var root = document.documentElement;
  root.setAttribute('data-world', 'day');
  if ('IntersectionObserver' in window) {
    var wo = new IntersectionObserver(function (entries) {
      var hit = entries.filter(function (e) { return e.isIntersecting; })[0];
      if (hit) root.setAttribute('data-world', hit.target.getAttribute('data-world'));
    }, { threshold: 0, rootMargin: '-42% 0px -57% 0px' });
    document.querySelectorAll('section[data-world], footer[data-world]').forEach(function (s) { wo.observe(s); });
  }

  /* ── the menu ───────────────────────────────────────────────────────────
     One course open at a time. Pointing at a dish shows the restaurant's
     photograph of it; a dish without one falls back to a course picture and
     is captioned as the course, never as the dish. On touch only a dish's own
     photograph opens beneath it. */
  var stageImg = document.getElementById('stageImg');
  var stageCap = document.getElementById('stageCap');
  var stage = { course: null, dish: null };
  var touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;

  function paintStage(course, dish) {
    stage.course = course; stage.dish = dish;
    var src = uri((dish && dish.dataset.shot) || course.dataset.stage);
    if (!src) return;
    if (stageImg.src !== src) stageImg.src = src;
    stageCap.textContent = dish && dish.dataset.shot
      ? dish.dataset['name' + (lang === 'th' ? 'Th' : 'En')]
      : course.dataset['name' + (lang === 'th' ? 'Th' : 'En')];
  }

  var courses = [].slice.call(document.querySelectorAll('.course'));
  var chips = [].slice.call(document.querySelectorAll('.jump'));
  function markChips(course) {
    var k = course ? course.dataset.key : null;
    chips.forEach(function (ch) { ch.classList.toggle('is-on', ch.dataset.course === k); });
  }
  function closeAll() {
    courses.forEach(function (c) {
      c.classList.remove('is-open');
      c.querySelector('.course__btn').setAttribute('aria-expanded', 'false');
    });
  }
  function openCourse(course) {
    closeAll();
    course.classList.add('is-open');
    course.querySelector('.course__btn').setAttribute('aria-expanded', 'true');
    paintStage(course, null);
    markChips(course);
  }

  courses.forEach(function (course) {
    course.querySelector('.course__btn').addEventListener('click', function () {
      if (course.classList.contains('is-open')) { closeAll(); markChips(null); }
      else openCourse(course);
    });

    course.querySelectorAll('.dish').forEach(function (dish) {
      var show = function () { paintStage(course, dish); };
      if (!touch) dish.addEventListener('mouseenter', show);
      dish.addEventListener('focusin', show);
      dish.querySelector('.dish__btn').addEventListener('click', function () {
        show();
        if (!touch || !dish.dataset.shot) return;
        var existing = dish.querySelector('.dish__shot');
        if (existing) { existing.remove(); return; }
        var wrap = document.createElement('div');
        wrap.className = 'dish__shot';
        var im = document.createElement('img');
        im.src = uri(dish.dataset.shot);
        im.alt = '';
        wrap.appendChild(im);
        dish.appendChild(wrap);
      });
    });
  });

  /* The shortcuts always open their course, never close it, and bring its
     heading into view below the header (and below the bar, on a phone). */
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      var course = courses[Number(ch.dataset.course)];
      if (!course) return;
      openCourse(course);
      requestAnimationFrame(function () {
        course.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  });
  if (courses[0]) paintStage(courses[0], null);

  /* ── start in the reader's language ─────────────────────────────────── */
  var saved = null;
  try { saved = localStorage.getItem('sz:lang'); } catch (e) {}
  if (saved === 'th' || (!saved && (navigator.language || '').toLowerCase().indexOf('th') === 0)) setLang('th', true);
})();
