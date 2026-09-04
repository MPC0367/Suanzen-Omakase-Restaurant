/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE COURSES — the full menu
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every course, price, dish and Thai string here was carried over from the two
 *  earlier Suan Zen builds, which were made with the restaurant. Nothing in this
 *  file is invented: prices are the restaurant's, quoted ++ (before service and
 *  VAT) exactly as they quote them, and the dish lists are the ones the kitchen
 *  published.
 *
 *  Zen Ichi is the one exception worth knowing: the restaurant published a
 *  selection of seven from its fourteen, so `listIsPartial` is true there and
 *  the UI says so rather than implying the course is seven bites.
 *
 *  `photo` on a dish is filled in only where one of the restaurant's own
 *  photographs actually shows that dish — it drives the hover preview, so a
 *  wrong match would put the wrong picture against a priced item.
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
  photos: string[];
  dishes?: Dish[];
  /** Zen Sweet is three fixed menus rather than one sequence. */
  menus?: SweetMenu[];
  featured?: boolean;
  active?: boolean;
};

export const courses: Course[] = [
  {
    id: "zen-ichi",
    slug: "zen-ichi",
    key: "ichi",
    index: "01",
    nameEn: "Zen Ichi",
    nameTh: "เซน อิจิ",
    kanji: "一",
    price: 2000,
    count: 14,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "The first taste of the counter, sized for a first omakase: sashimi, seasonal nigiri, grilled hotate, uni, a little wagyu, miso to warm the middle, chocolate to close.",
    descTh: "รสแรกของเคาน์เตอร์ ขนาดพอดีสำหรับโอมากาเสะครั้งแรก — ซาชิมิ นิงิริตามฤดูกาล โฮตาเตะย่าง อูนิ วากิวเล็กน้อย ซุปมิโซะอุ่นช่วงกลาง และช็อกโกแลตปิดท้าย",
    forEn: "START HERE IF IT'S YOUR FIRST TIME",
    forTh: "เริ่มที่นี่ หากเป็นครั้งแรกของคุณ",
    listLabelEn: "A TASTE OF THE FOURTEEN",
    listLabelTh: "ตัวอย่างจากทั้ง 14 คำ",
    listIsPartial: true,
    photos: [
      "/photos/b6e6bff9bdd4.jpg",
      "/photos/35e5b6674f55.jpg",
      "/photos/6f879f9e50fe.jpg",
      "/photos/b63e98c7df99.jpg",
      "/photos/269a79f26751.jpg",
      "/photos/95d9b8ba471b.jpg",
      "/photos/8fba7190a1e6.jpg"
    ],
    dishes: [
      {
        nameEn: "Sashimi",
        photo: "/photos/b6e6bff9bdd4.jpg"
      },
      {
        nameEn: "Seasonal nigiri",
        photo: "/photos/6f879f9e50fe.jpg"
      },
      {
        nameEn: "Hotate yaki"
      },
      {
        nameEn: "Uni",
        photo: "/photos/ad61e1d47ba5.jpg"
      },
      {
        nameEn: "Wagyu",
        photo: "/photos/ab49be628b6e.jpg"
      },
      {
        nameEn: "Miso soup"
      },
      {
        nameEn: "Chocolate dessert"
      }
    ]
  },
  {
    id: "zen-ni",
    slug: "zen-ni",
    key: "ni",
    index: "02",
    nameEn: "Zen Ni",
    nameTh: "เซน นิ",
    kanji: "二",
    price: 2890,
    count: 16,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "The happiness course — sixteen services of things that are hard to find: chūtoro under fresh truffle, ōtoro seared over binchotan, uni on shokupan, king crab done fine-dine.",
    descTh: "คอร์สแห่งความสุข — สิบหกคำของวัตถุดิบที่หารับประทานได้ไม่ง่าย: ชูโทโร่ใต้ทรัฟเฟิลสด โอโทโร่ย่างถ่านบินโจตัน อูนิบนโชกุปัง และปูทาราบะสไตล์ไฟน์ไดนิ่ง",
    forEn: "FOR SECOND VISITS AND SLOW AFTERNOONS",
    forTh: "สำหรับการมาครั้งที่สอง และบ่ายที่ไม่รีบร้อน",
    listLabelEn: "ALL SIXTEEN, IN ORDER",
    listLabelTh: "ครบทั้ง 16 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    photos: [
      "/photos/ee3160d17d48.jpg",
      "/photos/c75e1799f0ce.jpg",
      "/photos/cac0b51e64fe.jpg",
      "/photos/f26846b90108.jpg",
      "/photos/2dc2687c3de2.jpg",
      "/photos/17dd4959b0e0.jpg",
      "/photos/ea8212d3faff.jpg",
      "/photos/a482957b80d2.jpg",
      "/photos/12aae199fdf8.jpg"
    ],
    dishes: [
      {
        nameEn: "Hotate mozuku junsai"
      },
      {
        nameEn: "Suan Zen sashimi — 3 kinds of fish"
      },
      {
        nameEn: "Hirame sushi"
      },
      {
        nameEn: "Kampachi sushi"
      },
      {
        nameEn: "Shima-aji sushi"
      },
      {
        nameEn: "Ama ebi sushi",
        photo: "/photos/a482957b80d2.jpg"
      },
      {
        nameEn: "Hotate yaki"
      },
      {
        nameEn: "Chūtoro sushi · fresh truffle",
        photo: "/photos/12aae199fdf8.jpg"
      },
      {
        nameEn: "Ōtoro sushi · binchotan"
      },
      {
        nameEn: "Zuwai kani",
        photo: "/photos/17dd4959b0e0.jpg"
      },
      {
        nameEn: "Uni shokupan",
        photo: "/photos/366b3e424e05.jpg"
      },
      {
        nameEn: "Unagi temaki"
      },
      {
        nameEn: "Fine-dine taraba"
      },
      {
        nameEn: "Wagyu special",
        photo: "/photos/cac0b51e64fe.jpg"
      },
      {
        nameEn: "Osuimono soup"
      },
      {
        nameEn: "Choc melted lava · panna cotta raspberry or passion fruit"
      }
    ]
  },
  {
    id: "zen-san",
    slug: "zen-san",
    key: "san",
    index: "03",
    nameEn: "Zen San",
    nameTh: "เซน ซัง",
    kanji: "三",
    price: 3890,
    count: 17,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "Seventeen services gliding between West and East without a seam — dry-aged akami, negitoro with Inaniwa ponzu, hotaru tempura, foie gras designed by the house.",
    descTh: "สิบเจ็ดคำที่ผสานโลกตะวันตกและตะวันออกแบบแนบเนียน — อากามิดรายเอจ เนกิโทโร่กับพอนสึอินานิวะ โฮตารุเทมปุระ และฟัวกราส์ที่ดีไซน์โดยทางร้าน",
    forEn: "THE FULL EVENING",
    forTh: "ค่ำคืนแบบเต็มอิ่ม",
    listLabelEn: "ALL SEVENTEEN, IN ORDER",
    listLabelTh: "ครบทั้ง 17 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    photos: [
      "/photos/42a586ebc854.jpg",
      "/photos/1f365022e967.jpg",
      "/photos/5138120a936b.jpg",
      "/photos/365dbb1ce96e.jpg",
      "/photos/0290e94ce2e9.jpg",
      "/photos/269f55c68ef3.jpg",
      "/photos/e55b74c7148c.jpg",
      "/photos/366b3e424e05.jpg",
      "/photos/ad61e1d47ba5.jpg"
    ],
    dishes: [
      {
        nameEn: "Hotate mozuku junsai"
      },
      {
        nameEn: "Suan Zen sashimi — 3 kinds of fish"
      },
      {
        nameEn: "Kinmedai sushi"
      },
      {
        nameEn: "Hirame sushi"
      },
      {
        nameEn: "Shima-aji sushi"
      },
      {
        nameEn: "Botan ebi sushi",
        photo: "/photos/4a906697f15e.jpg"
      },
      {
        nameEn: "Hotate yaki"
      },
      {
        nameEn: "Dry-aged akami sushi"
      },
      {
        nameEn: "Ōtoro sushi · binchotan"
      },
      {
        nameEn: "Wagyu sushi"
      },
      {
        nameEn: "Negitoro · Inaniwa ponzu"
      },
      {
        nameEn: "Fine-dine amadai",
        photo: "/photos/1f365022e967.jpg"
      },
      {
        nameEn: "Hotaru tempura"
      },
      {
        nameEn: "Uni handroll",
        photo: "/photos/5138120a936b.jpg"
      },
      {
        nameEn: "Foie gras designed by Suan Zen",
        photo: "/photos/af2e9571bac6.jpg"
      },
      {
        nameEn: "Rubin soup"
      },
      {
        nameEn: "Matcha mousse · raspberry mousse or choc tiramisu shot"
      }
    ]
  },
  {
    id: "zen-boss",
    slug: "zen-boss",
    key: "boss",
    index: "04",
    nameEn: "Zen Boss",
    nameTh: "เซน บอส",
    kanji: "将",
    price: 3890,
    count: 12,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "The head chef gathers the flagship bite of every course into twelve services, curated from the sea for someone special. Fewer bites — each one premium.",
    descTh: "เชฟใหญ่คัดเรือธงของแต่ละคอร์สจากท้องทะเลมาไว้ในสิบสองคำ สำหรับคนพิเศษ — คำน้อยลง แต่ทุกคำคือความพรีเมียม",
    forEn: "FEWER BITES, ALL FLAGSHIPS",
    forTh: "คำน้อยลง แต่ทุกคำคือเรือธง",
    listLabelEn: "ALL TWELVE, IN ORDER",
    listLabelTh: "ครบทั้ง 12 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    photos: [
      "/photos/765a5e444077.jpg",
      "/photos/09722e03bfec.jpg",
      "/photos/fce7f6dd87bd.jpg",
      "/photos/af2e9571bac6.jpg",
      "/photos/9962feecc2f7.jpg",
      "/photos/331c65656530.jpg"
    ],
    dishes: [
      {
        nameEn: "Hotate mozuku junsai"
      },
      {
        nameEn: "Suan Zen sashimi — 3 kinds of fish"
      },
      {
        nameEn: "Kampachi sushi"
      },
      {
        nameEn: "Shima-aji sushi"
      },
      {
        nameEn: "Botan ebi sushi",
        photo: "/photos/a482957b80d2.jpg"
      },
      {
        nameEn: "Dry-aged akami sushi"
      },
      {
        nameEn: "Ōtoro sushi · binchotan"
      },
      {
        nameEn: "Uni handroll",
        photo: "/photos/5138120a936b.jpg"
      },
      {
        nameEn: "Wagyu Sun or hotate yaki"
      },
      {
        nameEn: "Foie gras or fine-dine taraba"
      },
      {
        nameEn: "Rubin soup"
      },
      {
        nameEn: "Dessert — your pick of all six endings"
      }
    ]
  },
  {
    id: "zen-yon",
    slug: "zen-yon",
    key: "yon",
    index: "05",
    nameEn: "Zen Yon",
    nameTh: "เซน ยง",
    kanji: "四",
    price: 4500,
    count: 13,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "For beef people: Kagoshima and Saga wagyu down from Kyushu, eleven ways — tataki to katsu with black truffle, nabe to porridge — opened with sake or the house appetizer, closed on mousse.",
    descTh: "สำหรับสายเนื้อ: วากิวคาโกชิมะและซากะจากคิวชู สิบเอ็ดรูปแบบ — ตั้งแต่ทาทากิถึงคัตสึกับทรัฟเฟิลดำ นาเบะถึงข้าวต้มวากิว — เปิดด้วยสาเกหรือออเดิร์ฟของร้าน ปิดด้วยมูส",
    forEn: "BUILT AROUND THE HERD, NOT THE REEF",
    forTh: "สร้างขึ้นรอบฝูงวัว ไม่ใช่แนวปะการัง",
    listLabelEn: "ALL THIRTEEN, IN ORDER",
    listLabelTh: "ครบทั้ง 13 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    photos: [
      "/photos/2ff8db8e9a7f.jpg",
      "/photos/9cac501b1874.jpg",
      "/photos/66f4b170541c.jpg",
      "/photos/6bc8d2e712c9.jpg",
      "/photos/37a1d0f237df.jpg",
      "/photos/b33e821d05b5.jpg",
      "/photos/00524b6b30ad.jpg",
      "/photos/85d26e8b4070.jpg",
      "/photos/ab49be628b6e.jpg"
    ],
    dishes: [
      {
        nameEn: "Sake — Shirayuki Sessu Otokoyama — or hotate mozuku junsai"
      },
      {
        nameEn: "Wagyu tataki",
        photo: "/photos/66f4b170541c.jpg"
      },
      {
        nameEn: "Wagyu sushi"
      },
      {
        nameEn: "Wagyu roll"
      },
      {
        nameEn: "Wagyu nabe"
      },
      {
        nameEn: "Wagyu porridge"
      },
      {
        nameEn: "Wagyu yakiniku",
        photo: "/photos/b33e821d05b5.jpg"
      },
      {
        nameEn: "Wagyu katsu · black truffle",
        photo: "/photos/2ff8db8e9a7f.jpg"
      },
      {
        nameEn: "Gyūtan yaki"
      },
      {
        nameEn: "Wagyu don"
      },
      {
        nameEn: "Wagyu Sun",
        photo: "/photos/389c22685003.jpg"
      },
      {
        nameEn: "Wagyu soup"
      },
      {
        nameEn: "Matcha mousse · raspberry mousse or choc tiramisu shot"
      }
    ]
  },
  {
    id: "zen-kids",
    slug: "zen-kids",
    key: "kids",
    index: "06",
    nameEn: "Zen Kids",
    nameTh: "เซน คิดส์",
    kanji: "子",
    price: 1290,
    count: 9,
    unitEn: "bites",
    unitTh: "คำ",
    descEn: "A real course scaled to ages 7–11, eating at the counter at the same pace as the adults. Yuzu juice instead of sake.",
    descTh: "คอร์สจริงจังที่ย่อขนาดให้วัย 7–11 ปี นั่งกินที่เคาน์เตอร์ในจังหวะเดียวกับผู้ใหญ่ — น้ำยูซุแทนสาเก",
    forEn: "SO THE WHOLE TABLE SITS AT THE COUNTER",
    forTh: "ให้ทั้งครอบครัวได้นั่งเคาน์เตอร์เดียวกัน",
    listLabelEn: "ALL NINE, IN ORDER",
    listLabelTh: "ครบทั้ง 9 คำ ตามลำดับเสิร์ฟ",
    listIsPartial: false,
    photos: [
      "/photos/8f149934014d.jpg",
      "/photos/661acb502e4f.jpg"
    ],
    dishes: [
      {
        nameEn: "Yuzu juice"
      },
      {
        nameEn: "Tamago",
        photo: "/photos/6f879f9e50fe.jpg"
      },
      {
        nameEn: "Salmon sushi",
        photo: "/photos/6f879f9e50fe.jpg"
      },
      {
        nameEn: "Hamachi sushi"
      },
      {
        nameEn: "Chūtoro sushi"
      },
      {
        nameEn: "Ebi tempura"
      },
      {
        nameEn: "Salmon don"
      },
      {
        nameEn: "Udon carbonara"
      },
      {
        nameEn: "Chocolate lava"
      }
    ]
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
    count: 5,
    unitEn: "pieces",
    unitTh: "ชิ้น",
    descEn: "A dessert omakase for the sweet-toothed — concept, plating and flavours you won't meet anywhere else, five pieces per sitting. Choose menu A, B or C when you book.",
    descTh: "โอมากาเสะของหวานสำหรับสายขนมโดยเฉพาะ — คอนเซปต์ หน้าตา และรสชาติที่ไม่เหมือนใคร ห้าชิ้นต่อหนึ่งรอบ เลือกเมนู A, B หรือ C ตอนจอง",
    forEn: "RESERVE TWO DAYS AHEAD",
    forTh: "กรุณาจองล่วงหน้า 2 วัน",
    listLabelEn: "THREE MENUS, FIVE PIECES EACH",
    listLabelTh: "สามเมนู เมนูละ 5 ชิ้น",
    listIsPartial: false,
    photos: [
      "/photos/9306a6431f10.jpg",
      "/photos/b691eb59a482.jpg",
      "/photos/28ac22598eee.jpg",
      "/photos/0d393fd3d14f.jpg"
    ],
    menus: [
      {
        labelEn: "MENU A",
        labelTh: "เมนู A",
        dishes: [
          {
            nameEn: "Matcha mousse with crumble",
            photo: "/photos/e55b74c7148c.jpg"
          },
          {
            nameEn: "Basque burnt cheesecake"
          },
          {
            nameEn: "Choc banoffee shot"
          },
          {
            nameEn: "Jasmine mousse"
          },
          {
            nameEn: "Panna cotta passion fruit"
          },
          {
            nameEn: "Choc tiramisu shot"
          }
        ]
      },
      {
        labelEn: "MENU B",
        labelTh: "เมนู B",
        dishes: [
          {
            nameEn: "Matcha mousse with crumble",
            photo: "/photos/e55b74c7148c.jpg"
          },
          {
            nameEn: "Basque burnt cheesecake"
          },
          {
            nameEn: "Raspberry mousse"
          },
          {
            nameEn: "Matcha banoffee shot"
          },
          {
            nameEn: "Choc tiramisu shot"
          }
        ]
      },
      {
        labelEn: "MENU C",
        labelTh: "เมนู C",
        dishes: [
          {
            nameEn: "Matcha tiramisu shot"
          },
          {
            nameEn: "Choc banoffee shot"
          },
          {
            nameEn: "Matcha banoffee shot"
          },
          {
            nameEn: "Basque burnt cheesecake"
          }
        ]
      }
    ]
  }
];

// Zen Ichi is where most first visits start.
courses.forEach((c) => {
  c.active = true;
  c.featured = c.key === 'ichi';
});

export const activeCourses = courses.filter((c) => c.active);
export const featuredCourse = courses.find((c) => c.featured) ?? courses[0];

/** ฿2,000 — grouped, no decimals. */
export const formatBaht = (n: number) => '฿' + n.toLocaleString('en-US');

/** Every dish across every course, flattened — used by the hover preview. */
export const allDishes = (c: Course): Dish[] =>
  c.menus ? c.menus.flatMap((m) => m.dishes) : (c.dishes ?? []);
