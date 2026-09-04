# One-time extraction scripts

These are kept for provenance, not for re-running. They are how the menu, the
Thai copy and the 82 photographs in this site were derived — so if a price or a
dish name is ever questioned, the path back to its source is here.

| script | what it did |
|---|---|
| `harvest.mjs` | Pulled every embedded photograph and every menu fact out of the two earlier Suan Zen artifacts, keyed by the SHA of the image bytes so a picture appearing in both was stored once. |
| `gen-courses.mjs` | Generated `src/content/courses.ts` — courses, prices, dish lists, Thai strings — and attached a photograph to each dish, but only where a vision pass reported that photo as actually showing that dish. |
| `gen-media.mjs` | Generated `src/content/media.ts` — the catalogue, with each picture's category, warmth score and bilingual alt text. |

They read from paths that no longer exist (a Claude session cache and `/tmp`),
so they will not run as-is. The data they produced is committed.

Photographs also came from the restaurant's public Facebook and Instagram; those
were fetched in-session rather than by a script here.
