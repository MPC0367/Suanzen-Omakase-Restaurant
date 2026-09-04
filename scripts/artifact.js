(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── photographs ────────────────────────────────────────────────────────
     Each picture lives once in window.SZ_P; elements carry its id. Resolve
     them straight away so nothing is waiting on a network that isn't there. */
  var P = window.SZ_P || {};
  var uri = function (id) { return (id && P[id]) || ''; };
  document.querySelectorAll('img[data-p]').forEach(function (im) {
    var src = uri(im.getAttribute('data-p'));
    if (src) im.src = src;
  });

  /* ── language ───────────────────────────────────────────────────────────
     Every bilingual node carries both strings. Swapping is a text change, so
     scroll position, open course and lightbox state all survive it. */
  var lang = 'en';
  function setLang(next) {
    lang = next;
    document.documentElement.setAttribute('lang', next === 'th' ? 'th' : 'en');
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var v = el.getAttribute('data-' + next);
      if (v !== null) el.textContent = v;
    });
    document.querySelectorAll('[data-alt-en]').forEach(function (el) {
      el.alt = el.getAttribute('data-alt-' + next) || '';
    });
    var btn = document.getElementById('lang');
    btn.textContent = next === 'en' ? 'ไทย' : 'EN';
    btn.setAttribute('aria-label', next === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Read in English');
    try { localStorage.setItem('sz:lang', next); } catch (e) {}
    if (stage.course) paintStage(stage.course, stage.dish);
    if (lb.open) paintLb();
  }
  document.getElementById('lang').addEventListener('click', function () {
    setLang(lang === 'en' ? 'th' : 'en');
  });

  /* ── header ─────────────────────────────────────────────────────────── */
  var hdr = document.getElementById('hdr'), lastY = 0, ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = scrollY;
      hdr.classList.toggle('is-solid', y > 80);
      hdr.classList.toggle('is-hidden', y > 420 && y > lastY && !sheet.classList.contains('is-open'));
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

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
     Sections declare which world they belong to; the page follows whichever
     one owns most of the viewport. */
  var worlds = [].slice.call(document.querySelectorAll('[data-world]'));
  if ('IntersectionObserver' in window) {
    var wo = new IntersectionObserver(function (entries) {
      var top = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (top) document.documentElement.setAttribute('data-world', top.target.dataset.world);
    }, { threshold: [0.32, 0.6], rootMargin: '-18% 0px -34% 0px' });
    worlds.forEach(function (s) { wo.observe(s); });
  }
  document.documentElement.setAttribute('data-world', 'night');

  /* ── reveal ─────────────────────────────────────────────────────────── */
  var rvTargets = document.querySelectorAll('.secthead, .prop .shell, .garden__grid, .counter__grid, .menu, .ala__pending, .dark__in, .visit__grid, .resv__in');
  rvTargets.forEach(function (el) { el.classList.add('rv'); });
  if (reduce || !('IntersectionObserver' in window)) {
    rvTargets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    rvTargets.forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in');
      else ro.observe(el);
    });
  }

  /* ── the menu ───────────────────────────────────────────────────────────
     One course open at a time. Pointing at a dish shows the restaurant's
     photograph of it; a dish without one falls back to a course picture and
     is captioned as the course, never as the dish. */
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
  courses.forEach(function (course) {
    var btn = course.querySelector('.course__btn');
    btn.addEventListener('click', function () {
      var open = !course.classList.contains('is-open');
      courses.forEach(function (c) {
        c.classList.remove('is-open');
        c.querySelector('.course__btn').setAttribute('aria-expanded', 'false');
      });
      if (open) {
        course.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        paintStage(course, null);
      }
    });

    course.querySelectorAll('.dish').forEach(function (dish) {
      var show = function () { paintStage(course, dish); };
      if (!touch) dish.addEventListener('mouseenter', show);
      dish.addEventListener('focusin', show);
      dish.querySelector('.dish__btn').addEventListener('click', function () {
        show();
        // No hover on touch, so the picture opens beneath the dish instead.
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
  if (courses[0]) paintStage(courses[0], null);

  /* ── rails: drag anywhere, drift only where asked ─────────────────────── */
  [].slice.call(document.querySelectorAll('.rail')).forEach(function (rail) {
    var down = false, startX = 0, startLeft = 0, moved = 0, held = 0;
    var hold = function (on) { held = Math.max(0, held + (on ? 1 : -1)); };

    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      down = true; moved = 0; startX = e.clientX; startLeft = rail.scrollLeft;
      rail.classList.add('is-dragging');
      hold(true);
    });
    rail.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      // Capture only once this is really a drag — capturing on pointerdown
      // retargets the click and the photograph could never be opened.
      if (moved > 4) {
        if (!rail.hasPointerCapture(e.pointerId)) rail.setPointerCapture(e.pointerId);
        rail.scrollLeft = startLeft - dx;
      }
    });
    function up(e) {
      if (!down) return;
      down = false; hold(false);
      if (rail.hasPointerCapture && rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
      rail.classList.remove('is-dragging');
      if (moved > 6) rail.addEventListener('click', function (ev) {
        ev.stopPropagation(); ev.preventDefault();
      }, { capture: true, once: true });
    }
    rail.addEventListener('pointerup', up);
    rail.addEventListener('pointercancel', up);
    rail.addEventListener('touchstart', function () { hold(true); }, { passive: true });
    rail.addEventListener('touchend', function () { hold(false); }, { passive: true });
    rail.addEventListener('pointerenter', function () { hold(true); });
    rail.addEventListener('pointerleave', function () { hold(false); });
    rail.addEventListener('focusin', function () { hold(true); });
    rail.addEventListener('focusout', function () { hold(false); });

    if (rail.dataset.drift !== '1' || reduce) return;

    // The track is rendered twice; at the halfway mark the scroll jumps back
    // by exactly half and the seam is invisible. The position is accumulated
    // here rather than read back — scrollLeft reports whole pixels, so a
    // fraction-of-a-pixel step read back as 0 and never moved at all.
    var pos = rail.scrollLeft, last = 0, SPEED = 22;
    function tick(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (!held && !document.hidden && !lb.open) {
        if (Math.abs(rail.scrollLeft - pos) > 2) pos = rail.scrollLeft;
        var half = rail.scrollWidth / 2;
        pos += SPEED * dt;
        if (half > 0 && pos >= half) pos -= half;
        rail.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  /* ── lightbox ───────────────────────────────────────────────────────── */
  var lbEl = document.getElementById('lb');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbN = document.getElementById('lbN');
  var lb = { open: false, list: [], i: 0, opener: null };

  function paintLb() {
    var b = lb.list[lb.i];
    if (!b) return;
    lbImg.src = uri(b.dataset.full);
    var cap = b.dataset['cap' + (lang === 'th' ? 'Th' : 'En')] || '';
    lbImg.alt = cap;
    lbCap.textContent = cap;
    lbN.textContent = String(lb.i + 1).padStart(2, '0') + ' / ' + String(lb.list.length).padStart(2, '0');
  }
  function openLb(list, i, opener) {
    lb.list = list; lb.i = i; lb.open = true; lb.opener = opener;
    paintLb();
    lbEl.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  }
  function closeLb() {
    lb.open = false;
    lbEl.hidden = true;
    document.body.style.overflow = '';
    if (lb.opener) lb.opener.focus();
  }
  function step(d) { lb.i = (lb.i + d + lb.list.length) % lb.list.length; paintLb(); }

  [].slice.call(document.querySelectorAll('.rail')).forEach(function (rail) {
    // Only the first copy of a doubled track is offered to the lightbox, so a
    // photograph is never listed twice.
    var buttons = [].slice.call(rail.querySelectorAll('.rail__item:not([aria-hidden]) .rail__btn'));
    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () { openLb(buttons, i, b); });
    });
  });

  document.getElementById('lbClose').addEventListener('click', closeLb);
  document.getElementById('lbScrim').addEventListener('click', closeLb);
  document.getElementById('lbPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('lbNext').addEventListener('click', function () { step(1); });

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (lb.open) closeLb(); else if (sheet.classList.contains('is-open')) closeSheet(); }
    if (!lb.open) return;
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'Tab') {
      var items = [].slice.call(lbEl.querySelectorAll('.lb__ctl'));
      var first = items[0], last2 = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last2.focus(); }
      else if (!e.shiftKey && document.activeElement === last2) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipe inside the lightbox.
  var tx = null;
  lbEl.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lbEl.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
    tx = null;
  }, { passive: true });

  /* ── start in the reader's language ─────────────────────────────────── */
  var saved = null;
  try { saved = localStorage.getItem('sz:lang'); } catch (e) {}
  if (saved === 'th' || (!saved && (navigator.language || '').toLowerCase().indexOf('th') === 0)) setLang('th');
})();
