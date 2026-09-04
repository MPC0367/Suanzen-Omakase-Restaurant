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

/**
 * The site moves from the garden at night into the counter in daylight and
 * back out again. Sections declare which world they belong to; the body
 * follows whichever one currently owns the viewport.
 */
export function useWorld() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section-world]"));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) {
          const w = (top.target as HTMLElement).dataset.sectionWorld;
          if (w) document.documentElement.setAttribute("data-world", w);
        }
      },
      { threshold: [0.32, 0.6], rootMargin: "-18% 0px -34% 0px" },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
}
