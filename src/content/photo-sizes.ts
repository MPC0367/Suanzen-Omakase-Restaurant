/**
 * The size of each dish photograph, in pixels (width, height), measured from
 * the files in public/photos. With it a photograph opening under its dish takes
 * its true height at once, so nothing below jumps when the picture arrives, and
 * a phone knows how tall it will be before it opens, to land it in the middle
 * of the screen. Add a line here when a dish gets a photograph.
 */
const sizes: Record<string, [number, number]> = {
  "/photos/12aae199fdf8.jpg": [1200, 1096],
  "/photos/17dd4959b0e0.jpg": [1080, 719],
  "/photos/1f365022e967.jpg": [1365, 909],
  "/photos/2ff8db8e9a7f.jpg": [1100, 732],
  "/photos/366b3e424e05.jpg": [1100, 1377],
  "/photos/389c22685003.jpg": [1080, 719],
  "/photos/5138120a936b.jpg": [900, 1200],
  "/photos/66f4b170541c.jpg": [1100, 733],
  "/photos/af2e9571bac6.jpg": [900, 1200],
  "/photos/b33e821d05b5.jpg": [1080, 719],
  "/photos/b6e6bff9bdd4.jpg": [1100, 733],
  "/photos/e55b74c7148c.jpg": [1100, 733],
};

/** Height ÷ width of a photograph; 4:3 for one not measured yet. */
export const photoRatio = (src: string) => {
  const s = sizes[src];
  return s ? s[1] / s[0] : 0.75;
};
