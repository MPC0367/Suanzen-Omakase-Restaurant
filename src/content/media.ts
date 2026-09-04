/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE PHOTOGRAPH CATALOGUE
 * ─────────────────────────────────────────────────────────────────────────────
 *  72 of the restaurant's own photographs, recovered from the two earlier
 *  Suan Zen builds and from their Facebook and Instagram, then described one by
 *  one so every picture carries real alt text in both languages.
 *
 *  `warmth` is the thing the owner asked for: how much a picture carries the
 *  feeling of the room — guests, smiles, a full table, the chef among people —
 *  rather than a plate on its own. The site leans on the high-warmth pictures
 *  deliberately; see `peopleShots` below.
 *
 *  Files live in /public/photos, named by the SHA of their bytes, so the same
 *  photograph appearing in two places is stored once.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Photo = {
  file: string;
  category: "food" | "people" | "chef" | "interior" | "exterior" | "detail" | "signage" | "other";
  hasPeople: boolean;
  /** 0–10: how much of the restaurant's warmth this picture carries. */
  warmth: number;
  quality: number;
  orientation: "portrait" | "landscape" | "square";
  altEn: string;
  altTh: string;
  /** Menu dishes this photograph actually shows. */
  dishMatches: string[];
  bestUse: string;
  source: "archive" | "facebook" | "instagram";
};

