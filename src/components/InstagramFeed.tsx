"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandPlate from "./BrandPlate";
import {
  posts as allPosts,
  permalink,
  usedCategories,
  formatPostDate,
  type Post,
  type PostCategory,
} from "@/content/instagram";
import { restaurant } from "@/content/restaurant";
import { getDict, type Locale } from "@/content/dictionary";

const Arrow = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Instagram's embed script ────────────────────────────────────────────────
   The posts belong to the restaurant and live on Instagram; the official embed
   is the supported way to show them, so the pictures stay current on their own
   and nothing is copied off the platform.

   Asking Instagram for a dozen at once gets you a dozen blank white frames: it
   serves them slowly and unevenly. So each post is embedded only once it comes
   near the viewport, which staggers the requests naturally as someone scrolls
   and keeps the number in flight small. Anything that still fails to arrive
   falls back to a tile of our own artwork with the date, the category and a
   link — a card that says something true rather than an empty white box. */
declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let scriptState: "idle" | "loading" | "ready" | "failed" = "idle";
const waiting: Array<(ok: boolean) => void> = [];

function loadEmbedScript(): Promise<boolean> {
  if (scriptState === "ready") return Promise.resolve(true);
  if (scriptState === "failed") return Promise.resolve(false);
  return new Promise((resolve) => {
    waiting.push(resolve);
    if (scriptState === "loading") return;
    scriptState = "loading";

    const done = (ok: boolean) => {
      scriptState = ok ? "ready" : "failed";
      waiting.splice(0).forEach((fn) => fn(ok));
    };

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    s.onload = () => done(Boolean(window.instgrm));
    s.onerror = () => done(false);
    window.setTimeout(() => { if (scriptState === "loading") done(false); }, 8000);
    document.body.appendChild(s);
  });
}

/* ── An archive entry, laid out by us ─────────────────────────────────────── */
function ArchiveTile({ post, locale, index }: { post: Post; locale: Locale; index: number }) {
  const t = getDict(locale);
  const url = permalink(post);
  const tone = (["night", "dusk", "ember", "dawn"] as const)[index % 4];
  const says = locale === "th" ? post.saysTh : post.saysEn;

  return (
    <a className="tile" href={url} target="_blank" rel="noopener noreferrer">
      <span className="tile__art">
        <BrandPlate
          seed={`ig-${post.code}`}
          tone={tone}
          motif={
            post.category === "garden" ? "garden" : post.category === "courses" ? "plate" : "counter"
          }
          ratio={1}
        />
        {post.type === "video" && (
          <span className="tile__play" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="16" stroke="currentColor" strokeWidth="1" />
              <path d="M13.6 11.4l9.4 5.6-9.4 5.6V11.4z" fill="currentColor" />
            </svg>
          </span>
        )}
      </span>

      <span className="tile__body">
        <span className="tile__meta">
          <time className="tile__date u-numeral" dateTime={post.date}>
            {formatPostDate(post.date, locale)}
          </time>
          <span className="tile__cat u-label">{t.journal.categories[post.category]}</span>
        </span>
        {/* Only ever what Instagram itself says the post shows — and nothing
            at all where it says nothing, rather than a row of placeholders. */}
        {says && <span className="tile__says">{says}</span>}
        <span className="tile__go link-arrow">
          {t.journal.openOnInstagram} <Arrow />
        </span>
      </span>
    </a>
  );
}

