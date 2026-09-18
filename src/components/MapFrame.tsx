"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Google's own map of the restaurant, and what to do when it is refused.
 *
 * The map is an embedded page, and plenty of browsers will not load one: an
 * in-app browser inside a chat app, a content blocker, a preview that serves
 * only the page's own files. The frame is then left standing — empty, and
 * still taking every tap meant for the map, so the guest is left with nothing.
 *
 * Telling the two apart from outside the frame is narrow work. Its document
 * cannot be read either way, loaded or not. What can be read, and what differs,
 * is how many frames are nested inside it: Google's map builds its own, so the
 * count rises above zero once the map is really there; a refused frame sits at
 * zero for good. So the count is watched for a few seconds — long enough that a
 * slow map is not mistaken for a refused one — and if it never rises, the frame
 * takes itself out of the way (sections.css). The plan of the streets beneath
 * it is a link, and one tap on it opens the restaurant on Google Maps.
 */
const FIRST_LOOK = 3000;
const AGAIN = 1200;
const GIVE_UP = 8000;

export default function MapFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [refused, setRefused] = useState(false);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let timer = 0, started = 0, seen = false, tried = false;

    const look = () => {
      let inside = 0;
      try {
        inside = frame.contentWindow?.length ?? 0;
      } catch {
        inside = 1;   // walled off entirely: that is another origin's page, so it arrived
      }
      if (inside > 0) return;                       // the map is there; leave it be
      if (Date.now() - started >= GIVE_UP) return setRefused(true);
      timer = window.setTimeout(look, AGAIN);
    };

    /* Only once the frame has been reached and has tried to fetch. The map is
       loaded lazily, so a frame still sitting below the fold holds nothing
       inside it — which looks exactly like a refused one. Judged on mounting,
       every guest who takes more than a few seconds to scroll down would find
       the map already given up on and put away. */
    const begin = () => {
      if (!seen || !tried || started) return;
      started = Date.now();
      timer = window.setTimeout(look, FIRST_LOOK);
    };
    const onLoad = () => { tried = true; begin(); };
    frame.addEventListener("load", onLoad);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      seen = true;
      begin();
    }, { rootMargin: "200px" });
    io.observe(frame);

    return () => {
      window.clearTimeout(timer);
      frame.removeEventListener("load", onLoad);
      io.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={ref}
      className={`visit__frame${refused ? " is-refused" : ""}`}
      src={src}
      title={title}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
