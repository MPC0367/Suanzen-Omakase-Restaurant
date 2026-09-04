/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  COPY — EN / TH
 * ─────────────────────────────────────────────────────────────────────────────
 *  Thai is written as Thai, not translated from the English. The two languages
 *  say the same thing; they do not say it the same way.
 *
 *  Banned on both sides: culinary journey, indulge, elevate, tradition meets
 *  innovation / ดื่มด่ำ, สัมผัส, ยกระดับ, รังสรรค์, เหนือระดับ, ที่สุดแห่ง.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Locale = "en" | "th";
export const locales: Locale[] = ["en", "th"];
export const defaultLocale: Locale = "en";

export const dict = {
  en: {
    htmlLang: "en",
    localeName: "English",
    switchTo: "ไทย",
    switchToLabel: "อ่านภาษาไทย",

    nav: {
      courses: "Courses",
      garden: "The Garden",
      counter: "The Counter",
      afterDark: "After Dark",
      gallery: "Gallery",
      visit: "Visit",
      journal: "Journal",
      book: "Book",
      reserve: "Reserve",
      menu: "Menu",
      close: "Close",
    },

    cta: {
      reserve: "Reserve",
      reserveLine: "Reserve on LINE",
      viewCourses: "View courses",
      directions: "Directions",
      call: "Call",
      viewAll: "View all",
      viewInstagram: "View Instagram",
      askOnLine: "Ask on LINE",
      back: "Back",
    },

    hero: {
      place: "Nonthaburi · Thailand",
      brand: "Suan Zen",
      category: "Omakase",
      headline: ["Omakase,", "inside the garden."],
      standfirst:
        "A counter in Nonthaburi. A few seats each seating, one course at a time, handed to you by the chef who made it.",
      scroll: "Scroll",
    },

    proposition: {
      label: "Suan Zen",
      heading: "Suan means garden.",
      body: "The name came first, and the room grew into it. You park, you walk in past the planting, and the noise of the road stops somewhere behind you. Then there is a counter, a chef, and about two hours.",
      aside: "Nonthaburi, not central Bangkok. That is the point, not the excuse.",
    },

    garden: {
      label: "The Garden",
      heading: "Arrive slowly.",
      body: "The address is a soi off Nonthaburi 48, and there is parking — which in this city is a kind of hospitality on its own. The garden does the rest of the work before you sit down.",
      captions: [
        "The sign, after dark",
        "The way in",
        "Planting along the walk",
        "The door",
      ],
    },

    counter: {
      label: "The Counter",
      heading: "Everything happens in front of you.",
      body: "No pass, no kitchen door. The fish is cut, the rice is formed, the piece is finished and set down within arm's reach. You can watch all of it, or you can talk through it. Both are fine.",
      points: [
        { k: "Seating", v: "Counter, by round" },
        { k: "Length", v: "About two hours" },
        { k: "Allergies", v: "Tell us when you book" },
      ],
    },

    coursesSection: {
      label: "The Courses",
      heading: "Choose the length of the evening.",
      body: "Ichi, ni, san, yon — one, two, three, four. The ladder is the number of bites and the time you spend on them. Prices are quoted ++.",
      pieces: "bites",
      onRequest: "On request",
      onRequestHint: "Current price and length on LINE",
      firstTimers: "Most first visits start here",
      partialNote: "A selection — the full course runs longer",
      hoverHint: "Point at a dish to see it",
      tapHint: "Tap a dish to see it",
      alaLabel: "À la carte",
      footnote:
        "Courses follow the market, so the sequence changes. Ask for the current one when you book.",
    },

    afterDark: {
      label: "After Dark",
      heading: "The bar stays open.",
      body: "Thursday to Saturday the counter turns over and the izakaya opens until midnight. No course, no round — sit down, order, stay.",
      hoursLabel: "Izakaya",
    },

    gallery: {
      label: "Gallery",
      heading: "The room, the counter, the plate.",
      body: "Photography from the restaurant.",
      open: "Open image",
      of: "of",
      prev: "Previous",
      next: "Next",
      close: "Close",
    },

    social: {
      label: "From Suan Zen",
      heading: "What is on the counter now.",
      body: "The kitchen posts the current courses, the fish that came in, and the nights the bar is busy.",
      handle: "@suanzenomakase",
    },

    visit: {
      label: "Visit",
      heading: "Nonthaburi 48",
      addressLabel: "Address",
      hoursLabel: "Hours",
      seatingsLabel: "Seatings",
      contactLabel: "Contact",
      parkingLabel: "Parking",
      parkingValue: "On site",
      everyday: "Every day",
      lateNights: "Thursday – Saturday",
      mapAria: "Map showing Suan Zen Omakase in Nonthaburi",
      mapHint: "Open in Google Maps",
    },

    reserve: {
      label: "Reserve",
      heading: "Book a round.",
      body: "Reservations go through LINE — it is the fastest way to reach the restaurant and to confirm a seating.",
      panelHeading: "Reserve a seating",
      panelBody:
        "Message the restaurant on LINE with your date, the seating you want, and how many are coming.",
      scanLabel: "Scan to open LINE",
      orCall: "Or call",
      chooseCourse: "Course",
      anyCourse: "Undecided",
      seatingsNote: "Seatings",
      dietaryHeading: "Allergies and diets",
      lead: "Seatings are limited. A few days ahead is safest.",
    },

    footer: {
      tagline: "Omakase in Nonthaburi",
      rights: "All rights reserved.",
      followUs: "Follow",
      builtNote: "Site content updated from the restaurant.",
    },

    a11y: {
      skip: "Skip to content",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      toTop: "Back to top",
      loading: "Loading",
      brandMark: "Suan Zen Omakase",
    },


    booking: {
      label: "Book a table",
      heading: "Book a seating.",
      intro:
        "Choose a date and a seating, tell us who is coming, and we will confirm on LINE. Nothing is charged here.",
      steps: ["Date", "Seating", "Course", "Guests", "You", "Check"],
      stepOf: "Step",
      of: "of",
      next: "Continue",
      back: "Back",
      submit: "Send request",
      sending: "Sending…",

      dateHeading: "Which day?",
      dateHint: "Seatings open 30 days ahead.",
      closedDay: "Closed",
      todayLate: "Too late for today's seatings — try tomorrow.",

      seatingHeading: "Which seating?",
      seatingHint: "Each seating runs about two hours.",
      seatingFull: "Full",
      lunch: "Lunch",
      dinner: "Dinner",

      courseHeading: "Which course?",
      courseHint: "You can change this at the counter.",
      undecided: "Decide later",
      undecidedHint: "The chef will talk you through it when you sit down.",

      partyHeading: "How many of you?",
      partyHint: "For six or more, message us on LINE and we will arrange it.",
      guest: "guest",
      guests: "guests",

      contactHeading: "Who shall we confirm with?",
      name: "Name",
      phone: "Phone",
      lineId: "LINE ID",
      lineIdHint: "Optional — the fastest way for us to reach you.",
      notes: "Allergies, anything you don't eat, or an occasion",
      notesHint: "The chef adjusts the course. Please tell us now rather than on the night.",
      optional: "optional",
      required: "required",

      reviewHeading: "Does this look right?",
      edit: "Change",

      errName: "Please tell us your name.",
      errPhone: "Please give a Thai mobile number we can reach you on.",
      errDate: "Please choose a date.",
      errSeating: "Please choose a seating.",
      errParty: "Please choose how many are coming.",
      errSend: "That didn't send. Please try again, or message us on LINE.",

      doneHeading: "Request received.",
      doneBody:
        "This is a request, not a confirmed table. We will message you on LINE or call to confirm the seating — usually the same day.",
      reference: "Reference",
      doneLine: "Message us on LINE",
      doneAgain: "Book another seating",
      notConfirmed: "Not confirmed until we reply",
      staticHeading: "Send this to us on LINE.",
      staticBody:
        "Copy the message below and send it to the restaurant on LINE. We will confirm your seating from there.",
      copy: "Copy the message",
      copied: "Copied",
    },

    journal: {
      label: "Journal",
      heading: "What has been on the counter.",
      intro:
        "The kitchen posts most days — the fish that came in, the course as it stands, the nights the bar runs late. This is that, in order.",
      all: "Everything",
      categories: {
        courses: "Courses",
        counter: "The counter",
        garden: "The garden",
        afterDark: "After dark",
        moments: "Moments",
      },
      empty: "Nothing filed under that yet.",
      openOnInstagram: "Open on Instagram",
      posted: "Posted",
      showing: "Showing",
      entries: "entries",
      followLine: "Everything as it happens is on Instagram.",
      awaitingMedia: "Photograph to follow",
    },


    warmth: {
      label: "The room",
      heading: "Most of what happens here isn't on a plate.",
      body: "Birthdays at the counter. Families who take the whole row. The chef leaning over to explain what just arrived. This is the part guests photograph, and the part they come back for.",
      cta: "See the room",
    },

    ala: {
      label: "À la carte",
      heading: "Not every night is a course.",
      body: "Thursday to Saturday the bar runs late and the kitchen serves single dishes alongside the omakase.",
      pending: "The à la carte list changes with the market, so we keep it at the counter rather than online. Message us on LINE and we will send you what is on tonight.",
      askOnLine: "Ask for tonight's list",
      served: "Served",
    },

    meta: {
      title: "Suan Zen Omakase — Omakase in Nonthaburi",
      description:
        "A counter omakase in Nonthaburi. Fixed seatings, courses served one at a time, and an izakaya bar Thursday to Saturday. Reserve on LINE.",
      ogAlt: "Suan Zen Omakase, Nonthaburi",
    },
  },

  th: {
    htmlLang: "th",
    localeName: "ไทย",
    switchTo: "EN",
    switchToLabel: "Read in English",

    nav: {
      courses: "คอร์ส",
      garden: "สวน",
      counter: "เคาน์เตอร์",
      afterDark: "อิซากายะ",
      gallery: "รูปภาพ",
      visit: "การเดินทาง",
      journal: "บันทึกร้าน",
      book: "จองโต๊ะ",
      reserve: "จองรอบ",
      menu: "เมนู",
      close: "ปิด",
    },

    cta: {
      reserve: "จองรอบ",
      reserveLine: "จองผ่าน LINE",
      viewCourses: "ดูคอร์ส",
      directions: "นำทาง",
      call: "โทร",
      viewAll: "ดูรูปทั้งหมด",
      viewInstagram: "ดู Instagram",
      askOnLine: "สอบถามทาง LINE",
      back: "ย้อนกลับ",
    },

    hero: {
      place: "นนทบุรี · ประเทศไทย",
      brand: "สวน เซน",
      category: "โอมากาเสะ",
      headline: ["โอมากาเสะ", "ในสวน"],
      standfirst:
        "เคาน์เตอร์เล็ก ๆ ในนนทบุรี รอบละไม่กี่ที่นั่ง เสิร์ฟทีละคำ จากมือเชฟตรงหน้าคุณ",
      scroll: "เลื่อนลง",
    },

    proposition: {
      label: "สวน เซน",
      heading: "ชื่อร้านเริ่มจากคำว่า “สวน”",
      body: "จอดรถ เดินผ่านต้นไม้เข้ามา เสียงถนนก็ค่อย ๆ หายไปข้างหลัง จากนั้นก็มีแค่เคาน์เตอร์ เชฟ และเวลาอีกประมาณสองชั่วโมง",
      aside: "อยู่นนทบุรี ไม่ใช่กลางกรุงเทพฯ — ตั้งใจให้เป็นแบบนั้น",
    },

    garden: {
      label: "สวน",
      heading: "ค่อย ๆ เข้ามา",
      body: "ร้านอยู่ในซอยนนทบุรี 48 มีที่จอดรถ ซึ่งในเมืองนี้ก็ถือเป็นการต้อนรับอย่างหนึ่ง ที่เหลือสวนจัดการให้ก่อนคุณจะนั่งลง",
      captions: ["ป้ายร้านตอนค่ำ", "ทางเข้า", "ต้นไม้ริมทางเดิน", "ประตู"],
    },

    counter: {
      label: "เคาน์เตอร์",
      heading: "ทุกอย่างเกิดขึ้นตรงหน้าคุณ",
      body: "ไม่มีครัวหลังบ้าน ปลาถูกแล่ ข้าวถูกปั้น คำนั้นเสร็จแล้ววางลงตรงหน้า จะนั่งดูเงียบ ๆ หรือคุยกับเชฟไปด้วยก็ได้",
      points: [
        { k: "ที่นั่ง", v: "เคาน์เตอร์ แบ่งเป็นรอบ" },
        { k: "ใช้เวลา", v: "ประมาณสองชั่วโมง" },
        { k: "อาหารที่แพ้", v: "แจ้งตอนจองได้เลย" },
      ],
    },

    coursesSection: {
      label: "คอร์ส",
      heading: "เลือกความยาวของค่ำคืน",
      body: "อิจิ นิ ซัง ยอน — หนึ่ง สอง สาม สี่ ไล่ตามจำนวนคำและเวลาที่ใช้ ราคายังไม่รวม ++",
      pieces: "คำ",
      onRequest: "สอบถาม",
      onRequestHint: "ถามราคาและจำนวนคำล่าสุดทาง LINE",
      firstTimers: "คนมาครั้งแรกส่วนใหญ่เริ่มที่คอร์สนี้",
      partialNote: "เป็นตัวอย่าง — คอร์สจริงยาวกว่านี้",
      hoverHint: "ชี้ที่ชื่อคำเพื่อดูรูป",
      tapHint: "แตะที่ชื่อคำเพื่อดูรูป",
      alaLabel: "อาหารตามสั่ง",
      footnote: "คอร์สเปลี่ยนตามวัตถุดิบที่เข้ามา ถามคอร์สล่าสุดตอนจองได้เลย",
    },

    afterDark: {
      label: "อิซากายะ",
      heading: "บาร์เปิดต่อ",
      body: "พฤหัสฯ ถึงเสาร์ หลังรอบสุดท้าย บาร์เปิดยาวถึงเที่ยงคืน ไม่ต้องเป็นคอร์ส ไม่ต้องมีรอบ นั่ง สั่ง แล้วอยู่ต่อได้",
      hoursLabel: "อิซากายะ",
    },

    gallery: {
      label: "รูปภาพ",
      heading: "ห้อง เคาน์เตอร์ และจาน",
      body: "ภาพจากทางร้าน",
      open: "เปิดรูป",
      of: "จาก",
      prev: "ก่อนหน้า",
      next: "ถัดไป",
      close: "ปิด",
    },

    social: {
      label: "จากที่ร้าน",
      heading: "ตอนนี้มีอะไรอยู่บนเคาน์เตอร์",
      body: "ทางร้านลงคอร์สล่าสุด ปลาที่เพิ่งเข้า และคืนที่บาร์คนแน่น",
      handle: "@suanzenomakase",
    },

    visit: {
      label: "การเดินทาง",
      heading: "นนทบุรี 48",
      addressLabel: "ที่อยู่",
      hoursLabel: "เวลาเปิด",
      seatingsLabel: "รอบเสิร์ฟ",
      contactLabel: "ติดต่อ",
      parkingLabel: "ที่จอดรถ",
      parkingValue: "มีที่จอดรถ",
      everyday: "ทุกวัน",
      lateNights: "พฤหัสบดี – เสาร์",
      mapAria: "แผนที่ร้าน สวน เซน โอมากาเสะ นนทบุรี",
      mapHint: "เปิดใน Google Maps",
    },

    reserve: {
      label: "จองรอบ",
      heading: "จองรอบของคุณ",
      body: "จองผ่าน LINE เป็นช่องทางที่เร็วที่สุด และได้ยืนยันรอบแน่นอน",
      panelHeading: "จองรอบ",
      panelBody: "ทักไลน์ร้าน บอกวันที่ รอบที่ต้องการ และจำนวนคน",
      scanLabel: "สแกนเพื่อเปิด LINE",
      orCall: "หรือโทร",
      chooseCourse: "คอร์ส",
      anyCourse: "ยังไม่ได้เลือก",
      seatingsNote: "รอบเสิร์ฟ",
      dietaryHeading: "อาหารที่แพ้และข้อจำกัด",
      lead: "ที่นั่งต่อรอบมีจำกัด จองล่วงหน้าสักสองสามวันจะดีที่สุด",
    },

    footer: {
      tagline: "โอมากาเสะ นนทบุรี",
      rights: "สงวนลิขสิทธิ์",
      followUs: "ติดตาม",
      builtNote: "ข้อมูลอัปเดตจากทางร้าน",
    },

    a11y: {
      skip: "ข้ามไปยังเนื้อหา",
      openMenu: "เปิดเมนู",
      closeMenu: "ปิดเมนู",
      toTop: "กลับขึ้นด้านบน",
      loading: "กำลังโหลด",
      brandMark: "สวน เซน โอมากาเสะ",
    },


    booking: {
      label: "จองโต๊ะ",
      heading: "จองรอบ",
      intro: "เลือกวันและรอบ บอกจำนวนคน แล้วทางร้านจะยืนยันทาง LINE ไม่มีการเก็บเงินตรงนี้",
      steps: ["วันที่", "รอบ", "คอร์ส", "จำนวนคน", "ผู้จอง", "ตรวจสอบ"],
      stepOf: "ขั้นที่",
      of: "จาก",
      next: "ถัดไป",
      back: "ย้อนกลับ",
      submit: "ส่งคำขอจอง",
      sending: "กำลังส่ง…",

      dateHeading: "วันไหนดี",
      dateHint: "เปิดให้จองล่วงหน้า 30 วัน",
      closedDay: "ปิด",
      todayLate: "วันนี้เลยเวลารอบสุดท้ายแล้ว ลองพรุ่งนี้",

      seatingHeading: "รอบไหน",
      seatingHint: "แต่ละรอบใช้เวลาประมาณสองชั่วโมง",
      seatingFull: "เต็ม",
      lunch: "กลางวัน",
      dinner: "เย็น",

      courseHeading: "คอร์สไหน",
      courseHint: "เปลี่ยนหน้าเคาน์เตอร์ได้",
      undecided: "ยังไม่เลือก",
      undecidedHint: "เชฟจะแนะนำให้ตอนนั่งลง",

      partyHeading: "มากันกี่คน",
      partyHint: "ถ้าหกคนขึ้นไป ทักไลน์มาได้เลย ทางร้านจัดให้",
      guest: "คน",
      guests: "คน",

      contactHeading: "ยืนยันกลับที่ใคร",
      name: "ชื่อ",
      phone: "เบอร์โทร",
      lineId: "LINE ID",
      lineIdHint: "ไม่บังคับ — แต่ติดต่อกลับได้เร็วที่สุด",
      notes: "อาหารที่แพ้ ของที่ไม่ทาน หรือโอกาสพิเศษ",
      notesHint: "เชฟปรับคอร์สให้ได้ แจ้งตอนนี้ดีกว่าแจ้งหน้างาน",
      optional: "ไม่บังคับ",
      required: "ต้องกรอก",

      reviewHeading: "ตรวจดูอีกครั้ง",
      edit: "แก้ไข",

      errName: "กรุณากรอกชื่อ",
      errPhone: "กรุณากรอกเบอร์มือถือที่ติดต่อได้",
      errDate: "กรุณาเลือกวันที่",
      errSeating: "กรุณาเลือกรอบ",
      errParty: "กรุณาเลือกจำนวนคน",
      errSend: "ส่งไม่สำเร็จ ลองอีกครั้ง หรือทักไลน์ร้านได้เลย",

      doneHeading: "ได้รับคำขอจองแล้ว",
      doneBody:
        "นี่คือคำขอจอง ยังไม่ใช่การยืนยัน ทางร้านจะทักไลน์หรือโทรกลับเพื่อยืนยันรอบ ส่วนใหญ่ภายในวันเดียวกัน",
      reference: "เลขอ้างอิง",
      doneLine: "ทักไลน์ร้าน",
      doneAgain: "จองอีกรอบ",
      notConfirmed: "ยังไม่ยืนยันจนกว่าทางร้านจะติดต่อกลับ",
      staticHeading: "ส่งข้อความนี้ทางไลน์",
      staticBody: "คัดลอกข้อความด้านล่าง แล้วส่งให้ทางร้านทางไลน์ ทางร้านจะยืนยันรอบให้จากตรงนั้น",
      copy: "คัดลอกข้อความ",
      copied: "คัดลอกแล้ว",
    },

    journal: {
      label: "บันทึกร้าน",
      heading: "ที่ผ่านมาบนเคาน์เตอร์",
      intro:
        "ทางร้านลงเกือบทุกวัน — ปลาที่เพิ่งเข้า คอร์สตอนนี้ และคืนที่บาร์เปิดยาว รวมไว้ที่นี่ตามลำดับ",
      all: "ทั้งหมด",
      categories: {
        courses: "คอร์ส",
        counter: "เคาน์เตอร์",
        garden: "สวน",
        afterDark: "อิซากายะ",
        moments: "ช่วงเวลา",
      },
      empty: "ยังไม่มีในหมวดนี้",
      openOnInstagram: "เปิดใน Instagram",
      posted: "ลงเมื่อ",
      showing: "แสดง",
      entries: "รายการ",
      followLine: "ติดตามแบบเรียลไทม์ได้ที่ Instagram",
      awaitingMedia: "รอภาพจากทางร้าน",
    },


    warmth: {
      label: "บรรยากาศ",
      heading: "เรื่องที่เกิดขึ้นที่นี่ ไม่ได้อยู่แค่ในจาน",
      body: "วันเกิดที่เคาน์เตอร์ ครอบครัวที่จองยาวทั้งแถว เชฟที่โน้มตัวมาเล่าว่าคำนี้คืออะไร นี่คือส่วนที่ลูกค้าถ่ายรูปเก็บไว้ และเป็นเหตุผลที่กลับมาอีก",
      cta: "ดูบรรยากาศร้าน",
    },

    ala: {
      label: "อาหารตามสั่ง",
      heading: "ไม่ใช่ทุกคืนที่ต้องเป็นคอร์ส",
      body: "พฤหัสฯ ถึงเสาร์ บาร์เปิดยาว ครัวเสิร์ฟเป็นจานเดี่ยวควบคู่ไปกับโอมากาเสะ",
      pending: "เมนูตามสั่งเปลี่ยนตามวัตถุดิบที่เข้ามา ทางร้านเลยเก็บไว้ที่หน้าเคาน์เตอร์แทนการลงออนไลน์ ทักไลน์มาได้เลย เดี๋ยวส่งเมนูของคืนนี้ให้",
      askOnLine: "ขอเมนูของคืนนี้",
      served: "เสิร์ฟ",
    },

    meta: {
      title: "สวน เซน โอมากาเสะ — โอมากาเสะ นนทบุรี",
      description:
        "โอมากาเสะเคาน์เตอร์ในนนทบุรี เสิร์ฟเป็นรอบ ทีละคำ และมีอิซากายะเปิดพฤหัสฯ ถึงเสาร์ จองผ่าน LINE",
      ogAlt: "สวน เซน โอมากาเสะ นนทบุรี",
    },
  },
} as const;

export type Dict = (typeof dict)["en"];
export const getDict = (locale: Locale): Dict => dict[locale] as unknown as Dict;
