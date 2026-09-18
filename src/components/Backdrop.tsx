import { asset } from "@/lib/asset";

/**
 * The restaurant behind every page, held still behind the content and washed
 * almost to black. It shows at the top and bottom of the screen and not at
 * all through the middle, where the reading is.
 *
 * The photograph is the olive tree at the door at blue hour, on every screen
 * (the studio's choice, 2026-09-18). The empty curved counter is kept as well:
 * set WIDE to "counter" and screens wider than a phone held upright show it
 * instead, the browser choosing between the two (<source media>) before
 * anything downloads, so only one is ever fetched.
 *
 * One element, fixed to the screen, drawn once. There is no scroll listener,
 * no parallax and no animation; the page scrolls over it. It is decoration
 * only — hidden from screen readers, never a target for a tap or a selection.
 * The wash, the ground colour and how each picture is framed are in
 * globals.css (.backdrop); the files come from scripts/backdrop.mjs.
 */

/**
 * Which version: the photographs in their own colour, or in greyscale.
 * Both are built and kept (scripts/backdrop.mjs); this one word chooses.
 */
export const TONE: keyof typeof TONES = "colour";
/** What a screen wider than a phone held upright shows. */
export const WIDE: keyof typeof WIDE_PHOTO = "olive";

const TONES = { colour: "", grey: "-grey" } as const;
const WIDE_PHOTO = { olive: false, counter: true } as const;
const file = (photo: string, w: number, ext: string) => asset(`/photos/${photo}${TONES[TONE]}-${w}.${ext}`);
const olive = (ext: string) => file("backdrop-tall", 680, ext);
/** Wide screens show the olive tree twice its size, and there its brightest
    lights are held down so the small print keeps its contrast (backdrop.mjs). */
const oliveHeld = (ext: string) => file("backdrop-tall-held", 680, ext);
const LANDSCAPE = "(orientation: landscape)";

/** A phone held upright. Keep in step with the same query in globals.css. */
const TALL = "(max-width: 63.99rem) and (orientation: portrait)";
const counter = (ext: string) => `${file("backdrop", 1280, ext)} 1280w, ${file("backdrop", 2048, ext)} 2048w`;

export default function Backdrop() {
  const split = WIDE_PHOTO[WIDE];
  return (
    <div className={`backdrop ${split ? "backdrop--split" : "backdrop--olive"}`} aria-hidden="true">
      <picture>
        {/* The olive tree comes at its own size, 680 × 712, and no larger. */}
        {!split && <source media={LANDSCAPE} type="image/avif" srcSet={oliveHeld("avif")} />}
        {!split && <source media={LANDSCAPE} type="image/webp" srcSet={oliveHeld("webp")} />}
        {!split && <source media={LANDSCAPE} srcSet={oliveHeld("jpg")} />}
        <source media={split ? TALL : undefined} type="image/avif" srcSet={olive("avif")} />
        <source media={split ? TALL : undefined} type="image/webp" srcSet={olive("webp")} />
        {split && <source media={TALL} srcSet={olive("jpg")} />}
        {split && <source type="image/avif" srcSet={counter("avif")} sizes="100vw" />}
        {split && <source type="image/webp" srcSet={counter("webp")} sizes="100vw" />}
        <img
          className="backdrop__img"
          src={split ? file("backdrop", 2048, "jpg") : olive("jpg")}
          srcSet={split ? counter("jpg") : undefined}
          sizes={split ? "100vw" : undefined}
          alt=""
          width={split ? 2048 : 680}
          height={split ? 1165 : 712}
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
      </picture>
    </div>
  );
}