export const photos: Photo[] = [
  {
    "file": "/photos/2ff8db8e9a7f.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Two pieces of crumbed wagyu katsu topped with black truffle slices on a blue speckled plate",
    "altTh": "วากิวคัตสึสองชิ้น วางทรัฟเฟิลดำด้านบน เสิร์ฟบนจานเซรามิกสีน้ำเงินลายจุด",
    "dishMatches": [
      "Wagyu katsu with black truffle"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/366b3e424e05.jpg",
    "category": "chef",
    "hasPeople": true,
    "warmth": 6,
    "quality": 9,
    "orientation": "portrait",
    "altEn": "Gloved chef's hands holding sea urchin on toasted bread with caviar while sprinkling gold flakes.",
    "altTh": "มือเชฟสวมถุงมือสีดำถือขนมปังปิ้งหน้าไข่หอยเม่นและคาเวียร์ กำลังโรยทองคำเปลวลงด้านบน",
    "dishMatches": [
      "Uni shokupan"
    ],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/78893251dcbe.jpg",
    "category": "interior",
    "hasPeople": false,
    "warmth": 2,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Curved marble sushi counter with blue chairs, painted wall murals and a blue noren at the kitchen.",
    "altTh": "เคาน์เตอร์ซูชิหินอ่อนทรงโค้ง เก้าอี้กำมะหยี่สีน้ำเงิน ผนังภาพวาดญี่ปุ่น และผ้าโนเรนหน้าครัว",
    "dishMatches": [],
    "bestUse": "counter",
    "source": "facebook"
  },
  {
    "file": "/photos/6f879f9e50fe.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 9,
    "orientation": "square",
    "altEn": "Close-up of nigiri on a dark blue plate: salmon with roe, seared beef, white fish and tamago",
    "altTh": "ภาพระยะใกล้ของนิงิริบนจานสีน้ำเงินเข้ม มีแซลมอนโปะไข่ปลา เนื้อย่าง ปลาเนื้อขาว และไข่หวานทามาโกะ",
    "dishMatches": [
      "Salmon sushi",
      "Tamago",
      "Seasonal nigiri"
    ],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/389c22685003.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 4,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Gloved chef's hand holding a black plate with a wagyu-wrapped cured egg yolk topped with caviar",
    "altTh": "มือเชฟสวมถุงมือยกจานดำ บนจานมีเนื้อวากิวห่อไข่แดงดอง แต้มคาเวียร์ด้านบน",
    "dishMatches": [
      "Wagyu Sun"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/12aae199fdf8.jpg",
    "category": "chef",
    "hasPeople": true,
    "warmth": 7,
    "quality": 9,
    "orientation": "square",
    "altEn": "Chef's bare hand holding a tuna nigiri topped with black truffle as shavings fall over it",
    "altTh": "มือเชฟถือซูชิปลาทูน่าที่วางทรัฟเฟิลดำไว้ด้านบน ขณะโรยเกล็ดทรัฟเฟิลลงมา",
    "dishMatches": [
      "Chūtoro sushi with fresh truffle"
    ],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/ad61e1d47ba5.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 6,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Gloved hand holding thick toast topped with sea urchin, caviar and small purple flowers",
    "altTh": "มือเชฟสวมถุงมือสีดำถือขนมปังชิ้นหนาที่วางอุนิ คาเวียร์ และดอกไม้สีม่วงเล็กๆ",
    "dishMatches": [
      "Uni shokupan",
      "Uni"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/b33e821d05b5.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 3,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Slices of seared beef on a black hot plate with onions, mushrooms and broccoli, steam rising.",
    "altTh": "เนื้อย่างหั่นชิ้นหนาวางบนจานร้อนสีดำ กับหอมใหญ่ เห็ด และบร็อกโคลี มีควันลอยขึ้น",
    "dishMatches": [
      "Wagyu yakiniku"
    ],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/b6e6bff9bdd4.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 6,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Hands hold a marble plate of sashimi while a wooden brush glazes the fish with sauce.",
    "altTh": "มือประคองจานลายหินอ่อนใส่ซาชิมิ ขณะใช้แปรงไม้ทาซอสลงบนเนื้อปลา",
    "dishMatches": [
      "Sashimi"
    ],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/c75e1799f0ce.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 4,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Gloved chef hand places a flower on four tuna nigiri topped with sea urchin, on a dark plate.",
    "altTh": "มือเชฟสวมถุงมือใช้แหนบวางดอกไม้บนซูชิทูน่าสี่คำที่โปะหอยเม่น บนจานสีเข้ม",
    "dishMatches": [
      "Uni"
    ],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/d672e43a5c58.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 1,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Seared salmon slices on a black plate with shiso, shredded daikon, salmon roe and a yellow flower.",
    "altTh": "แซลมอนย่างผิวสองชิ้นบนจานสีดำ วางคู่ใบชิโสะ หัวไชเท้าซอย ไข่ปลาแซลมอน และดอกเบญจมาศสีเหลือง",
    "dishMatches": [],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/e55b74c7148c.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 4,
    "quality": 9,
    "orientation": "landscape",
    "altEn": "Two hands hold a white bowl with green matcha mousse, dark crumble and orange flowers.",
    "altTh": "สองมือประคองจานขาวที่มีมูสมัทฉะสีเขียว โรยครัมเบิลช็อกโกแลต และแต่งด้วยดอกไม้สีส้ม",
    "dishMatches": [
      "Matcha mousse with crumble"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/88269e7643db.jpg",
    "category": "exterior",
    "hasPeople": false,
    "warmth": 5,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Suan Zen Omakase at dusk: lit yellow sign, wooden building and willow trees above the car park.",
    "altTh": "ร้าน Suan Zen Omakase ช่วงพลบค่ำ ป้ายไฟสีเหลือง อาคารไม้ และต้นไม้ริมลานจอดรถ",
    "dishMatches": [],
    "bestUse": "hero",
    "source": "instagram"
  },
  {
    "file": "/photos/8f693dfc3438.jpg",
    "category": "signage",
    "hasPeople": false,
    "warmth": 4,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "Lit Suan Zen Omakase signpost at night listing omakase seating times and izakaya bar hours.",
    "altTh": "ป้ายไฟร้าน Suan Zen Omakase ตอนกลางคืน บอกรอบโอมากาเสะและเวลาเปิดอิซากายะบาร์",
    "dishMatches": [],
    "bestUse": "after-dark",
    "source": "archive"
  },
  {
    "file": "/photos/0290e94ce2e9.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 5,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Gloved chef's hands plating slices of raw fish in a green glass bowl with red seaweed and a yellow flower",
    "altTh": "มือเชฟสวมถุงมือกำลังใช้แหนบจัดซาชิมิปลาดิบหลายชนิดลงในถ้วยแก้วสีเขียวทอง ตกแต่งด้วยสาหร่ายแดง ใบชิโสะ และดอกเบญจมาศสีเหลือง",
    "dishMatches": [
      "Sashimi"
    ],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/0d393fd3d14f.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 1,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Layered dessert in a small glass with matcha cream, crumb base and whipped cream, on a wooden board",
    "altTh": "ของหวานในแก้วใบเล็ก เรียงชั้นคุกกี้บด ครีมมัทฉะ และวิปครีมโรยผงมัทฉะ วางบนถาดไม้คู่กับดอกไม้สีแดงและชมพู",
    "dishMatches": [],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/5470cc5c5073.jpg",
    "category": "interior",
    "hasPeople": false,
    "warmth": 2,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Curved sushi counter with blue velvet chairs, wood-slat wall and a blue noren curtain behind it.",
    "altTh": "เคาน์เตอร์ซูชิทรงโค้ง เก้าอี้กำมะหยี่สีน้ำเงิน ผนังไม้ระแนง และผ้าโนเรนสีน้ำเงินด้านหลัง",
    "dishMatches": [],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/5d27adc7cdfe.jpg",
    "category": "chef",
    "hasPeople": true,
    "warmth": 8,
    "quality": 8,
    "orientation": "square",
    "altEn": "Seven staff behind the sushi counter, the head chef smiling in the centre with arms crossed.",
    "altTh": "ทีมงานเจ็ดคนยืนอยู่หลังเคาน์เตอร์ซูชิ เชฟใหญ่ยืนกอดอกยิ้มอยู่ตรงกลาง",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "facebook"
  },
  {
    "file": "/photos/28ac22598eee.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Layered dessert shots in small glasses on flower-shaped wooden trays with edible flowers",
    "altTh": "ของหวานในแก้วช็อตเรียงเป็นชั้น วางบนจานไม้รูปดอกไม้ ตกแต่งด้วยดอกไม้กินได้",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/2fe08ecfcc98.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 4,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Sliced grilled wagyu steaming on a hot black plate with onions, mushrooms, broccoli and carrot",
    "altTh": "เนื้อวากิวย่างหั่นชิ้น เสิร์ฟร้อน ๆ บนจานดำ พร้อมหอมใหญ่ เห็ด บรอกโคลี และแครอต",
    "dishMatches": [
      "Wagyu yakiniku"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/35e5b6674f55.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "Wooden trays of fresh sea urchin roe lined up in a row on a marble counter.",
    "altTh": "ถาดไม้ใส่ไข่หอยเม่นสดเรียงต่อกันเป็นแถวยาวบนเคาน์เตอร์หินอ่อน",
    "dishMatches": [
      "Uni"
    ],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/765a5e444077.jpg",
    "category": "chef",
    "hasPeople": true,
    "warmth": 6,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Gloved hands use tweezers to lift a piece of sea urchin roe from a wooden tray packed with uni.",
    "altTh": "มือเชฟสวมถุงมือสีดำใช้แหนบคีบไข่หอยเม่นออกจากลังไม้ที่เรียงอุนิไว้เต็ม",
    "dishMatches": [
      "Uni"
    ],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/64dbf648009a.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 3,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "Wooden trays packed with rows of orange sea urchin roe on a marble counter, rock garden behind",
    "altTh": "กล่องไม้ใส่อุนิเรียงเต็มวางไล่กันบนเคาน์เตอร์หินอ่อน ฉากหลังเป็นสวนหินและต้นสนดัด",
    "dishMatches": [
      "Uni"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/66f4b170541c.jpg",
    "category": "chef",
    "hasPeople": true,
    "warmth": 5,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Chef uses tweezers to place a flower on thin seared beef slices on a black pedestal plate",
    "altTh": "เชฟใช้ที่คีบวางดอกไม้กินได้ลงบนเนื้อย่างสไลซ์บางราดซอส จัดในจานสีดำทรงมีขา",
    "dishMatches": [
      "Wagyu tataki"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/6bc8d2e712c9.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 3,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Seared wagyu slices on a wire rack over sliced onion and a bamboo leaf in a black ceramic bowl",
    "altTh": "เนื้อวากิวย่างหั่นแว่น วางบนตะแกรงเหล็ก มีหอมใหญ่ซอยและใบไผ่รองอยู่ในชามเซรามิกสีดำ",
    "dishMatches": [
      "Wagyu tataki"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/71af8b4ee438.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 4,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "Wooden trays of fresh sea urchin lined up along a white marble sushi counter",
    "altTh": "กล่องไม้ใส่หอยเม่นสดเรียงยาวไปตามเคาน์เตอร์ซูชิหินอ่อนสีขาว",
    "dishMatches": [
      "Uni"
    ],
    "bestUse": "counter",
    "source": "instagram"
  },
  {
    "file": "/photos/7344e12b9637.jpg",
    "category": "people",
    "hasPeople": true,
    "warmth": 9,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "A family of four smiling at the sushi counter with the chef standing behind them",
    "altTh": "ครอบครัวสี่คนยิ้มให้กล้องที่เคาน์เตอร์ซูชิ โดยมีเชฟยืนอยู่ด้านหลัง",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "instagram"
  },
  {
    "file": "/photos/440ff65fffc2.jpg",
    "category": "interior",
    "hasPeople": false,
    "warmth": 3,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Curved marble omakase counter with blue velvet chairs, a blue noren curtain and painted wall murals",
    "altTh": "เคาน์เตอร์โอมากาเสะหินอ่อนโค้ง เก้าอี้กำมะหยี่สีน้ำเงิน ผ้าโนเรนสีน้ำเงิน และภาพวาดบนผนัง",
    "dishMatches": [],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/17dd4959b0e0.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Shredded crab meat and orange roe in a crab shell, set in a dark bowl with pebbles and a flower",
    "altTh": "เนื้อปูฉีกในกระดองปู โรยไข่ปลาสีส้ม จัดวางในชามเซรามิกสีเข้มที่ใส่กรวดและดอกไม้",
    "dishMatches": [
      "Zuwai kani"
    ],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/1f365022e967.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "White fish with crisp standing scales on a grilled lemon slice with orange sauce and edible flowers",
    "altTh": "ปลาเนื้อขาวทอดเกล็ดกรอบ วางบนเลมอนย่าง ราดซอสสีส้ม ตกแต่งด้วยดอกไม้กินได้",
    "dishMatches": [
      "Fine-dine amadai"
    ],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/269a79f26751.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Two seared salmon slices on shiso leaves with salmon roe and wasabi on a black plate",
    "altTh": "แซลมอนย่างผิวสองชิ้นวางบนใบชิโสะ เสิร์ฟกับไข่ปลาแซลมอนและวาซาบิบนจานสีดำ",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/fce7f6dd87bd.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 4,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Gloved hand holds a black dish with a wagyu round wrapped around a cured egg yolk topped with caviar",
    "altTh": "มือเชฟสวมถุงมือสีดำยื่นจานเซรามิกสีดำ บนจานเป็นเนื้อวากิวห่อไข่แดงดอง โรยคาเวียร์ด้านบน",
    "dishMatches": [
      "Wagyu Sun"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/a482957b80d2.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 5,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Chef brushing sauce onto a large prawn nigiri, its head and shell propped up beside the rice",
    "altTh": "เชฟใช้แปรงทาซอสลงบนซูชิกุ้งตัวใหญ่ โดยมีหัวและเปลือกกุ้งตั้งไว้ข้างๆ บนจานสีขาว",
    "dishMatches": [
      "Botan ebi sushi",
      "Ama ebi sushi"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/ab49be628b6e.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 4,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Close-up of a cut of beef being seared by blowtorch flame on a hot metal plate",
    "altTh": "ภาพระยะใกล้ของเนื้อวากิวที่กำลังถูกไฟจากหัวพ่นไฟลนบนแผ่นเหล็กร้อน",
    "dishMatches": [
      "Wagyu"
    ],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/8fba7190a1e6.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 4,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "Raw fish course with fanned cucumber, ikura and wasabi on dark ceramic plates along the sushi counter.",
    "altTh": "จานปลาดิบวางเรียงตามเคาน์เตอร์ซูชิ มีแตงกวาสไลซ์จัดเป็นพัด ไข่ปลาแซลมอน และวาซาบิ",
    "dishMatches": [],
    "bestUse": "counter",
    "source": "archive"
  },
  {
    "file": "/photos/90264c6dbb2d.jpg",
    "category": "signage",
    "hasPeople": false,
    "warmth": 3,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "Lit Suan Zen Omakase pole sign at night, with the restaurant's wooden fence and building behind it.",
    "altTh": "ป้ายไฟ Suan Zen Omakase ริมถนนตอนกลางคืน ด้านหลังเป็นรั้วไม้และตัวร้าน",
    "dishMatches": [],
    "bestUse": "after-dark",
    "source": "archive"
  },
  {
    "file": "/photos/9306a6431f10.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 6,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Hands placing a small round baked cake in parchment paper tied with a red ribbon on a wooden board.",
    "altTh": "มือกำลังวางเค้กชิ้นกลมในกระดาษรองผูกริบบิ้นแดงบนจานไม้",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/b691eb59a482.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 3,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "Round matcha mousse cake on a dark crumble base, on a wooden tray with a gold spoon beside it.",
    "altTh": "เค้กมูสชาเขียวทรงกลมบนฐานครัมเบิลสีเข้ม วางบนถาดไม้ มีช้อนสีทองวางข้าง ๆ",
    "dishMatches": [
      "Matcha mousse with crumble"
    ],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/c6640401024e.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 5,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Gloved hands use tweezers to place a flower on sashimi arranged in an amber glass plate.",
    "altTh": "มือสวมถุงมือสีดำใช้แหนบวางดอกไม้ลงบนซาชิมิในจานแก้วสีอำพัน",
    "dishMatches": [
      "Sashimi"
    ],
    "bestUse": "after-dark",
    "source": "archive"
  },
  {
    "file": "/photos/cac0b51e64fe.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Two slices of seared wagyu on a bamboo leaf with wasabi, pink salt and lime, on a white petal plate.",
    "altTh": "เนื้อวากิวย่างสองชิ้นวางบนใบไผ่ เสิร์ฟกับวาซาบิ เกลือสีชมพู และมะนาวฝาน บนจานขาวทรงกลีบดอกไม้",
    "dishMatches": [
      "Wagyu"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/ea8212d3faff.jpg",
    "category": "chef",
    "hasPeople": true,
    "warmth": 6,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "A hand places edible flowers with tweezers beside a pale set dessert and crumble on a blue speckled plate.",
    "altTh": "มือใช้แหนบวางดอกไม้กินได้ ข้างขนมเนื้อครีมสีขาวและครัมเบิล บนจานเซรามิกสีน้ำเงิน",
    "dishMatches": [],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/ee3160d17d48.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 6,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Two pairs of hands hold a gold-rimmed plate of shellfish meat with lemon, marigold and orange sauce.",
    "altTh": "สองมือประคองจานขอบทองที่มีเนื้ออาหารทะเล เสิร์ฟกับมะนาวฝาน ดอกไม้ และซอสสีส้ม",
    "dishMatches": [],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/f61f916d4040.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 8,
    "orientation": "landscape",
    "altEn": "Crab shell of shredded crab meat topped with orange roe, in a dark pebble-filled bowl with a white flower.",
    "altTh": "กระดองปูใส่เนื้อปูฉีกโรยไข่ปลาสีส้ม วางบนกรวดในชามสีเข้ม ประดับดอกไม้สีขาว",
    "dishMatches": [],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/95d9b8ba471b.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 3,
    "quality": 8,
    "orientation": "square",
    "altEn": "Scallop with yellow sauce and salmon roe on rice in a nori wrap, on a frosted glass plate.",
    "altTh": "หอยเชลล์ราดซอสสีเหลือง โรยไข่ปลาแซลมอน วางบนข้าวห่อสาหร่าย เสิร์ฟบนจานแก้วฝ้า",
    "dishMatches": [],
    "bestUse": "course-card",
    "source": "archive"
  },
  {
    "file": "/photos/99d1e74b1c9c.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 3,
    "quality": 8,
    "orientation": "portrait",
    "altEn": "Wooden trays of fresh sea urchin on a marble counter, with a bonsai and moss garden behind.",
    "altTh": "ลังไม้ใส่หอยเม่นสดวางเรียงบนเคาน์เตอร์หินอ่อน ด้านหลังเป็นสวนมอสและต้นบอนไซ",
    "dishMatches": [
      "Uni"
    ],
    "bestUse": "counter",
    "source": "archive"
  },
  {
    "file": "/photos/09722e03bfec.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 1,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "Seared beef roll around a raw egg yolk, topped with caviar and spring onion, on a dark plate",
    "altTh": "เนื้อย่างม้วนเป็นวงล้อมไข่แดงดิบ ราดด้วยคาเวียร์และต้นหอมซอย วางบนจานสีเข้มพร้อมแผ่นกรอบและซอสสีดำ",
    "dishMatches": [],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/5138120a936b.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 5,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "A hand holding a nori hand roll filled with sea urchin, topped with caviar and wasabi.",
    "altTh": "มือถือแฮนด์โรลสาหร่ายใส่หอยเม่น โรยคาเวียร์และวาซาบิด้านบน",
    "dishMatches": [
      "Uni handroll"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/27af6b0044e7.jpg",
    "category": "people",
    "hasPeople": true,
    "warmth": 9,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "Two guests and a chef in the dining room, smiling behind a large pink and white flower bouquet",
    "altTh": "แขกสองคนกับเชฟยืนยิ้มถือช่อดอกไม้สีชมพูขาวช่อใหญ่ในร้าน",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "instagram"
  },
  {
    "file": "/photos/365dbb1ce96e.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 3,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "Tuna nigiri topped with sea urchin roe and black caviar on a pale stone counter.",
    "altTh": "ซูชิหน้าปลาทูน่าเนื้อแดง วางไข่หอยเม่นและคาเวียร์ดำไว้ด้านบน ตั้งอยู่บนเคาน์เตอร์หิน",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/774005717ee8.jpg",
    "category": "people",
    "hasPeople": true,
    "warmth": 9,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "Five smiling guests and the chef give thumbs up in front of the lit Suan Zen Omakase sign.",
    "altTh": "กลุ่มลูกค้าถ่ายรูปกับเชฟหน้าป้ายไฟโลโก้ร้าน ทุกคนยิ้มและชูนิ้วโป้ง",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "instagram"
  },
  {
    "file": "/photos/5f578e092628.jpg",
    "category": "people",
    "hasPeople": true,
    "warmth": 9,
    "quality": 7,
    "orientation": "square",
    "altEn": "Family of five smiling at the sushi counter, two holding jasmine garlands, garden seen through glass",
    "altTh": "ครอบครัวห้าคนนั่งเรียงกันที่เคาน์เตอร์ซูชิ ยิ้มให้กล้อง สองคนถือพวงมาลัยดอกมะลิ ด้านหลังเป็นสวนญี่ปุ่นหลังกระจก",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "facebook"
  },
  {
    "file": "/photos/37a1d0f237df.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 6,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "Sliced grilled wagyu on a stone plate with broccoli, carrot and mushroom, more plates along the counter",
    "altTh": "เนื้อวากิวย่างหั่นชิ้นวางบนจานหินพร้อมบร็อคโคลี แครอท และเห็ด เรียงต่อกันไปตามเคาน์เตอร์",
    "dishMatches": [
      "Wagyu yakiniku"
    ],
    "bestUse": "dish-hover",
    "source": "archive"
  },
  {
    "file": "/photos/38ff80cea090.jpg",
    "category": "chef",
    "hasPeople": true,
    "warmth": 8,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "Chef in a grey jacket standing with a smiling guest in front of the backlit Suan Zen logo at the entrance",
    "altTh": "เชฟในเสื้อกุ๊กสีเทายืนถ่ายรูปกับลูกค้าหน้าโลโก้ Suan Zen ที่ผนังไม้ทางเข้าร้าน",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "instagram"
  },
  {
    "file": "/photos/90c15a8c6bb5.jpg",
    "category": "people",
    "hasPeople": true,
    "warmth": 9,
    "quality": 7,
    "orientation": "square",
    "altEn": "Seven guests posing together at the counter, three of them holding Thai jasmine garlands.",
    "altTh": "ลูกค้าเจ็ดคนถ่ายรูปหมู่ที่เคาน์เตอร์ บางคนถือพวงมาลัยดอกมะลิ",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "facebook"
  },
  {
    "file": "/photos/f7a436a6e9ed.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 3,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "Molded custard dessert in orange sauce with edible flowers, a jasmine garland and crane wall mural behind.",
    "altTh": "ขนมเนื้อคัสตาร์ดในซอสสีส้ม ประดับดอกไม้ ด้านหลังมีพวงมาลัยมะลิและผนังไม้ลายนกกระเรียน",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "instagram"
  },
  {
    "file": "/photos/9cac501b1874.jpg",
    "category": "chef",
    "hasPeople": true,
    "warmth": 6,
    "quality": 7,
    "orientation": "portrait",
    "altEn": "Chef searing seafood with a blowtorch over a small charcoal grill at the counter, flame rising.",
    "altTh": "เชฟใช้ไฟพ่นย่างอาหารทะเลบนเตาถ่านเล็กที่เคาน์เตอร์ เปลวไฟลุกสูง",
    "dishMatches": [],
    "bestUse": "hero",
    "source": "archive"
  },
  {
    "file": "/photos/8d522dab888f.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 5,
    "quality": 6,
    "orientation": "portrait",
    "altEn": "Caramel custard in a brown-rimmed bowl with a pink flower, beside a jasmine garland on a stand.",
    "altTh": "พุดดิ้งคาราเมลในถ้วยขอบน้ำตาล แต่งดอกไม้สีชมพู วางข้างพวงมาลัยมะลิบนขาตั้ง ฉากหลังลายนกกระเรียน",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/00524b6b30ad.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 6,
    "orientation": "portrait",
    "altEn": "Rows of rectangular plates on a prep counter, each with baby squid in dark sauce and a yellow flower",
    "altTh": "จานสี่เหลี่ยมเรียงเป็นแถวบนเคาน์เตอร์เตรียมอาหาร แต่ละจานมีปลาหมึกตัวเล็กราดซอสสีเข้ม วางคู่ดอกเบญจมาศเหลืองและใบไม้",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/4a906697f15e.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 6,
    "quality": 6,
    "orientation": "square",
    "altEn": "Raw sweet shrimp heads standing upright on a sushi plate, with diners blurred behind the counter.",
    "altTh": "หัวกุ้งดิบตั้งขึ้นบนจานซูชิ ด้านหลังเป็นแขกนั่งอยู่ริมเคาน์เตอร์แบบเบลอ ๆ",
    "dishMatches": [
      "Ama ebi sushi",
      "Botan ebi sushi"
    ],
    "bestUse": "gallery",
    "source": "facebook"
  },
  {
    "file": "/photos/2dc2687c3de2.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 6,
    "orientation": "landscape",
    "altEn": "Torched glazed fish on a slice of white bread topped with salmon roe, on a shiso leaf",
    "altTh": "ปลาย่างไฟราดซอส วางบนขนมปังขาว โรยไข่ปลาแซลมอนและต้นหอม บนใบชิโสะ",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/331c65656530.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 6,
    "orientation": "portrait",
    "altEn": "Rice porridge topped with salmon roe, spring onion and fried garlic in a patterned ceramic bowl.",
    "altTh": "โจ๊กในชามเซรามิกลายเส้น โรยไข่ปลาแซลมอน ต้นหอมซอย และกระเทียมเจียว วางบนจานรองพร้อมช้อน",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/376fc5480825.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 5,
    "quality": 6,
    "orientation": "square",
    "altEn": "Two plates of seared salmon sashimi with salmon roe and greens on a sushi counter, citrus behind.",
    "altTh": "ซาชิมิแซลมอนย่างไฟสองจานวางบนเคาน์เตอร์ซูชิ มีไข่ปลาแซลมอนและผักเคียง ด้านหลังมีเลมอนกับมะนาวเขียว",
    "dishMatches": [
      "Sashimi"
    ],
    "bestUse": "counter",
    "source": "facebook"
  },
  {
    "file": "/photos/7a499d55cbba.jpg",
    "category": "people",
    "hasPeople": true,
    "warmth": 9,
    "quality": 6,
    "orientation": "portrait",
    "altEn": "Family of five posing behind a birthday cake with lit candles at a table beside the garden windows.",
    "altTh": "ครอบครัวห้าคนถ่ายรูปหลังเค้กวันเกิดที่จุดเทียนอยู่ ริมกระจกที่มองเห็นสวนด้านนอก",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "instagram"
  },
  {
    "file": "/photos/5e288e7be59e.jpg",
    "category": "people",
    "hasPeople": true,
    "warmth": 8,
    "quality": 6,
    "orientation": "portrait",
    "altEn": "Guests along the omakase counter watch a chef work; one holds up a phone to photograph the food",
    "altTh": "แขกนั่งเรียงกันที่เคาน์เตอร์โอมากาเสะ มองเชฟเตรียมอาหารอยู่ด้านหลังเคาน์เตอร์ คนหนึ่งยกมือถือขึ้นถ่ายรูป",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "instagram"
  },
  {
    "file": "/photos/661acb502e4f.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 4,
    "quality": 6,
    "orientation": "landscape",
    "altEn": "Chopsticks placing gold leaf onto salmon roe in a small wooden bowl with tiny edible flowers",
    "altTh": "ตะเกียบคีบทองคำเปลววางลงบนไข่ปลาแซลมอนในถ้วยไม้ใบเล็ก โรยดอกไม้กินได้",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/42a586ebc854.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 6,
    "orientation": "landscape",
    "altEn": "Raw shrimp nigiri topped with grated cured egg yolk, shrimp head standing behind on a white plate",
    "altTh": "ซูชิกุ้งดิบโรยไข่แดงดองขูดฝอย มีหัวกุ้งตั้งอยู่ด้านหลังบนจานเซรามิกสีขาว",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/a86260877be7.jpg",
    "category": "exterior",
    "hasPeople": false,
    "warmth": 3,
    "quality": 6,
    "orientation": "landscape",
    "altEn": "Suan Zen's lit yellow street sign and wooden restaurant building at dusk, seen from the car park",
    "altTh": "ป้ายไฟสีเหลืองของร้าน Suan Zen และตัวอาคารไม้ในช่วงหัวค่ำ มองจากลานจอดรถ",
    "dishMatches": [],
    "bestUse": "after-dark",
    "source": "archive"
  },
  {
    "file": "/photos/af2e9571bac6.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 6,
    "orientation": "portrait",
    "altEn": "Seared foie gras on grains with orange roe and caviar, with orange, kiwi and a yellow flower",
    "altTh": "ฟัวกราส์ย่างวางบนธัญพืช โรยไข่ปลาสีส้มและคาเวียร์ดำ เสิร์ฟคู่กับส้ม กีวี และดอกเบญจมาศสีเหลืองบนจานขอบทอง",
    "dishMatches": [
      "Foie gras designed by Suan Zen"
    ],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/e2d46173b8ac.jpg",
    "category": "people",
    "hasPeople": true,
    "warmth": 8,
    "quality": 6,
    "orientation": "square",
    "altEn": "Guests seated at the sushi counter at night, with dessert plates being finished in the foreground.",
    "altTh": "ลูกค้านั่งที่เคาน์เตอร์ซูชิในช่วงค่ำ ด้านหน้ามีการจัดของหวานอยู่บนถาดไม้",
    "dishMatches": [],
    "bestUse": "people-warmth",
    "source": "facebook"
  },
  {
    "file": "/photos/f26846b90108.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 6,
    "orientation": "portrait",
    "altEn": "Crab shell filled with rice, crab meat and orange roe, set in a stone-filled bowl with yellow chrysanthemums.",
    "altTh": "กระดองปูใส่ข้าว เนื้อปู และไข่ปลาสีส้ม วางในชามกรวด ประดับดอกเบญจมาศสีเหลือง",
    "dishMatches": [],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/9962feecc2f7.jpg",
    "category": "food",
    "hasPeople": false,
    "warmth": 2,
    "quality": 6,
    "orientation": "portrait",
    "altEn": "A row of wooden uni trays along a marble counter, beside a wood wall painted with a tree.",
    "altTh": "ลังไม้ใส่อุนิเรียงยาวไปตามเคาน์เตอร์หินอ่อน ข้างผนังไม้ที่มีภาพวาดต้นไม้",
    "dishMatches": [
      "Uni"
    ],
    "bestUse": "gallery",
    "source": "archive"
  },
  {
    "file": "/photos/b63e98c7df99.jpg",
    "category": "food",
    "hasPeople": true,
    "warmth": 4,
    "quality": 5,
    "orientation": "landscape",
    "altEn": "Slices of seared and raw fish on a dark ceramic plate with salmon roe, wasabi and a yellow chrysanthemum.",
    "altTh": "ปลาดิบและปลาย่างวางบนจานเซรามิกสีเข้ม มีไข่ปลาแซลมอน วาซาบิ และดอกเบญจมาศสีเหลือง",
    "dishMatches": [
      "Sashimi"
    ],
    "bestUse": "gallery",
    "source": "archive"
  }
];

/** The pictures with people in them — the ones the room is actually about. */
export const peopleShots = photos
  .filter((p) => p.hasPeople || p.warmth >= 7)
  .sort((a, b) => b.warmth * b.quality - a.warmth * a.quality);

export const foodShots = photos.filter((p) => p.category === "food" || p.category === "detail");
export const roomShots = photos.filter((p) => p.category === "interior" || p.category === "exterior" || p.category === "signage");

export const byFile = (f: string) => photos.find((p) => p.file === f || p.file.endsWith("/" + f));

/** Photographs that show a given dish, best first. */
export const shotsForDish = (dish: string) =>
  photos
    .filter((p) => p.dishMatches.some((d) => d.toLowerCase() === dish.toLowerCase()))
    .sort((a, b) => b.quality - a.quality);
