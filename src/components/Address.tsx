import { restaurant } from "@/content/restaurant";
import { pick, type Locale } from "@/content/dictionary";

/**
 * The restaurant's address in the page's language — and, on the Chinese page,
 * the English one under it. A taxi driver, Grab and a map search all match
 * the romanised address, and a Chinese guest will be showing it to one of
 * them; the district and soi have no settled Chinese names to match instead.
 */
export default function Address({ locale }: { locale: Locale }) {
  const a = restaurant.address;
  return (
    <>
      {pick(a.oneLine.value, locale)}
      {pick(a.romanisedBelow, locale) && (
        <span className="addr__latin" lang="en">{a.oneLine.value.en}</span>
      )}
    </>
  );
}
