/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE COURSES — the full menu
 * ─────────────────────────────────────────────────────────────────────────────
 *  Where this comes from, most authoritative first:
 *
 *  - The restaurant's own Facebook post "5 Courses available at Suan Zen
 *    Omakase" (facebook.com/omakase.suanzen, 2024-09-06): the price, item count
 *    and full dish list of Zen Kids, Ichi, Ni, San and Yon; Kids for ages 7–11;
 *    Yon "specifically for meat lovers", Kagoshima and Saga wagyu.
 *  - The studio brief (2026-09-11): Zen Ichi recommended for ages 12–14, and
 *    Ni, San, Boss and Yon as adult courses.
 *  - The two earlier Suan Zen builds: the dish lists shown here for Ni, San and
 *    Yon (they differ from the 2024 post in places, and nobody has said which
 *    is current), and everything about Zen Boss and Zen Sweet, which the 2024
 *    post does not mention.
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

export type Dish = {
  nameEn: string;
  nameTh?: string;
  /** Path under /public. Undefined when no photograph shows this dish. */
  photo?: string;
};

export type SweetMenu = { labelEn: string; labelTh: string; dishes: Dish[] };

export type Course = {
  id: string;
  slug: string;
  key: string;
  index: string;
  nameEn: string;
  nameTh: string;
  kanji: string;
  /** Baht, before ++. */
  price: number;
  count: number;
  unitEn: string;
  unitTh: string;
  descEn: string;
  descTh: string;
  forEn: string;
  forTh: string;
  listLabelEn: string;
  listLabelTh: string;
  /** True when the published list is a selection, not the whole course. */
  listIsPartial: boolean;
  /** The one picture the restaurant has sent for this course, with the size it
      was measured at, so it takes its own height before it loads. Shown when
      the course is opened in the menu and at the top of its own page. A course
      without one shows no picture: none is borrowed from another course. */
  sample?: { src: string; w: number; h: number };
  photos: string[];
  dishes?: Dish[];
  /** Zen Sweet is three fixed menus rather than one sequence. */
  menus?: SweetMenu[];
  active?: boolean;
};

/* In family order: the course for younger diners, the teenage course, the
   adult courses, then the dessert course. */
