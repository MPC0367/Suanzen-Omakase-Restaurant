/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE COURSES — the full menu
 * ─────────────────────────────────────────────────────────────────────────────
 *  Where this comes from, most authoritative first:
 *
 *  - The restaurant's own Facebook post on Zen Kids (6 July, shown to the
 *    studio on 2026-09-19): its current nine bites, ages 7–11 and 1,290++.
 *    It replaces the 2024 post's Kids list below.
 *  - The restaurant's own Facebook post on Zen Ichi (6 July, shown to the
 *    studio on 2026-09-19): its current fourteen bites, in order, for "older
 *    children or those with smaller appetites", 2,000++. It replaces the 2024
 *    post's Ichi list below. The same day's post opens the new season from
 *    13 July 2026.
 *  - The restaurant's own post on Zen Sweet (shown to the studio on
 *    2026-09-19): three menus, Zen Sweet A, B and C, of five pieces each, in
 *    the order listed here; 1,890++; booking two days ahead.
 *  - The restaurant's own Facebook post "5 Courses available at Suan Zen
 *    Omakase" (facebook.com/omakase.suanzen, 2024-09-06): the price, item count
 *    and full dish list of Ni, San and Yon; Kids for ages 7–11;
 *    Yon "specifically for meat lovers", Kagoshima and Saga wagyu.
 *  - The studio brief (2026-09-11): Zen Ichi recommended for ages 12–14, and
 *    Ni, San, Boss and Yon as adult courses.
 *  - The two earlier Suan Zen builds: the dish lists shown here for Ni, San and
 *    Yon (they differ from the 2024 post in places, and nobody has said which
 *    is current), and everything about Zen Boss, which the 2024 post does not
 *    mention.
 *
 *  Copy states only what those sources support. Where a description says what
 *  a course is mostly made of, that is counted from its own dish list here.
 *  Open questions for the restaurant live in src/content/OPEN-QUESTIONS.md.
 *
 *  `photo` on a dish, and a course's `photos`, hold only pictures that show
 *  that dish or a dish on that course's list. Pictures of another course's
 *  dish, of raw ingredients with words burned in, or of a guest's name card
 *  have been taken out.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { L10n, Locale } from "./dictionary";

/** A name in every language that has one. Chinese is required; Thai is not —
    the dishes have no Thai names yet (OPEN-QUESTIONS.md), so a Thai page shows
    the English, as it always has. */
export type Named = { en: string; th?: string; zh: string };

/** The name to show: this language's, or the English where Thai has none. */
export const named = (n: Named, locale: Locale): string => n[locale] ?? n.en;

export type Dish = {
  name: Named;
  /** Path under /public. Undefined when no photograph shows this dish. */
  photo?: string;
};

export type SweetMenu = { label: L10n; dishes: Dish[] };

export type Course = {
  id: string;
  slug: string;
  key: string;
  index: string;
  /** The course's own name — the same in every language. */
  name: L10n;
  kanji: string;
  /** Baht, before ++. */
  price: number;
  count: number;
  unit: L10n;
  desc: L10n;
  forWho: L10n;
  listLabel: L10n;
  /** True when the published list is a selection, not the whole course. */
  listIsPartial: boolean;
  /** The one picture the restaurant has sent for this course, with the size it
      was measured at, so it takes its own height before it loads. Shown at the
      top of the course's own page, and in the menu where the course has no
      gallery. A course without one shows no picture: none is borrowed from
      another course. */
  sample?: { src: string; w: number; h: number };
  /** The restaurant's photographs of this course's own dishes, in the order
      they are served. `n` is the dish's place on the list; `caption` is the
      restaurant's own name for the dish, taken from the file it sent. */
  gallery?: { src: string; w: number; h: number; caption: Named; n?: number }[];
  photos: string[];
  dishes?: Dish[];
  /** Zen Sweet is three fixed menus rather than one sequence. */
  menus?: SweetMenu[];
  active?: boolean;
};

