/**
 * The Chinese strings in the site's content, for verify-zh.mjs: the Latin
 * text the Chinese edition keeps on purpose (course names, Japanese dish
 * names without a settled Chinese form) is recognised by being one of these.
 */
import { dict } from "../src/content/dictionary.ts";
import { advisorCopy, advice, finder } from "../src/content/advisor.ts";
import { courses } from "../src/content/courses.ts";
import { restaurant } from "../src/content/restaurant.ts";
import { photos } from "../src/content/media.ts";
import { alaCarte } from "../src/content/alacarte.ts";

const strings = (v) =>
  typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : [];

/** Every value found under a "zh" key, anywhere inside. */
const underZh = (v) =>
  Array.isArray(v) ? v.flatMap(underZh)
    : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => (k === "zh" ? strings(x) : underZh(x)))
    : [];

export { dict };
export const advisorCopyZh = strings(advisorCopy.zh);
export const zhValues = [...underZh(advice), ...underZh(finder), ...underZh(courses), ...underZh(restaurant), ...underZh(photos), ...underZh(alaCarte)];
