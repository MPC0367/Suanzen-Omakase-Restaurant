import type { Motif, Tone } from "@/components/BrandPlate";

/**
 * The gallery is sequenced, not dumped: food, then room, then hand, then
 * guest, then garden, then food again. Each entry names the photograph the
 * restaurant should supply for that slot, its crop, and what it is of — so
 * the shoot list and the site are the same document.
 *
 * Add `src` (a file under /public/gallery) and the photograph replaces the
 * artwork with no other change.
 */
export type Shot = {
  id: string;
  src?: string;
  ratio: number;
  tone: Tone;
  motif: Motif;
  altEn: string;
  altTh: string;
  capEn: string;
  capTh: string;
};

export const gallery: Shot[] = [
  { id: "nigiri",   ratio: 0.8,  tone: "night", motif: "plate",
    altEn: "A piece of nigiri set down on the counter",
    altTh: "นิงิริหนึ่งคำวางบนเคาน์เตอร์",
    capEn: "One piece, set down", capTh: "หนึ่งคำ วางลงตรงหน้า" },
  { id: "counter",  ratio: 1.6,  tone: "dusk", motif: "counter",
    altEn: "The counter seen along its length, seats set for a round",
    altTh: "เคาน์เตอร์มองตามยาว จัดที่นั่งไว้สำหรับรอบถัดไป",
    capEn: "The counter, before a round", capTh: "เคาน์เตอร์ ก่อนเริ่มรอบ" },
  { id: "hands",    ratio: 1.0,  tone: "ember", motif: "plate",
    altEn: "The chef's hands forming rice",
    altTh: "มือเชฟกำลังปั้นข้าว",
    capEn: "Rice, formed", capTh: "ข้าวที่เพิ่งปั้น" },
  { id: "knife",    ratio: 0.75, tone: "night", motif: "plate",
    altEn: "A knife drawn through fish",
    altTh: "มีดแล่ผ่านเนื้อปลา",
    capEn: "One cut", capTh: "หนึ่งมีด" },
  { id: "guest",    ratio: 1.5,  tone: "dusk", motif: "counter",
    altEn: "A guest receiving a course across the counter",
    altTh: "แขกรับคำถัดไปจากฝั่งเคาน์เตอร์",
    capEn: "Handed across", capTh: "ส่งข้ามเคาน์เตอร์" },
  { id: "garden",   ratio: 2.33, tone: "night", motif: "garden",
    altEn: "The garden along the walk in, lit low",
    altTh: "สวนริมทางเดินเข้า แสงสลัว",
    capEn: "The walk in", capTh: "ทางเดินเข้า" },
  { id: "caviar",   ratio: 0.8,  tone: "ember", motif: "plate",
    altEn: "A course finished with roe",
    altTh: "คำที่จบด้วยไข่ปลา",
    capEn: "Finished", capTh: "คำที่เสร็จแล้ว" },
  { id: "sign",     ratio: 1.0,  tone: "night", motif: "garden",
    altEn: "The Suan Zen sign after dark",
    altTh: "ป้ายร้านสวน เซน ตอนค่ำ",
    capEn: "The sign, after dark", capTh: "ป้ายร้านตอนค่ำ" },
  { id: "room",     ratio: 1.6,  tone: "dawn", motif: "counter",
    altEn: "The dining room in daylight",
    altTh: "ห้องอาหารตอนกลางวัน",
    capEn: "Daylight, before service", capTh: "กลางวัน ก่อนเปิดรอบ" },
  { id: "dessert",  ratio: 0.75, tone: "day", motif: "plate",
    altEn: "The dessert course",
    altTh: "ของหวานปิดคอร์ส",
    capEn: "The last course", capTh: "คำสุดท้าย" },
];
