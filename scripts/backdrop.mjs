/**
 * The page's background photographs. On a wide screen, the empty curved
 * counter, which the restaurant supplied (public/photos/78893251dcbe.jpg,
 * 2048 × 1365). On a phone held upright, the olive tree at the door at blue
 * hour (src/assets/backdrop/olive-dusk.jpg, 680 × 1020), which the studio
 * supplied on 2026-09-18 — kept out of public/ because it carries the
 * restaurant's watermark, which is cropped off here.
 *
 *   node scripts/backdrop.mjs
 *
 * writes public/photos/backdrop-{1280,2048}.{avif,webp,jpg} (the counter) and
 * backdrop-tall-680.{avif,webp,jpg} (the olive tree), and each again in
 * greyscale (backdrop-grey-…, backdrop-tall-grey-…): two versions for the
 * restaurant to choose between, both kept (the switch is TONE in
 * src/components/Backdrop.tsx).
 *
 * Both photographs carry the restaurant's seal as a watermark in the top
 * corner, which would otherwise sit faintly on every page opposite the real
 * one in the header, so each is cropped from below it: the counter loses its
 * top 200 rows (2048 × 1165 is left, close to a 16:9 screen); the olive tree
 * is framed on the tree itself, 680 × 712, well clear of the seal.
 *
 * Never larger than the original — the 2048 and the 680 are the photographs at
 * their own size, and the 1280 is the counter for smaller screens. Only about a third of it ever shows
 * through the dark wash laid over it (Backdrop.tsx), so it is compressed
 * harder than a photograph that is looked at.
 *
 * Its highlights are held down. Text runs over the room at the top and bottom
 * of the screen, and the downlights and the lit counter edge, even through the
 * wash, sat too bright behind the page's quieter greys: 2.1:1 behind the
 * smallest print, where 4.5:1 is the floor. Any pixel brighter than 90 of 255
 * is brought down to a tenth of its rise above that, keeping its hue, so the
 * room keeps its shape and warmth and loses only its glare; qa/verify-zh.mjs checks every text colour against
 * the brightest part of it, at four screen sizes.
 *
 * The files live in /photos/ so robots.txt keeps them out of image search
 * like every other photograph on the site.
 */
import sharp from "sharp";

const PHOTOS = [
  { name: "backdrop", src: "public/photos/78893251dcbe.jpg", size: [2048, 1365],
    crop: { left: 0, top: 200, width: 2048, height: 1165 }, widths: [1280, 2048] },
  // The olive tree is used as the studio supplied it — only the seal cropped
  // off, its light left alone (2026-09-18): held down, it no longer read as
  // the picture. Its bright canopy then sits behind the top of the page; see
  // the contrast check in qa/verify-zh.mjs.
  // Framed as the studio marked it (2026-09-18): the full width, from the lit
  // door on the left to the willow on the right, and from just above the
  // canopy to just below the planter — the tree whole, rather than sky and
  // asphalt. The seal (rows 12–97) is well above the crop.
  { name: "backdrop-tall", src: "src/assets/backdrop/olive-dusk.jpg", size: [680, 1020],
    crop: { left: 0, top: 148, width: 680, height: 712 }, widths: [680], asSupplied: true },
  // The same, for wide screens. There the picture is shown twice its size and
  // the lit door and planter lights fall in the bottom band, where they sat too
  // bright behind the small print (3:1). Only light above 100 of 255 is held
  // down, keeping its hue; phones and upright tablets keep the photograph as
  // supplied, which holds 4.5:1 there as it is.
  { name: "backdrop-tall-held", src: "src/assets/backdrop/olive-dusk.jpg", size: [680, 1020],
    crop: { left: 0, top: 148, width: 680, height: 712 }, widths: [680], hold: [100, 0.15] },
];
const KNEE = 90, SLOPE = 0.1;   // the counter's; a photo can set its own as hold: [knee, slope]
/* The hold is on each pixel's brightness (its highest channel), and all three
   channels are scaled by the same amount, so a colour keeps its hue: held
   channel by channel, the blue of the sky ran down faster than its green and
   came out teal. */
const holdPixels = (rgb, [knee, slope] = [KNEE, SLOPE]) => {
  const out = Buffer.alloc(rgb.length);
  for (let i = 0; i < rgb.length; i += 3) {
    const v = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]);
    const k = v > knee ? (knee + (v - knee) * slope) / v : 1;
    out[i] = Math.round(rgb[i] * k); out[i + 1] = Math.round(rgb[i + 1] * k); out[i + 2] = Math.round(rgb[i + 2] * k);
  }
  return out;
};

for (const photo of PHOTOS) {
  const meta = await sharp(photo.src).metadata();
  if (meta.width !== photo.size[0] || meta.height !== photo.size[1]) {
    throw new Error(`${photo.src} is ${meta.width} × ${meta.height}, not the ${photo.size.join(" × ")} its crop was set for.`);
  }
  const { data, info } = await sharp(photo.src).extract(photo.crop).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const held = sharp(photo.asSupplied ? data : holdPixels(data, photo.hold), { raw: { width: info.width, height: info.height, channels: 3 } });

  for (const tone of ["colour", "grey"]) for (const w of photo.widths) {
    if (w > photo.crop.width) throw new Error(`Refusing to upscale ${photo.src} to ${w}px.`);
    const sized = held.clone().resize({ width: w, withoutEnlargement: true });
    // Greyscale by luminance, so the grey keeps the colour version's light and dark.
    const base = tone === "grey" ? sized.greyscale() : sized;
    const out = `public/photos/${photo.name}${tone === "grey" ? "-grey" : ""}-${w}`;
    const done = await Promise.all([
      base.clone().avif({ quality: 42, effort: 6 }).toFile(`${out}.avif`),
      base.clone().webp({ quality: 58, effort: 6 }).toFile(`${out}.webp`),
      base.clone().jpeg({ quality: 66, mozjpeg: true, progressive: true }).toFile(`${out}.jpg`),
    ]);
    for (const [ext, info] of [["avif", done[0]], ["webp", done[1]], ["jpg", done[2]]]) {
      console.log(`${out}.${ext}  ${info.width} × ${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
    }
  }
}
