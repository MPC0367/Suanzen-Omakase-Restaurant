"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { Mark, Wordmark } from "./Mark";
import { restaurant } from "@/content/restaurant";
import { activeCourses } from "@/content/courses";
import { getDict, type Locale } from "@/content/dictionary";
import { qrPath } from "@/lib/qr";
import { useReveal, useWorld } from "@/lib/motion";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Chrome({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);

  useReveal();
  useWorld();

  // ── Header behaviour: compact once the page moves, and always there. It used
  //    to slide away on the way down; the menu's course bar now pins itself
  //    under the header, so the header has to stay put for it to sit under. ──
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { setScrolled(window.scrollY > 24); raf = 0; });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Publish the header's height so the course bar knows where "just under the
  // header" is. It changes as the header compacts, hence the observer.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".hdr");
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--hdr-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Escape closes whatever is open. ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setNavOpen(false); setResOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Lock the page behind overlays. ────────────────────────────────────────
  useEffect(() => {
    const open = navOpen || resOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [navOpen, resOpen]);

  // Anything asking to open the reservation panel.
  useEffect(() => {
    const open = () => setResOpen(true);
    window.addEventListener("suanzen:reserve", open);
    return () => window.removeEventListener("suanzen:reserve", open);
  }, []);

  // ── Language: the aperture closes over the page, the words change, it opens.
  const other: Locale = locale === "en" ? "th" : "en";
  const switchLang = useCallback(() => {
    const rest = pathname.replace(/^\/(en|th)/, "") || "";
    // The curtain covers the change — it is raised by the route change itself,
    // so there is nothing to time here beyond keeping the guest's place.
    const y = window.scrollY;
    router.push(`/${other}${rest}`);
    window.setTimeout(() => window.scrollTo(0, y), 40);
  }, [pathname, other, router]);

  /* Two stops: the menu, and how to get there. The page is sent as a link in
     Suan Zen's LINE OA to guests who already mean to come — nothing else to find. */
  const nav = [
    { href: asset(`/${locale}#courses`), label: t.nav.menu },
    { href: asset(`/${locale}#visit`), label: t.nav.visit },
  ];

  return (
    <>
      <header
        className={`hdr ${scrolled ? "is-scrolled" : ""}`}
        data-open={navOpen || undefined}
      >
        <div className="hdr__in">
          <Link href={`/${locale}`} className="hdr__brand" aria-label={t.a11y.brandMark}>
            <Mark size={32} priority />
            <Wordmark />
          </Link>

          <nav className="hdr__nav" aria-label={t.nav.menu}>
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="navlink">{n.label}</a>
            ))}
          </nav>

          <div className="hdr__end">
            <button className="lang" onClick={switchLang} aria-label={t.switchToLabel} lang={other}>
              {t.switchTo}
            </button>
            <button type="button" className="btn hdr__cta" onClick={() => setResOpen(true)}>
              {t.nav.reserve}
            </button>
            <button
              className="burger"
              onClick={() => setNavOpen((v) => !v)}
              aria-expanded={navOpen}
              aria-label={navOpen ? t.a11y.closeMenu : t.a11y.openMenu}
            >
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile navigation ────────────────────────────────────────────── */}
      <div className={`sheet ${navOpen ? "is-open" : ""}`} aria-hidden={!navOpen}>
        <nav className="sheet__nav" aria-label={t.nav.menu}>
          {nav.map((n, i) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setNavOpen(false)}
              style={{ ["--d" as string]: `${60 + i * 42}ms` }}
              tabIndex={navOpen ? 0 : -1}
            >
              <span className="sheet__i u-numeral">{String(i + 1).padStart(2, "0")}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="sheet__foot">
          <a className="btn" href={restaurant.contact.lineUrl.value} target="_blank" rel="noopener noreferrer"
             onClick={() => setNavOpen(false)} tabIndex={navOpen ? 0 : -1}>
            {t.cta.reserveLine}
          </a>
          <a className="link-arrow" href={`tel:${restaurant.contact.phoneIntl.value}`} tabIndex={navOpen ? 0 : -1}>
            {t.cta.call} · {restaurant.contact.phone.value}
          </a>
          <a className="link-arrow" href={restaurant.social.instagram.value} target="_blank" rel="noopener noreferrer" tabIndex={navOpen ? 0 : -1}>
            {restaurant.social.instagramHandle.value} <Arrow />
          </a>
        </div>
      </div>

      <ReservationDrawer open={resOpen} onClose={() => setResOpen(false)} locale={locale} />

      {/* The aperture that carries the language change. */}
    </>
  );
}

/* ── RESERVATION ─────────────────────────────────────────────────────────────
   LINE is the restaurant's actual booking channel, so the panel is a real
   handoff to LINE — not a form that pretends to hold a table.               */
function ReservationDrawer({
  open, onClose, locale,
}: { open: boolean; onClose: () => void; locale: Locale }) {
  const t = getDict(locale);
  const panel = useRef<HTMLDivElement>(null);
  const lineUrl = restaurant.contact.lineUrl.value;
  const qr = useMemo(() => qrPath(lineUrl), [lineUrl]);

  // Focus goes into the panel, and stays there while it is open.
  useEffect(() => {
    if (!open) return;
    const node = panel.current;
    if (!node) return;
    const sel = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const first = node.querySelector<HTMLElement>(sel);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(sel)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const a = items[0], z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [open]);

  const seatings = restaurant.seatings.value;

  return (
    <div className={`res ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="res__scrim" onClick={onClose} tabIndex={-1} aria-hidden="true" />
      <div
        className="res__panel"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t.reserve.panelHeading}
      >
        <div className="res__head">
          <span className="u-label">{t.reserve.label}</span>
          <button className="res__x" onClick={onClose} aria-label={t.gallery.close}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <h2 className="display display--course">{t.reserve.panelHeading}</h2>
        <p className="u-lede res__lede">{t.reserve.panelBody}</p>

        <div className="res__routes">
          <a className="btn res__line" href={lineUrl} target="_blank" rel="noopener noreferrer">
            {t.cta.reserveLine} <Arrow />
          </a>
        </div>

        <div className="res__qr">
          <div className="res__qrbox">
            <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} width="132" height="132" role="img"
                 aria-label={`${t.reserve.scanLabel} — ${restaurant.contact.lineDisplayId.value}`}>
              <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} fill="#f5efe3" />
              <path d={qr.d} fill="#0b0b08" />
            </svg>
          </div>
          <div className="res__qrtext">
            <span className="u-label">{t.reserve.scanLabel}</span>
            <p className="res__lineid">{restaurant.contact.lineDisplayId.value}</p>
            <p className="res__or">
              {t.reserve.orCall}{" "}
              <a href={`tel:${restaurant.contact.phoneIntl.value}`} className="res__tel">
                {restaurant.contact.phone.value}
              </a>
            </p>
          </div>
        </div>

        <dl className="res__facts">
          <div>
            <dt className="u-label">{t.reserve.seatingsNote}</dt>
            <dd className="u-numeral">{seatings.join("  ·  ")}</dd>
          </div>
          <div>
            <dt className="u-label">{t.reserve.chooseCourse}</dt>
            <dd>{activeCourses.map((c) => (locale === "th" ? c.nameTh : c.nameEn)).join(", ")}</dd>
          </div>
          <div>
            <dt className="u-label">{t.reserve.dietaryHeading}</dt>
            <dd>{restaurant.reservation.dietaryNote[locale]}</dd>
          </div>
        </dl>

        <p className="res__lead">{t.reserve.lead}</p>
      </div>
    </div>
  );
}
