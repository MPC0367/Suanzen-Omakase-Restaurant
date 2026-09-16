"use client";

import { useEffect } from "react";

/**
 * Breath. Elements marked .reveal come in once, when they enter, and then
 * stay still — nothing re-animates on the way back up. Honours reduced motion
 * by simply marking everything visible.
 */
export function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .reveal-mask"));

    if (reduce) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    // Anything already on screen at first paint comes in on its own delay.
    // The observer's bottom margin is there to hold back content you have not
    // scrolled to yet — it must not strand the last line of the opening view.
    nodes.forEach((n) => {
      if (n.getBoundingClientRect().top < window.innerHeight) n.classList.add("is-in");
      else io.observe(n);
    });
    return () => io.disconnect();
  }, []);
}