export const courses: Course[] = [
  {
    id: "zen-kids",
    slug: "zen-kids",
    key: "kids",
    index: "01",
    name: { en: "Zen Kids", th: "เซน คิดส์", zh: "Zen Kids" },
    kanji: "子",
    price: 1290,
    count: 9,
    unit: { en: "bites", th: "คำ", zh: "品" },
    desc: {
      en: "Suan Zen's course for younger diners, recommended for ages 7–11. Nine bites: fresh yuzu juice, tamago with foie gras, salmon, madai sushi, gunkan maki, Suan Zen somen, ebi tempura, osuimono soup, and chocolate lava or panna cotta to finish.",
      th: "คอร์สของสวน เซน สำหรับน้อง ๆ แนะนำสำหรับอายุ 7–11 ปี มีทั้งหมด 9 คำ ตั้งแต่น้ำยูซุคั้นสด ทามาโกะกับฟัวกราส์ แซลมอน ซูชิมาได และกุนกันมากิ ไปจนถึงโซเมนของสวน เซน กุ้งเทมปุระ ซุปโอสุยโมโนะ และปิดท้ายด้วยช็อกโกแลตลาวาหรือพานาคอตต้า",
      zh: "Suan Zen 为小朋友准备的套餐，建议7–11岁享用。共 9 品：鲜榨日本柚子汁、嫩滑蛋羹配鹅肝、三文鱼、真鲷寿司、军舰寿司、Suan Zen 日式素面、炸虾天妇罗、日式清汤，最后以流心巧克力熔岩蛋糕或意式奶冻收尾。",
    },
    forWho: { en: "FOR YOUNGER DINERS · AGES 7–11", th: "สำหรับน้อง ๆ อายุ 7–11 ปี", zh: "儿童套餐 · 适合7–11岁" },
    listLabel: { en: "ALL NINE, IN ORDER", th: "ครบทั้ง 9 คำ ตามลำดับเสิร์ฟ", zh: "全部 9 品，依上菜顺序" },
    listIsPartial: false,
    sample: { src: "/photos/4cb2edf859a5.jpg", w: 954, h: 802 },
    gallery: [
      {
        src: "/photos/156452580769.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Yawarakai Tamago with Foie Gras", zh: "嫩滑蛋羹配鹅肝" },
        n: 2,
      },
      {
        src: "/photos/94676661bd34.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Gunkan Maki", zh: "军舰寿司" },
        n: 5,
      },
      {
        src: "/photos/bf42da43fec5.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Ebi Tempura", zh: "炸虾天妇罗" },
        n: 7,
      },
    ],
    photos: [],
    dishes: [
      { name: { en: "Fresh yuzu juice", zh: "鲜榨日本柚子汁" } },
      { name: { en: "Yawarakai tamago with foie gras", zh: "嫩滑蛋羹配鹅肝" } },
      { name: { en: "Namazakana (salmon)", zh: "生三文鱼 (namazakana)" } },
      { name: { en: "Madai sushi", zh: "真鲷寿司 (madai)" } },
      { name: { en: "Gunkan maki", zh: "军舰寿司" } },
      { name: { en: "Suan Zen somen", zh: "Suan Zen 素面 (somen)" } },
      { name: { en: "Ebi tempura", zh: "炸虾天妇罗" } },
      { name: { en: "Osuimono soup", zh: "日式清汤 (osuimono)" } },
      { name: { en: "Zen of Choc melted lava / panna cotta raspberry / panna cotta passion fruit", zh: "Zen of Choc 流心巧克力熔岩蛋糕／覆盆子意式奶冻／百香果意式奶冻" } },
    ],
  },
  {
    id: "zen-ichi",
    slug: "zen-ichi",
    key: "ichi",
    index: "02",
    name: { en: "Zen Ichi", th: "เซน อิจิ", zh: "Zen Ichi" },
    kanji: "一",
    price: 2000,
    count: 14,
    unit: { en: "bites", th: "คำ", zh: "品" },
    desc: {
      en: "Recommended for diners aged 12–14, as the step between Zen Kids and the adult courses, and for anyone with a smaller appetite. Fourteen bites, mostly fish and seafood — madai, salmon, kampachi and chūtoro sushi, hotate yaki, kisu tempura, hotaru ika — with one wagyu sushi, and chocolate lava or panna cotta to finish.",
      th: "แนะนำสำหรับอายุ 12–14 ปี เป็นก้าวต่อจาก เซน คิดส์ ก่อนถึงคอร์สของผู้ใหญ่ และยังเหมาะกับผู้ที่ทานได้ไม่เยอะ มีทั้งหมด 14 คำ ส่วนใหญ่เป็นปลาและอาหารทะเล เช่น ซูชิมาได แซลมอน คัมปาจิ ชูโทโร่ โฮตาเตะย่าง คิสุเทมปุระ และโฮตารุอิกะ มีวากิวซูชิหนึ่งคำ และปิดท้ายด้วยช็อกโกแลตลาวาหรือพานาคอตต้า",
      zh: "建议12–14岁的客人享用，是 Zen Kids 与成人套餐之间的过渡，也适合食量较小的客人。共 14 品，以鱼类和海鲜为主——真鲷、三文鱼、间八与中腹寿司，以及烤帆立贝、沙钻鱼天妇罗和萤火鱿——另有 1 品和牛寿司，最后以流心巧克力熔岩蛋糕或意式奶冻收尾。",
    },
    forWho: { en: "RECOMMENDED FOR AGES 12–14", th: "แนะนำสำหรับอายุ 12–14 ปี", zh: "建议12–14岁享用" },
    listLabel: { en: "ALL FOURTEEN, IN ORDER", th: "ครบทั้ง 14 คำ ตามลำดับเสิร์ฟ", zh: "全部 14 品，依上菜顺序" },
    listIsPartial: false,
    sample: { src: "/photos/3d4a8203a842.jpg", w: 1170, h: 1171 },
    gallery: [
      {
        src: "/photos/aec0bdeb54b6.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Suan Zen Sashimi(2 kinds of fish)", zh: "Suan Zen 刺身（2 种鱼）" },
        n: 2,
      },
      {
        src: "/photos/8d06e9f82552.jpg",
        w: 1400,
        h: 932,
        caption: { en: "Inaniwa Kani Miso", zh: "稻庭蟹味噌" },
        n: 9,
      },
      {
        src: "/photos/5a127c51695b.jpg",
        w: 933,
        h: 1400,
        caption: { en: "Tempura Temaki", zh: "天妇罗手卷" },
        n: 10,
      },
    ],
    photos: ["/photos/b6e6bff9bdd4.jpg", "/photos/b63e98c7df99.jpg"],
    dishes: [
      { name: { en: "Mozuku junsai", zh: "海蕴与莼菜" } },
      { name: { en: "Suan Zen sashimi (2 kinds of fish)", zh: "Suan Zen 刺身（2 种鱼）" }, photo: "/photos/b6e6bff9bdd4.jpg" },
      { name: { en: "Madai sushi", zh: "真鲷寿司 (madai)" } },
      { name: { en: "Sake (salmon sushi)", zh: "三文鱼寿司" } },
      { name: { en: "Kampachi sushi", zh: "间八寿司 (kampachi)" } },
      { name: { en: "Hotate yaki", zh: "烤帆立贝" } },
      { name: { en: "Chūtoro sushi", zh: "中腹寿司 (chūtoro)" } },
      { name: { en: "Kisu tempura", zh: "沙钻鱼天妇罗 (kisu)" } },
      { name: { en: "Inaniwa kani miso", zh: "稻庭蟹味噌" } },
      { name: { en: "Tempura temaki", zh: "天妇罗手卷" } },
      { name: { en: "Hotaru ika with goma-ae", zh: "萤火鱿配芝麻拌菜 (goma-ae)" } },
      { name: { en: "Wagyu sushi", zh: "和牛寿司" } },
      { name: { en: "Kani miso soup", zh: "蟹味噌汤" } },
      { name: { en: "Zen of Choc melted lava / panna cotta raspberry / panna cotta passion fruit", zh: "Zen of Choc 流心巧克力熔岩蛋糕／覆盆子意式奶冻／百香果意式奶冻" } },
    ],
  },
  {
    id: "zen-ni",
    slug: "zen-ni",
    key: "ni",
    index: "03",
    name: { en: "Zen Ni", th: "เซน นิ", zh: "Zen Ni" },
    kanji: "二",
    price: 2890,
    count: 16,
    unit: { en: "bites", th: "คำ", zh: "品" },
    desc: {
      en: "The restaurant calls it a course that brings happiness: sixteen bites built on ingredients that are hard to find. Mostly fish and seafood — chūtoro and ōtoro, uni, unagi — with one wagyu bite.",
      th: "ทางร้านบอกว่าเป็นคอร์สที่ให้ความสุข มี 16 คำจากวัตถุดิบที่หาไม่ง่าย ส่วนใหญ่เป็นปลาและอาหารทะเล เช่น ชูโทโร่ โอโทโร่ อูนิ และอุนางิ มีวากิวหนึ่งคำ",
      zh: "餐厅说，这是一款能带来幸福感的套餐：共 16 品，选用不易寻得的食材。以鱼类和海鲜为主——中腹与大腹、海胆、鳗鱼——另有 1 品和牛。",
    },
    forWho: {
      en: "ADULT COURSE · MOSTLY FISH & SEAFOOD",
      th: "คอร์สผู้ใหญ่ · เน้นปลาและอาหารทะเล",
      zh: "成人套餐 · 以鱼类和海鲜为主",
    },
    listLabel: { en: "ALL SIXTEEN, IN ORDER", th: "ครบทั้ง 16 คำ ตามลำดับเสิร์ฟ", zh: "全部 16 品，依上菜顺序" },
    listIsPartial: false,
    sample: { src: "/photos/249c7c8c7528.jpg", w: 870, h: 885 },
    gallery: [
      {
        src: "/photos/183e0d616253.jpg",
        w: 933,
        h: 1400,
        caption: { en: "Zuwai Kani", zh: "松叶蟹 (zuwai kani)" },
        n: 10,
      },
      {
        src: "/photos/fcd81e5d4a73.jpg",
        w: 933,
        h: 1400,
        caption: { en: "Fine Dine Taraba", zh: "Fine-dine 帝王蟹 (taraba)" },
        n: 13,
      },
      {
        src: "/photos/1e4f3ccfe38d.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Wagyu Special", zh: "特色和牛" },
        n: 14,
      },
    ],
    photos: [
      "/photos/ee3160d17d48.jpg",
      "/photos/17dd4959b0e0.jpg",
      "/photos/12aae199fdf8.jpg",
      "/photos/f26846b90108.jpg",
      "/photos/cac0b51e64fe.jpg",
      "/photos/ea8212d3faff.jpg",
    ],
    dishes: [
      { name: { en: "Hotate mozuku junsai", zh: "帆立贝配海蕴与莼菜" } },
      { name: { en: "Suan Zen sashimi — 3 kinds of fish", zh: "Suan Zen 刺身（3 种鱼）" } },
      { name: { en: "Hirame sushi", zh: "比目鱼寿司 (hirame)" } },
      { name: { en: "Kampachi sushi", zh: "间八寿司 (kampachi)" } },
      { name: { en: "Shima-aji sushi", zh: "缟鲹寿司 (shima-aji)" } },
      { name: { en: "Ama ebi sushi", zh: "甜虾寿司" } },
      { name: { en: "Hotate yaki", zh: "烤帆立贝" } },
      {
        name: { en: "Chūtoro sushi · fresh truffle", zh: "中腹寿司 (chūtoro) · 新鲜松露" },
        photo: "/photos/12aae199fdf8.jpg",
      },
      { name: { en: "Ōtoro sushi · binchotan", zh: "大腹寿司 (ōtoro) · 备长炭" } },
      { name: { en: "Zuwai kani", zh: "松叶蟹 (zuwai kani)" }, photo: "/photos/17dd4959b0e0.jpg" },
      { name: { en: "Uni shokupan", zh: "海胆吐司" }, photo: "/photos/366b3e424e05.jpg" },
      { name: { en: "Unagi temaki", zh: "鳗鱼手卷" } },
      { name: { en: "Fine-dine taraba", zh: "Fine-dine 帝王蟹 (taraba)" } },
      { name: { en: "Wagyu special", zh: "特色和牛" } },
      { name: { en: "Osuimono soup", zh: "清汤 (osuimono)" } },
      {
        name: {
          en: "Choc melted lava · panna cotta raspberry or passion fruit",
          zh: "流心巧克力熔岩蛋糕 · 覆盆子或百香果意式奶冻",
        },
      },
    ],
  },
  {
    id: "zen-san",
    slug: "zen-san",
    key: "san",
    index: "04",
    name: { en: "Zen San", th: "เซน ซัง", zh: "Zen San" },
    kanji: "三",
    price: 3890,
    count: 17,
    unit: { en: "bites", th: "คำ", zh: "品" },
    desc: {
      en: "Seventeen bites, the most of any course. The restaurant calls it its “fine” course, where Western and Eastern flavours meet. Mostly fish and seafood — kinmedai, akami, ōtoro, uni, amadai — with one wagyu bite.",
      th: "17 คำ มากที่สุดในทุกคอร์ส ทางร้านเรียกว่าคอร์ส “ไฟน์” ที่รสชาติตะวันตกและตะวันออกมาบรรจบกัน ส่วนใหญ่เป็นปลาและอาหารทะเล เช่น คินเมได อากามิ โอโทโร่ อูนิ และอามาได มีวากิวหนึ่งคำ",
      zh: "共 17 品，是所有套餐中最多的。餐厅称它为“fine”套餐，东西方风味在此交汇。以鱼类和海鲜为主——金目鲷、赤身、大腹、海胆、甘鲷——另有 1 品和牛。",
    },
    forWho: {
      en: "ADULT COURSE · MOSTLY FISH & SEAFOOD",
      th: "คอร์สผู้ใหญ่ · เน้นปลาและอาหารทะเล",
      zh: "成人套餐 · 以鱼类和海鲜为主",
    },
    listLabel: { en: "ALL SEVENTEEN, IN ORDER", th: "ครบทั้ง 17 คำ ตามลำดับเสิร์ฟ", zh: "全部 17 品，依上菜顺序" },
    listIsPartial: false,
    sample: { src: "/photos/4ec2522c1b09.jpg", w: 870, h: 886 },
    gallery: [
      {
        src: "/photos/ab5c9f7939ed.jpg",
        w: 933,
        h: 1400,
        caption: { en: "Botan Ebi Sushi", zh: "牡丹虾寿司" },
        n: 6,
      },
      {
        src: "/photos/3eb0559a8b3d.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Otoro Sushi with Binchotan", zh: "大腹寿司 (ōtoro) · 备长炭" },
        n: 9,
      },
      {
        src: "/photos/626b8dae4d32.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Wagyu Sushi", zh: "和牛寿司" },
        n: 10,
      },
      {
        src: "/photos/ca803f4f866f.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Fine Dine Amadai", zh: "Fine-dine 甘鲷 (amadai)" },
        n: 12,
      },
    ],
    photos: [
      "/photos/1f365022e967.jpg",
      "/photos/42a586ebc854.jpg",
      "/photos/5138120a936b.jpg",
      "/photos/0290e94ce2e9.jpg",
      "/photos/e55b74c7148c.jpg",
    ],
    dishes: [
      { name: { en: "Hotate mozuku junsai", zh: "帆立贝配海蕴与莼菜" } },
      { name: { en: "Suan Zen sashimi — 3 kinds of fish", zh: "Suan Zen 刺身（3 种鱼）" } },
      { name: { en: "Kinmedai sushi", zh: "金目鲷寿司 (kinmedai)" } },
      { name: { en: "Hirame sushi", zh: "比目鱼寿司 (hirame)" } },
      { name: { en: "Shima-aji sushi", zh: "缟鲹寿司 (shima-aji)" } },
      { name: { en: "Botan ebi sushi", zh: "牡丹虾寿司" } },
      { name: { en: "Hotate yaki", zh: "烤帆立贝" } },
      { name: { en: "Dry-aged akami sushi", zh: "干式熟成赤身寿司 (akami)" } },
      { name: { en: "Ōtoro sushi · binchotan", zh: "大腹寿司 (ōtoro) · 备长炭" } },
      { name: { en: "Wagyu sushi", zh: "和牛寿司" } },
      { name: { en: "Negitoro · Inaniwa ponzu", zh: "葱花金枪鱼 (negitoro) · 稻庭橙醋" } },
      {
        name: { en: "Fine-dine amadai", zh: "Fine-dine 甘鲷 (amadai)" },
        photo: "/photos/1f365022e967.jpg",
      },
      { name: { en: "Hotaru tempura", zh: "Hotaru 天妇罗" } },
      { name: { en: "Uni handroll", zh: "海胆手卷" }, photo: "/photos/5138120a936b.jpg" },
      {
        name: { en: "Foie gras designed by Suan Zen", zh: "Suan Zen 特制鹅肝" },
        photo: "/photos/af2e9571bac6.jpg",
      },
      { name: { en: "Rubin soup", zh: "Rubin 汤" } },
      {
        name: {
          en: "Matcha mousse · raspberry mousse or choc tiramisu shot",
          zh: "抹茶慕斯 · 覆盆子慕斯或巧克力提拉米苏杯",
        },
      },
    ],
  },
  {
    id: "zen-boss",
    slug: "zen-boss",
    key: "boss",
    index: "05",
    name: { en: "Zen Boss", th: "เซน บอส", zh: "Zen Boss" },
    kanji: "将",
    price: 3890,
    count: 12,
    unit: { en: "bites", th: "คำ", zh: "品" },
    desc: {
      en: "Twelve bites: sashimi, sushi from kampachi to ōtoro, botan ebi and an uni handroll. Two bites are yours to choose — Wagyu Sun or grilled hotate, foie gras or king crab — and so is dessert.",
      th: "มี 12 คำ ทั้งซาชิมิ ซูชิตั้งแต่คัมปาจิถึงโอโทโร่ กุ้งโบตัน และแฮนด์โรลอูนิ ระหว่างมื้อมีสองคำที่เลือกเองได้ คือวากิวซันหรือโฮตาเตะย่าง และฟัวกราส์หรือปูทาราบะ แล้วเลือกของหวานได้เอง",
      zh: "共 12 品：刺身、从间八到大腹的寿司、牡丹虾，以及海胆手卷。其中两品由您自选——Wagyu Sun 或烤帆立贝；鹅肝或帝王蟹——甜品也可自选。",
    },
    forWho: {
      en: "ADULT COURSE · TWO BITES TO CHOOSE",
      th: "คอร์สผู้ใหญ่ · เลือกเองได้สองอย่าง",
      zh: "成人套餐 · 两品可自选",
    },
    listLabel: { en: "ALL TWELVE, IN ORDER", th: "ครบทั้ง 12 คำ ตามลำดับเสิร์ฟ", zh: "全部 12 品，依上菜顺序" },
    listIsPartial: false,
    sample: { src: "/photos/9b85c5c783c4.jpg", w: 862, h: 876 },
    photos: [
      "/photos/765a5e444077.jpg",
      "/photos/09722e03bfec.jpg",
      "/photos/fce7f6dd87bd.jpg",
      "/photos/af2e9571bac6.jpg",
      "/photos/9962feecc2f7.jpg",
    ],
    dishes: [
      { name: { en: "Hotate mozuku junsai", zh: "帆立贝配海蕴与莼菜" } },
      { name: { en: "Suan Zen sashimi — 3 kinds of fish", zh: "Suan Zen 刺身（3 种鱼）" } },
      { name: { en: "Kampachi sushi", zh: "间八寿司 (kampachi)" } },
      { name: { en: "Shima-aji sushi", zh: "缟鲹寿司 (shima-aji)" } },
      { name: { en: "Botan ebi sushi", zh: "牡丹虾寿司" } },
      { name: { en: "Dry-aged akami sushi", zh: "干式熟成赤身寿司 (akami)" } },
      { name: { en: "Ōtoro sushi · binchotan", zh: "大腹寿司 (ōtoro) · 备长炭" } },
      { name: { en: "Uni handroll", zh: "海胆手卷" }, photo: "/photos/5138120a936b.jpg" },
      { name: { en: "Wagyu Sun or hotate yaki", zh: "Wagyu Sun 或烤帆立贝" } },
      { name: { en: "Foie gras or fine-dine taraba", zh: "鹅肝或 fine-dine 帝王蟹 (taraba)" } },
      { name: { en: "Rubin soup", zh: "Rubin 汤" } },
      { name: { en: "Dessert — your pick of all six endings", zh: "甜品（6 款任选）" } },
    ],
  },
  {
    id: "zen-yon",
    slug: "zen-yon",
    key: "yon",
    index: "06",
    name: { en: "Zen Yon", th: "เซน ยง", zh: "Zen Yon" },
    kanji: "四",
    price: 4500,
    count: 13,
    unit: { en: "bites", th: "คำ", zh: "品" },
    desc: {
      en: "The restaurant's course for meat lovers: Kagoshima and Saga wagyu from Kyushu in ten of its thirteen bites — tataki, sushi, roll, nabe, porridge, yakiniku, katsu, don and more. It opens with sake, or a starter instead.",
      th: "คอร์สที่ทางร้านทำมาสำหรับคนรักเนื้อ ใช้วากิวคาโกชิมะและซากะจากคิวชูใน 10 จาก 13 คำ ทั้งทาทากิ ซูชิ โรล นาเบะ ข้าวต้ม ยากินิกุ คัตสึ ดง และอีกหลายแบบ เปิดด้วยสาเก หรือเปลี่ยนเป็นจานเรียกน้ำย่อยก็ได้",
      zh: "餐厅为爱吃肉的客人准备的套餐：13 品中有 10 品选用来自九州的鹿儿岛与佐贺和牛，做成炙烧、寿司、卷物、锅物、粥、烧肉、炸排、盖饭等。以清酒开场，也可换成一道前菜。",
    },
    forWho: {
      en: "ADULT COURSE · FOR BEEF LOVERS",
      th: "คอร์สผู้ใหญ่ · สำหรับคนรักเนื้อ",
      zh: "成人套餐 · 适合爱吃牛肉的客人",
    },
    listLabel: { en: "ALL THIRTEEN, IN ORDER", th: "ครบทั้ง 13 คำ ตามลำดับเสิร์ฟ", zh: "全部 13 品，依上菜顺序" },
    listIsPartial: false,
    sample: { src: "/photos/6b3b52b1c63e.jpg", w: 856, h: 892 },
    gallery: [
      {
        src: "/photos/b8f1789449eb.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Wagyu Takaki", zh: "和牛炙烧 (tataki)" },
        n: 2,
      },
      {
        src: "/photos/1a26a64e97b2.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Wagyu Roll", zh: "和牛卷" },
        n: 4,
      },
      {
        src: "/photos/0d21f8c49dee.jpg",
        w: 1400,
        h: 933,
        caption: { en: "Wagyu Katsu with Black Truffle", zh: "炸和牛排 (katsu) · 黑松露" },
        n: 8,
      },
    ],
    photos: [
      "/photos/2ff8db8e9a7f.jpg",
      "/photos/66f4b170541c.jpg",
      "/photos/6bc8d2e712c9.jpg",
      "/photos/37a1d0f237df.jpg",
      "/photos/b33e821d05b5.jpg",
      "/photos/ab49be628b6e.jpg",
    ],
    dishes: [
      {
        name: {
          en: "Sake — Shirayuki Sessu Otokoyama — or hotate mozuku junsai",
          zh: "清酒（Shirayuki Sessu Otokoyama）或帆立贝配海蕴与莼菜",
        },
      },
      { name: { en: "Wagyu tataki", zh: "和牛炙烧 (tataki)" }, photo: "/photos/66f4b170541c.jpg" },
      { name: { en: "Wagyu sushi", zh: "和牛寿司" } },
      { name: { en: "Wagyu roll", zh: "和牛卷" } },
      { name: { en: "Wagyu nabe", zh: "和牛锅" } },
      { name: { en: "Wagyu porridge", zh: "和牛粥" } },
      { name: { en: "Wagyu yakiniku", zh: "和牛烧肉" }, photo: "/photos/b33e821d05b5.jpg" },
      {
        name: { en: "Wagyu katsu · black truffle", zh: "炸和牛排 (katsu) · 黑松露" },
        photo: "/photos/2ff8db8e9a7f.jpg",
      },
      { name: { en: "Gyūtan yaki", zh: "烤牛舌 (gyūtan)" } },
      { name: { en: "Wagyu don", zh: "和牛盖饭" } },
      { name: { en: "Wagyu Sun", zh: "Wagyu Sun" }, photo: "/photos/389c22685003.jpg" },
      { name: { en: "Wagyu soup", zh: "和牛汤" } },
      {
        name: {
          en: "Matcha mousse · raspberry mousse or choc tiramisu shot",
          zh: "抹茶慕斯 · 覆盆子慕斯或巧克力提拉米苏杯",
        },
      },
    ],
  },
  {
    id: "zen-sweet",
    slug: "zen-sweet",
    key: "sweet",
    index: "07",
    name: { en: "Zen Sweet", th: "เซน สวีท", zh: "Zen Sweet" },
    kanji: "甘",
    price: 1890,
    count: 3,
    unit: { en: "menus", th: "เมนู", zh: "款菜单" },
    desc: {
      en: "A course for dessert lovers, in three menus to choose from — Zen Sweet A, B and C — of five pieces each: matcha mousse, Basque burnt cheesecake, jasmine and raspberry mousse, passion fruit panna cotta, and banoffee and tiramisu shots among them. Book two days ahead.",
      th: "คอร์สสำหรับสายขนมหวาน มีสามเมนูให้เลือก คือ Zen Sweet A, B และ C เมนูละ 5 ชิ้น เช่น มูสมัทฉะ ชีสเค้กบาสก์ มูสมะลิ มูสราสเบอร์รี พานาคอตต้าเสาวรส และช็อตบานอฟฟี่กับทีรามิสุ กรุณาจองล่วงหน้า 2 วัน",
      zh: "为甜品爱好者准备的套餐，共三款菜单可选（Zen Sweet A、B、C），每款 5 道甜品。三款菜单中有抹茶慕斯、巴斯克焦香芝士蛋糕、茉莉花慕斯、覆盆子慕斯、百香果意式奶冻，以及香蕉太妃杯和提拉米苏杯。请提前 2 天预约。",
    },
    forWho: { en: "DESSERT COURSE", th: "คอร์สของหวาน", zh: "甜品套餐" },
    listLabel: { en: "THREE MENUS, FIVE PIECES EACH", th: "สามเมนู เมนูละ 5 ชิ้น", zh: "共 3 款菜单，每款 5 道" },
    listIsPartial: false,
    sample: { src: "/photos/33ebaf5cab43.jpg", w: 870, h: 878 },
    photos: [
      "/photos/b691eb59a482.jpg",
      "/photos/9306a6431f10.jpg",
      "/photos/28ac22598eee.jpg",
      "/photos/0d393fd3d14f.jpg",
    ],
    // As the restaurant lists them: five pieces each, in this order.
    menus: [
      {
        label: { en: "ZEN SWEET A", th: "Zen Sweet A", zh: "Zen Sweet A" },
        dishes: [
          { name: { en: "Matcha mousse with crumble", zh: "抹茶慕斯配酥粒" }, photo: "/photos/e55b74c7148c.jpg" },
          { name: { en: "Basque burnt cheesecake", zh: "巴斯克焦香芝士蛋糕" } },
          { name: { en: "Choc banoffee shot", zh: "巧克力香蕉太妃杯" } },
          { name: { en: "Jasmine mousse", zh: "茉莉花慕斯" } },
          { name: { en: "Panna cotta passion fruit", zh: "百香果意式奶冻" } },
        ],
      },
      {
        label: { en: "ZEN SWEET B", th: "Zen Sweet B", zh: "Zen Sweet B" },
        dishes: [
          { name: { en: "Choc tiramisu shot", zh: "巧克力提拉米苏杯" } },
          { name: { en: "Matcha mousse with crumble", zh: "抹茶慕斯配酥粒" }, photo: "/photos/e55b74c7148c.jpg" },
          { name: { en: "Basque burnt cheesecake", zh: "巴斯克焦香芝士蛋糕" } },
          { name: { en: "Raspberry mousse", zh: "覆盆子慕斯" } },
          { name: { en: "Matcha banoffee shot", zh: "抹茶香蕉太妃杯" } },
        ],
      },
      {
        label: { en: "ZEN SWEET C", th: "Zen Sweet C", zh: "Zen Sweet C" },
        dishes: [
          { name: { en: "Choc tiramisu shot", zh: "巧克力提拉米苏杯" } },
          { name: { en: "Matcha tiramisu shot", zh: "抹茶提拉米苏杯" } },
          { name: { en: "Choc banoffee shot", zh: "巧克力香蕉太妃杯" } },
          { name: { en: "Matcha banoffee shot", zh: "抹茶香蕉太妃杯" } },
          { name: { en: "Basque burnt cheesecake", zh: "巴斯克焦香芝士蛋糕" } },
        ],
      },
    ],
  },
];

courses.forEach((c) => {
  c.active = true;
});

export const activeCourses = courses.filter((c) => c.active);
export const courseById = (id: string) => courses.find((c) => c.id === id);

/** ฿2,000 — grouped, no decimals. */
export const formatBaht = (n: number) => '฿' + n.toLocaleString('en-US');

/** Every dish across every course, flattened — used by the hover preview. */
export const allDishes = (c: Course): Dish[] =>
  c.menus ? c.menus.flatMap((m) => m.dishes) : (c.dishes ?? []);