/* ── A live post, straight from Instagram ─────────────────────────────────── */
function LivePost({
  post, locale, lazy = false, index = 0,
}: { post: Post; locale: Locale; lazy?: boolean; index?: number }) {
  const t = getDict(locale);
  const host = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLElement>(null);
  const [state, setState] = useState<"loading" | "embedded" | "fallback">("loading");
  /* A lazy post holds its blockquote back until it is worth asking for.
     Instagram's process() sweeps every blockquote on the page at once, so
     what staggers the requests is when each one enters the DOM, not when
     process() is called. */
  const [armed, setArmed] = useState(!lazy);
  const url = permalink(post);

  useEffect(() => {
    if (armed) return;
    const el = shell.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setArmed(true); return; }
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setArmed(true); io.disconnect(); } },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  useEffect(() => {
    if (!armed) return;
    let stop = false;
    loadEmbedScript().then((ok) => {
      if (stop) return;
      if (!ok) { setState("fallback"); return; }
      window.instgrm?.Embeds.process();

      const started = Date.now();
      const tick = window.setInterval(() => {
        if (stop || !host.current) { window.clearInterval(tick); return; }
        if (host.current.querySelector("iframe")) {
          window.clearInterval(tick);
          setState("embedded");
        } else if (Date.now() - started > 10000) {
          window.clearInterval(tick);
          setState("fallback");
        } else {
          window.instgrm?.Embeds.process();
        }
      }, 500);
    });
    return () => { stop = true; };
  }, [armed]);

  return (
    <article className={`live live--${state}`} ref={shell}>
      <div className="live__frame" ref={host}>
        {armed && state !== "fallback" ? (
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            data-instgrm-captioned
            style={{ margin: 0, minWidth: 0, width: "100%" }}
          />
        ) : (
          <ArchiveTile post={post} locale={locale} index={index} />
        )}
      </div>
      {state === "embedded" && (
        <a className="link-arrow live__link" href={url} target="_blank" rel="noopener noreferrer">
          {t.journal.openOnInstagram} <Arrow />
        </a>
      )}
    </article>
  );
}

/**
 * The three pinned posts on their own — what the home page shows. They are the
 * real embeds rather than photographs of ours dressed up to look like them:
 * most of the archive was shot for the restaurant or came off Facebook, so an
 * Instagram handle over one would be saying something untrue.
 */
export function LiveStrip({ locale }: { locale: Locale }) {
  const featured = useMemo(() => allPosts.filter((p) => p.pinned).slice(0, 3), []);
  return (
    <div className="livestrip livestrip--teaser">
      {featured.map((p, i) => (
        <LivePost key={p.code} post={p} locale={locale} index={i} lazy />
      ))}
    </div>
  );
}

/* ── The page's feed ──────────────────────────────────────────────────────── */
export default function InstagramFeed({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [filter, setFilter] = useState<PostCategory | "all">("all");

  const featured = useMemo(() => allPosts.filter((p) => p.pinned).slice(0, 3), []);
  const archive = useMemo(() => allPosts.filter((p) => !p.pinned), []);

  const shown = useMemo(
    () => (filter === "all" ? archive : archive.filter((p) => p.category === filter)),
    [filter, archive],
  );

  const archiveCats = useMemo(
    () => usedCategories.filter((c) => archive.some((p) => p.category === c)),
    [archive],
  );

  const pick = useCallback((c: PostCategory | "all") => setFilter(c), []);

  return (
    <>
      {/* The three the restaurant has pinned, live from Instagram. */}
      <section className="livestrip" aria-label={t.journal.label}>
        {featured.map((p) => (
          <LivePost key={p.code} post={p} locale={locale} />
        ))}
      </section>

      <div className="igbar">
        <div className="igbar__tabs" role="tablist" aria-label={t.journal.label}>
          <button
            role="tab"
            aria-selected={filter === "all"}
            className={`igtab ${filter === "all" ? "is-on" : ""}`}
            onClick={() => pick("all")}
          >
            {t.journal.all}
            <span className="igtab__n u-numeral">{archive.length}</span>
          </button>
          {archiveCats.map((c) => {
            const n = archive.filter((p) => p.category === c).length;
            return (
              <button
                key={c}
                role="tab"
                aria-selected={filter === c}
                className={`igtab ${filter === c ? "is-on" : ""}`}
                onClick={() => pick(c)}
              >
                {t.journal.categories[c]}
                <span className="igtab__n u-numeral">{n}</span>
              </button>
            );
          })}
        </div>

        <p className="igbar__count" aria-live="polite">
          {t.journal.showing} <span className="u-numeral">{shown.length}</span> {t.journal.entries}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="ig__empty">{t.journal.empty}</p>
      ) : (
        <div className="iggrid">
          {shown.map((p, i) => (
            <LivePost key={p.code} post={p} locale={locale} index={i} lazy />
          ))}
        </div>
      )}

      <div className="ig__tail">
        <p className="u-lede">{t.journal.followLine}</p>
        <a className="btn" href={restaurant.social.instagram.value} target="_blank" rel="noopener noreferrer">
          {t.cta.viewInstagram} <Arrow />
        </a>
      </div>
    </>
  );
}