export const courses: Course[] = [
  {
    id: "zen-kids",
    slug: "zen-kids",
    key: "kids",
    index: "01",
    nameEn: "Zen Kids",
    nameTh: "เซน คิดส์",
    kanji: "子",
    price: 1290,
    count: 9,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "Suan Zen's course for younger diners, recommended for ages 7–11. Nine bites: yuzu juice, tamago, salmon, hamachi and chūtoro sushi, ebi tempura, salmon don, udon carbonara and chocolate lava.",
    descTh: "คอร์สของสวน เซน สำหรับน้อง ๆ แนะนำสำหรับอายุ 7–11 ปี มีทั้งหมด 9 คำ ตั้งแต่น้ำยูซุ ทามาโกะ แซลมอน ซูชิฮามาจิ และชูโทโร่ ไปจนถึงกุ้งเทมปุระ ข้าวหน้าแซลมอน อุด้งคาโบนาร่า และช็อกโกแลตลาวา",
    forEn: "FOR YOUNGER DINERS · AGES 7–11",
    forTh: "สำหรับน้อง ๆ อายุ 7–11 ปี",
    listLabelEn: "ALL NINE, IN ORDER",
    listLabelTh: "ครบทั้ง 9 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    photos: [],
    dishes: [
      { nameEn: "Yuzu juice" },
      { nameEn: "Tamago" },
      { nameEn: "Namazakana (salmon)" },
      { nameEn: "Hamachi sushi" },
      { nameEn: "Chūtoro sushi" },
      { nameEn: "Ebi tempura" },
      { nameEn: "Salmon don" },
      { nameEn: "Udon carbonara" },
      { nameEn: "Chocolate lava" },
    ],
  },
  {
    id: "zen-ichi",
    slug: "zen-ichi",
    key: "ichi",
    index: "02",
    nameEn: "Zen Ichi",
    nameTh: "เซน อิจิ",
    kanji: "一",
    price: 2000,
    count: 14,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "Recommended for diners aged 12–14: the step between Zen Kids and the adult courses. Fourteen bites, mostly sushi and seafood — madai, shima-aji, ama-ebi, akami, chūtoro, uni, kisu tempura, kani meshi — with one wagyu sushi.",
    descTh: "แนะนำสำหรับอายุ 12–14 ปี เป็นก้าวต่อจาก เซน คิดส์ ก่อนถึงคอร์สของผู้ใหญ่ มีทั้งหมด 14 คำ ส่วนใหญ่เป็นซูชิและอาหารทะเล เช่น มาได ชิมาอาจิ อามาเอบิ อากามิ ชูโทโร่ อูนิ คิสุเทมปุระ และข้าวปู มีวากิวซูชิหนึ่งคำ",
    forEn: "RECOMMENDED FOR AGES 12–14",
    forTh: "แนะนำสำหรับอายุ 12–14 ปี",
    listLabelEn: "ALL FOURTEEN, IN ORDER",
    listLabelTh: "ครบทั้ง 14 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    photos: ["/photos/b6e6bff9bdd4.jpg", "/photos/b63e98c7df99.jpg"],
    dishes: [
      { nameEn: "Yuzu juice" },
      { nameEn: "Suan Zen sashimi", photo: "/photos/b6e6bff9bdd4.jpg" },
      { nameEn: "Madai sushi" },
      { nameEn: "Shima-aji sushi" },
      { nameEn: "Ama-ebi sushi" },
      { nameEn: "Hotate yaki" },
      { nameEn: "Akami sushi" },
      { nameEn: "Chūtoro sushi" },
      { nameEn: "Kisu tempura" },
      { nameEn: "Uni sushi" },
      { nameEn: "Kani meshi" },
      { nameEn: "Wagyu sushi" },
      { nameEn: "Miso soup" },
      { nameEn: "Chocolate melted lava" },
    ],
  },
  {
    id: "zen-ni",
    slug: "zen-ni",
    key: "ni",
    index: "03",
    nameEn: "Zen Ni",
    nameTh: "เซน นิ",
    kanji: "二",
    price: 2890,
    count: 16,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "The restaurant calls it a course that brings happiness: sixteen bites built on ingredients that are hard to find. Mostly fish and seafood — chūtoro and ōtoro, uni, unagi — with one wagyu bite.",
    descTh: "ทางร้านบอกว่าเป็นคอร์สที่ให้ความสุข มี 16 คำจากวัตถุดิบที่หาไม่ง่าย ส่วนใหญ่เป็นปลาและอาหารทะเล เช่น ชูโทโร่ โอโทโร่ อูนิ และอุนางิ มีวากิวหนึ่งคำ",
    forEn: "ADULT COURSE · MOSTLY FISH & SEAFOOD",
    forTh: "คอร์สผู้ใหญ่ · เน้นปลาและอาหารทะเล",
    listLabelEn: "ALL SIXTEEN, IN ORDER",
    listLabelTh: "ครบทั้ง 16 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    sample: { src: "/photos/249c7c8c7528.jpg", w: 870, h: 885 },
    photos: [
      "/photos/ee3160d17d48.jpg",
      "/photos/17dd4959b0e0.jpg",
      "/photos/12aae199fdf8.jpg",
      "/photos/f26846b90108.jpg",
      "/photos/cac0b51e64fe.jpg",
      "/photos/ea8212d3faff.jpg",
    ],
    dishes: [
      { nameEn: "Hotate mozuku junsai" },
      { nameEn: "Suan Zen sashimi — 3 kinds of fish" },
      { nameEn: "Hirame sushi" },
      { nameEn: "Kampachi sushi" },
      { nameEn: "Shima-aji sushi" },
      { nameEn: "Ama ebi sushi" },
      { nameEn: "Hotate yaki" },
      { nameEn: "Chūtoro sushi · fresh truffle", photo: "/photos/12aae199fdf8.jpg" },
      { nameEn: "Ōtoro sushi · binchotan" },
      { nameEn: "Zuwai kani", photo: "/photos/17dd4959b0e0.jpg" },
      { nameEn: "Uni shokupan", photo: "/photos/366b3e424e05.jpg" },
      { nameEn: "Unagi temaki" },
      { nameEn: "Fine-dine taraba" },
      { nameEn: "Wagyu special" },
      { nameEn: "Osuimono soup" },
      { nameEn: "Choc melted lava · panna cotta raspberry or passion fruit" },
    ],
  },
  {
    id: "zen-san",
    slug: "zen-san",
    key: "san",
    index: "04",
    nameEn: "Zen San",
    nameTh: "เซน ซัง",
    kanji: "三",
    price: 3890,
    count: 17,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "Seventeen bites, the most of any course. The restaurant calls it its “fine” course, where Western and Eastern flavours meet. Mostly fish and seafood — kinmedai, akami, ōtoro, uni, amadai — with one wagyu bite.",
    descTh: "17 คำ มากที่สุดในทุกคอร์ส ทางร้านเรียกว่าคอร์ส “ไฟน์” ที่รสชาติตะวันตกและตะวันออกมาบรรจบกัน ส่วนใหญ่เป็นปลาและอาหารทะเล เช่น คินเมได อากามิ โอโทโร่ อูนิ และอามาได มีวากิวหนึ่งคำ",
    forEn: "ADULT COURSE · MOSTLY FISH & SEAFOOD",
    forTh: "คอร์สผู้ใหญ่ · เน้นปลาและอาหารทะเล",
    listLabelEn: "ALL SEVENTEEN, IN ORDER",
    listLabelTh: "ครบทั้ง 17 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    sample: { src: "/photos/4ec2522c1b09.jpg", w: 870, h: 886 },
    photos: [
      "/photos/1f365022e967.jpg",
      "/photos/42a586ebc854.jpg",
      "/photos/5138120a936b.jpg",
      "/photos/0290e94ce2e9.jpg",
      "/photos/e55b74c7148c.jpg",
    ],
    dishes: [
      { nameEn: "Hotate mozuku junsai" },
      { nameEn: "Suan Zen sashimi — 3 kinds of fish" },
      { nameEn: "Kinmedai sushi" },
      { nameEn: "Hirame sushi" },
      { nameEn: "Shima-aji sushi" },
      { nameEn: "Botan ebi sushi" },
      { nameEn: "Hotate yaki" },
      { nameEn: "Dry-aged akami sushi" },
      { nameEn: "Ōtoro sushi · binchotan" },
      { nameEn: "Wagyu sushi" },
      { nameEn: "Negitoro · Inaniwa ponzu" },
      { nameEn: "Fine-dine amadai", photo: "/photos/1f365022e967.jpg" },
      { nameEn: "Hotaru tempura" },
      { nameEn: "Uni handroll", photo: "/photos/5138120a936b.jpg" },
      { nameEn: "Foie gras designed by Suan Zen", photo: "/photos/af2e9571bac6.jpg" },
      { nameEn: "Rubin soup" },
      { nameEn: "Matcha mousse · raspberry mousse or choc tiramisu shot" },
    ],
  },
  {
    id: "zen-boss",
    slug: "zen-boss",
    key: "boss",
    index: "05",
    nameEn: "Zen Boss",
    nameTh: "เซน บอส",
    kanji: "将",
    price: 3890,
    count: 12,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "Twelve bites: sashimi, sushi from kampachi to ōtoro, botan ebi and an uni handroll. Two bites are yours to choose — Wagyu Sun or grilled hotate, foie gras or king crab — and so is dessert.",
    descTh: "มี 12 คำ ทั้งซาชิมิ ซูชิตั้งแต่คัมปาจิถึงโอโทโร่ กุ้งโบตัน และแฮนด์โรลอูนิ ระหว่างมื้อมีสองคำที่เลือกเองได้ คือวากิวซันหรือโฮตาเตะย่าง และฟัวกราส์หรือปูทาราบะ แล้วเลือกของหวานได้เอง",
    forEn: "ADULT COURSE · TWO BITES TO CHOOSE",
    forTh: "คอร์สผู้ใหญ่ · เลือกเองได้สองอย่าง",
    listLabelEn: "ALL TWELVE, IN ORDER",
    listLabelTh: "ครบทั้ง 12 คำ ตามลำดับเสิร์ฟ",
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
      { nameEn: "Hotate mozuku junsai" },
      { nameEn: "Suan Zen sashimi — 3 kinds of fish" },
      { nameEn: "Kampachi sushi" },
      { nameEn: "Shima-aji sushi" },
      { nameEn: "Botan ebi sushi" },
      { nameEn: "Dry-aged akami sushi" },
      { nameEn: "Ōtoro sushi · binchotan" },
      { nameEn: "Uni handroll", photo: "/photos/5138120a936b.jpg" },
      { nameEn: "Wagyu Sun or hotate yaki" },
      { nameEn: "Foie gras or fine-dine taraba" },
      { nameEn: "Rubin soup" },
      { nameEn: "Dessert — your pick of all six endings" },
    ],
  },
  {
    id: "zen-yon",
    slug: "zen-yon",
    key: "yon",
    index: "06",
    nameEn: "Zen Yon",
    nameTh: "เซน ยง",
    kanji: "四",
    price: 4500,
    count: 13,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "The restaurant's course for meat lovers: Kagoshima and Saga wagyu from Kyushu in ten of its thirteen bites — tataki, sushi, roll, nabe, porridge, yakiniku, katsu, don and more. It opens with sake, or a starter instead.",
    descTh: "คอร์สที่ทางร้านทำมาสำหรับคนรักเนื้อ ใช้วากิวคาโกชิมะและซากะจากคิวชูใน 10 จาก 13 คำ ทั้งทาทากิ ซูชิ โรล นาเบะ ข้าวต้ม ยากินิกุ คัตสึ ดง และอีกหลายแบบ เปิดด้วยสาเก หรือเปลี่ยนเป็นจานเรียกน้ำย่อยก็ได้",
    forEn: "ADULT COURSE · FOR BEEF LOVERS",
    forTh: "คอร์สผู้ใหญ่ · สำหรับคนรักเนื้อ",
    listLabelEn: "ALL THIRTEEN, IN ORDER",
    listLabelTh: "ครบทั้ง 13 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    sample: { src: "/photos/6b3b52b1c63e.jpg", w: 856, h: 892 },
    photos: [
      "/photos/2ff8db8e9a7f.jpg",
      "/photos/66f4b170541c.jpg",
      "/photos/6bc8d2e712c9.jpg",
      "/photos/37a1d0f237df.jpg",
      "/photos/b33e821d05b5.jpg",
      "/photos/ab49be628b6e.jpg",
    ],
    dishes: [
      { nameEn: "Sake — Shirayuki Sessu Otokoyama — or hotate mozuku junsai" },
      { nameEn: "Wagyu tataki", photo: "/photos/66f4b170541c.jpg" },
      { nameEn: "Wagyu sushi" },
      { nameEn: "Wagyu roll" },
      { nameEn: "Wagyu nabe" },
      { nameEn: "Wagyu porridge" },
      { nameEn: "Wagyu yakiniku", photo: "/photos/b33e821d05b5.jpg" },
      { nameEn: "Wagyu katsu · black truffle", photo: "/photos/2ff8db8e9a7f.jpg" },
      { nameEn: "Gyūtan yaki" },
      { nameEn: "Wagyu don" },
      { nameEn: "Wagyu Sun", photo: "/photos/389c22685003.jpg" },
      { nameEn: "Wagyu soup" },
      { nameEn: "Matcha mousse · raspberry mousse or choc tiramisu shot" },
    ],
  },
  {
    id: "zen-sweet",
    slug: "zen-sweet",
    key: "sweet",
    index: "07",
    nameEn: "Zen Sweet",
    nameTh: "เซน สวีท",
    kanji: "甘",
    price: 1890,
    count: 3,
    unitEn: "menus",
    unitTh: "เมนู",
    descEn: "A dessert course in three menus — A, B and C — chosen when you book. Matcha mousse, Basque burnt cheesecake, and banoffee and tiramisu shots among them.",
    descTh: "คอร์สของหวาน มีสามเมนูให้เลือก คือ A B และ C เลือกตอนจอง ในนั้นมีมัทฉะมูส ชีสเค้กบาสก์ และช็อตบานอฟฟี่กับทีรามิสุ",
    forEn: "DESSERT COURSE",
    forTh: "คอร์สของหวาน",
    listLabelEn: "THREE MENUS",
    listLabelTh: "สามเมนู",
    listIsPartial: false,
    sample: { src: "/photos/33ebaf5cab43.jpg", w: 870, h: 878 },
    photos: [
      "/photos/b691eb59a482.jpg",
      "/photos/9306a6431f10.jpg",
      "/photos/28ac22598eee.jpg",
      "/photos/0d393fd3d14f.jpg",
    ],
    menus: [
      {
        labelEn: "MENU A",
        labelTh: "เมนู A",
        dishes: [
          { nameEn: "Matcha mousse with crumble", photo: "/photos/e55b74c7148c.jpg" },
          { nameEn: "Basque burnt cheesecake" },
          { nameEn: "Choc banoffee shot" },
          { nameEn: "Jasmine mousse" },
          { nameEn: "Panna cotta passion fruit" },
          { nameEn: "Choc tiramisu shot" },
        ],
      },
      {
        labelEn: "MENU B",
        labelTh: "เมนู B",
        dishes: [
          { nameEn: "Matcha mousse with crumble", photo: "/photos/e55b74c7148c.jpg" },
          { nameEn: "Basque burnt cheesecake" },
          { nameEn: "Raspberry mousse" },
          { nameEn: "Matcha banoffee shot" },
          { nameEn: "Choc tiramisu shot" },
        ],
      },
      {
        labelEn: "MENU C",
        labelTh: "เมนู C",
        dishes: [
          { nameEn: "Matcha tiramisu shot" },
          { nameEn: "Choc banoffee shot" },
          { nameEn: "Matcha banoffee shot" },
          { nameEn: "Basque burnt cheesecake" },
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
