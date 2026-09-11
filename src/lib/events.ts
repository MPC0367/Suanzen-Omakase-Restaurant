/* Page-wide requests between the menu's parts, so none of them has to reach
   into another: the advisor asks the menu to show a course, anything can ask
   for the reservation drawer. */

export const COURSE_EVENT = "suanzen:course";
export const RESERVE_EVENT = "suanzen:reserve";

/** Bring a course on the menu into view (and open it, on a desktop). */
export const showCourse = (id: string) =>
  window.dispatchEvent(new CustomEvent(COURSE_EVENT, { detail: { id } }));

/** Open the reservation drawer, for a course when there is one. */
export const openReserve = (course?: string) =>
  window.dispatchEvent(new CustomEvent(RESERVE_EVENT, { detail: { course } }));

/** A mouse that can hover: a desktop, where LINE's pre-filled chat can't open. */
export const hasPointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
