"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { asset } from "@/lib/asset";
import { keepPlace } from "@/lib/place";
import { getDict, isLocale, localeInfo, locales, type Locale } from "@/content/dictionary";

/**
 * The language selector: English, ไทย, 简体中文.
 *
 * A button that shows the language the page is in, and opens a short list of
 * the three. Each is an ordinary link to the same page in that language — the
 * same course, the same query and the same #section — so it works before the
 * scripts arrive and opens in a new tab like any link. With the scripts, the
 * change happens in place under the curtain and the guest stays where they
 * were reading (lib/place.ts).
 *
 * Keyboard: the button opens the list (Enter, Space or the down arrow), the
 * arrows walk it, Escape closes it and gives the focus back to the button, and
 * leaving it by Tab closes it. A click anywhere else closes it too. After a
 * change made from the keyboard, focus comes back to this button on the new
 * page, so the next Tab carries on from where the guest was.
 */

type Aim = "current" | "first" | "last";

/** `path` is this page's address after the language — "/" or
    "/courses/zen-san/" — given by the page itself rather than read from the
    URL, which in the preview artifact is a flattened file name. */
export default function LanguageMenu({ locale, path: here }: { locale: Locale; path: string }) {
  const t = getDict(locale);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The query and #section of the page as it is now, read when the list opens
  // so the links carry them even when opened in a new tab.
  const [tail, setTail] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const aim = useRef<Aim | null>(null);   // where focus goes once the list is shown
  const pressing = useRef(false);         // a pointer is down inside the widget
  const listId = useId();

  const path = (l: Locale) => `/${l}${here}`;

  const items = () => Array.from(wrap.current?.querySelectorAll<HTMLAnchorElement>(".lang__opt") ?? []);
  const focusItem = (which: Aim) => {
    const all = items();
    const to = which === "first" ? all[0]
      : which === "last" ? all[all.length - 1]
      : all.find((a) => a.getAttribute("aria-current")) ?? all[0];
    to?.focus({ preventScroll: true });
  };

  const show = useCallback((focus?: Aim) => {
    setTail(window.location.search + window.location.hash);
    aim.current = focus ?? null;
    setOpen(true);
  }, []);

  /* Focus can only go into the list once it is shown. The effect runs after
     the render that shows it, but Safari with reduced motion goes on reporting
     the list hidden for a few frames more and refuses the focus meanwhile. So
     it is offered each frame until it is taken, for half a second at most. */
  useEffect(() => {
    const focus = aim.current;
    aim.current = null;
    if (!open || !focus) return;
    let frame = 0, tries = 0;
    const offer = () => {
      focusItem(focus);
      const taken = !!wrap.current?.querySelector(".lang__list")?.contains(document.activeElement);
      if (!taken && tries++ < 30) frame = requestAnimationFrame(offer);
    };
    frame = requestAnimationFrame(offer);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const hide = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) button.current?.focus({ preventScroll: true });
  }, []);

  /* While it is open: a click or tap anywhere else closes it; so does Escape
     wherever the focus is (Safari leaves it on the page, not the button, after
     a mouse click); and the guest's place is kept at the moment a language is
     actually chosen. That last is a capture listener on the window so that it
     still runs in the preview artifact, whose own link handling opens the
     flattened page first — and a press slid off without a click keeps nothing. */
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) hide();
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide(!!wrap.current?.contains(document.activeElement));
    };
    const chosen = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(".lang__opt");
      const l = a?.getAttribute("data-locale") ?? "";
      if (!a || !wrap.current?.contains(a) || !isLocale(l) || l === locale) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      keepPlace(l, { focus: e.detail === 0 });   // detail 0: pressed from the keyboard
    };
    const release = () => { pressing.current = false; };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    window.addEventListener("click", chosen, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      window.removeEventListener("click", chosen, true);
    };
  }, [open, hide, locale]);

  // A new page closes it (the list belongs to the page it was opened on).
  useEffect(() => { setOpen(false); }, [pathname]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      hide(true);
      return;
    }
    const all = items();
    const i = all.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.target === button.current) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const which: Aim = e.key === "ArrowDown" ? "current" : "last";
      // Already open (Enter, Space or a click opened it): straight in.
      if (open) focusItem(which);
      else show(which);
      return;
    }
    if (i < 0) return;
    const go = (n: number) => { e.preventDefault(); all[(n + all.length) % all.length]?.focus({ preventScroll: true }); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
  };

  /* Focus leaving the whole widget — Tab past the last language — closes it.
     Not while a pointer is down inside it: Safari moves focus to the page on
     mousedown over a link, and closing then would swallow the click. */
  const onBlur = (e: React.FocusEvent) => {
    if (!open || pressing.current) return;
    if (!wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
  };

  const choose = (l: Locale) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // The page already in this language: just close.
    if (l === locale) { e.preventDefault(); hide(true); return; }
    // Something else has taken this click (the preview artifact's own link
    // handling), as Next's <Link> would allow; or it is for a new tab, which
    // the link does by itself.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setOpen(false);
    // The curtain rises on the change of address, so nothing needs timing here;
    // scroll: false leaves the page where it is until the new words are in.
    router.push(`${path(l)}${window.location.search}${window.location.hash}`, { scroll: false });
  };

  return (
    <div
      className="lang"
      ref={wrap}
      data-open={open || undefined}
      onKeyDown={onKey}
      onBlur={onBlur}
      onPointerDown={() => { pressing.current = true; }}
    >
      <button
        ref={button}
        type="button"
        className="lang__btn"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? hide() : show())}
      >
        <span className="vh">{t.languageLabel}: </span>
        <svg className="lang__globe" width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M1.6 8h12.8M8 1.4c-2.2 2.1-2.2 11.1 0 13.2M8 1.4c2.2 2.1 2.2 11.1 0 13.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span lang={localeInfo[locale].html}>{localeInfo[locale].short}</span>
        <svg className="lang__chev" width="9" height="6" viewBox="0 0 9 6" aria-hidden="true">
          <path d="M1 1l3.5 3.5L8 1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <ul className="lang__list" id={listId} aria-label={t.languageLabel}>
        {locales.map((l) => (
          <li key={l}>
            <a
              className="lang__opt"
              href={asset(`${path(l)}${tail}`)}
              hrefLang={localeInfo[l].html}
              lang={localeInfo[l].html}
              data-locale={l}
              aria-current={l === locale ? "true" : undefined}
              tabIndex={open ? undefined : -1}
              onClick={choose(l)}
            >
              {localeInfo[l].name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
