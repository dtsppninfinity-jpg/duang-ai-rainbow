import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * lib/leads-store.ts
 * ------------------
 * Server-only file-based store สำหรับ Lead (รายชื่อผู้สนใจรับดวงฉบับเต็ม)
 *
 * ใช้สำหรับ dev / demo / self-host บนเซิร์ฟเวอร์ที่ระบบไฟล์ "ถาวร" เท่านั้น
 *
 * ⚠️ คำเตือนสำคัญ (serverless / Vercel / Netlify / Cloud Functions):
 *   บนแพลตฟอร์ม serverless ระบบไฟล์เป็นแบบ ephemeral (ชั่วคราว) — ไฟล์ที่เขียนลง
 *   data/leads.json อาจหายเมื่อ instance รีสตาร์ท/สเกล หรืออ่านไม่เจอข้าม instance.
 *   สำหรับ production จริง ควรต่อกับที่เก็บข้อมูลถาวร เช่น:
 *     - ฐานข้อมูล (Postgres / MySQL / Supabase / PlanetScale / Mongo)
 *     - Google Sheets (ผ่าน Google Sheets API หรือ Apps Script)
 *     - Webhook / Automation (n8n, Make, Zapier) -> ดู LEADS_WEBHOOK_URL ด้านล่าง
 *     - Line OA / CRM
 *   วิธีต่อ backend จริง: แก้เฉพาะ getLeads() และ addLead() ให้ไปอ่าน/เขียนกับ
 *   ปลายทางที่เลือก โดยคง type Lead และ signature ของฟังก์ชันไว้เหมือนเดิม
 *   (ส่วนที่เหลือของแอป — API route, LeadForm, หน้า admin — ไม่ต้องแก้)
 *
 * 🔒 หมายเหตุเรื่อง concurrency:
 *   addLead() ใช้ in-process write lock (withLock) ให้การเขียนทำทีละรายการ และเขียน
 *   แบบ atomic (เขียนไฟล์ชั่วคราวแล้ว rename ทับ) เพื่อกัน race condition และไฟล์เสีย
 *   ระหว่างเขียน. ข้อจำกัด: ป้องกันได้เฉพาะภายใน "process เดียว" เท่านั้น ซึ่งตรงกับ
 *   เป้าหมาย dev/self-host ของไฟล์นี้ — ถ้ารันหลาย instance ควรย้ายไปใช้ฐานข้อมูลจริง
 */

export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  contact: string;
  interest?: string;
  birthDate?: string;
  zodiac?: string;
  lifePath?: number;
};

/** ข้อมูลที่รับเข้ามาเพื่อสร้าง Lead ใหม่ (ยังไม่มี id / createdAt) */
export type LeadInput = Omit<Lead, "id" | "createdAt">;

/**
 * เลือกโฟลเดอร์เก็บไฟล์ให้ "เขียนได้" ตามสภาพแวดล้อม:
 * - กำหนดเองได้ผ่าน env LEADS_DATA_DIR
 * - บน serverless (Vercel/AWS Lambda/Netlify) ระบบไฟล์เป็น read-only ยกเว้น /tmp
 *   จึงเขียนลง os.tmpdir() (ข้อมูลชั่วคราว — ควรตั้ง LEADS_WEBHOOK_URL ให้เก็บถาวร)
 * - ที่อื่น (dev/self-host) ใช้ <project-root>/data
 */
function resolveDataDir(): string {
  if (process.env.LEADS_DATA_DIR) return process.env.LEADS_DATA_DIR;
  if (process.env.VERCEL || process.env.AWS_REGION || process.env.NETLIFY) {
    return path.join(os.tmpdir(), "duang-ai-rainbow");
  }
  return path.join(process.cwd(), "data");
}

// ตำแหน่งไฟล์เก็บข้อมูล (เขียนได้เสมอตามสภาพแวดล้อม)
const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, "leads.json");

/**
 * In-process write lock: chain ของ Promise ที่ทำให้งานเขียนรันทีละรายการ
 * กัน race condition ของ read-modify-write เมื่อมีหลาย POST เข้ามาพร้อมกัน
 * (ป้องกันได้ภายใน process เดียว — ดูหมายเหตุด้านบน)
 */
let writeChain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  // ต่อ fn เข้า chain ไม่ว่าตัวก่อนหน้าจะสำเร็จหรือ error
  const run = writeChain.then(fn, fn);
  // ตัว chain ตัวถัดไปต้องไม่ถูก reject (กลืน error ของแต่ละ task ออกจาก chain)
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/**
 * ตรวจให้แน่ใจว่ามีโฟลเดอร์ data/ และไฟล์ leads.json (ถ้าไม่มีจะสร้างให้)
 * ไฟล์เริ่มต้นเป็น array ว่าง []
 */
async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    // ไฟล์ยังไม่มี -> สร้างไฟล์ใหม่เป็น array ว่าง
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

/**
 * อ่าน Lead ทั้งหมดจากไฟล์แบบ "ดิบ" (ไม่จัดเรียง)
 * ใช้ภายในสำหรับ addLead เพื่อแยกความถูกต้องของการ insert ออกจากการ sort ฝั่งอ่าน
 * ถ้าไฟล์เสีย/parse ไม่ได้ จะคืน [] แทนที่จะ throw
 */
async function readRaw(): Promise<Lead[]> {
  await ensureStore();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Lead[];
  } catch {
    return [];
  }
}

/**
 * เปรียบเทียบ Lead สำหรับเรียงใหม่ -> เก่า (newest-first)
 * ใช้เทียบ string ของ ISO-8601 ตรง ๆ (เรียงตามเวลาได้ถูกต้องและเสถียรกว่า localeCompare)
 * ถ้า createdAt เท่ากัน (สร้างใน millisecond เดียวกัน) ใช้ id เป็น tiebreaker เพื่อให้
 * ลำดับคงที่ (deterministic) ทุกครั้งที่อ่านซ้ำ
 */
function compareNewestFirst(a: Lead, b: Lead): number {
  if (a.createdAt < b.createdAt) return 1;
  if (a.createdAt > b.createdAt) return -1;
  // createdAt เท่ากัน -> tiebreaker ด้วย id (asc) ให้ลำดับคงที่
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/**
 * อ่าน Lead ทั้งหมดจากไฟล์
 * คืนค่าเรียงจากใหม่ -> เก่า (newest-first)
 * ถ้าไฟล์เสีย/parse ไม่ได้ จะคืน [] แทนที่จะ throw (กันหน้าแอดมินพัง)
 */
export async function getLeads(): Promise<Lead[]> {
  // ถ้าตั้งค่า LEADS_WEBHOOK_URL เป็น Google Apps Script Web App (รองรับ GET คืน {leads})
  // ให้ดึงรายชื่อจากที่นั่น เพื่อให้หน้าแอดมินทำงานได้บน serverless (เช่น Vercel)
  // ที่ไฟล์ในเครื่องไม่ถาวร. ถ้า GET ไม่สำเร็จหรือไม่ใช่รูปแบบที่รองรับ (เช่น Formspree)
  // จะ fallback ไปอ่านไฟล์ local ตามเดิม.
  const remote = process.env.LEADS_WEBHOOK_URL;
  if (remote) {
    try {
      const res = await fetch(remote, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data: unknown = await res.json();
        const arr = Array.isArray(data)
          ? data
          : Array.isArray((data as { leads?: unknown })?.leads)
            ? (data as { leads: Lead[] }).leads
            : null;
        if (arr) return [...(arr as Lead[])].sort(compareNewestFirst);
      }
    } catch {
      // เงียบไว้ — fallback ไปอ่านไฟล์ local ด้านล่าง
    }
  }

  const leads = await readRaw();
  // newest-first: เรียงตาม createdAt (string compare) + tiebreaker ด้วย id
  return [...leads].sort(compareNewestFirst);
}

/**
 * เพิ่ม Lead ใหม่
 * - id: crypto.randomUUID()
 * - createdAt: new Date().toISOString()
 * - บันทึกลงไฟล์แบบ newest-first (ต่อท้ายต้นแถวของ array)
 * - ทำงานภายใต้ withLock + เขียนแบบ atomic (temp file -> rename) เพื่อกัน race
 *   condition และไฟล์เสียระหว่างเขียน
 * - ถ้าตั้งค่า env LEADS_WEBHOOK_URL ไว้ จะ POST lead ไปยัง webhook นั้น
 *   แบบ best-effort (try/catch — ถ้า fail จะไม่กระทบการบันทึกไฟล์)
 */
export async function addLead(input: LeadInput): Promise<Lead> {
  const lead: Lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: input.name,
    phone: input.phone,
    contact: input.contact,
    interest: input.interest,
    birthDate: input.birthDate,
    zodiac: input.zodiac,
    lifePath: input.lifePath,
  };

  // read-modify-write ภายใต้ lock เพื่อกันการเขียนทับกันจากหลาย request พร้อมกัน
  // best-effort: ถ้าเขียนไฟล์ไม่ได้ (เช่น serverless FS อ่านอย่างเดียว) จะไม่ทำให้ request พัง
  try {
  await withLock(async () => {
    // อ่าน array ดิบโดยตรง (ไม่ต้อง sort) -> ใส่ตัวใหม่ไว้หน้าสุด (newest-first)
    const raw = await readRaw();
    const next = [lead, ...raw];

    // เขียนแบบ atomic: เขียนลง temp ก่อน แล้ว rename ทับ (rename เป็น atomic
    // บน filesystem เดียวกัน) เพื่อกันไฟล์ truncate/corrupt หาก crash กลางคัน
    const tmp = `${DATA_FILE}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
      await fs.rename(tmp, DATA_FILE);
    } catch (err) {
      // ถ้าพลาด พยายามลบ temp ที่ค้างไว้ (best-effort) แล้วโยน error ต่อ
      try {
        await fs.unlink(tmp);
      } catch {
        // ไม่มี temp ให้ลบ หรือ ลบไม่ได้ — ปล่อยผ่าน
      }
      throw err;
    }
  });
  } catch {
    // เขียนไฟล์ไม่สำเร็จ — ปล่อยผ่าน (ดู best-effort ด้านบน) เพื่อไม่ให้ผู้ใช้เจอ error
    // ถ้ามี LEADS_WEBHOOK_URL ข้อมูลยังถูกส่งไปเก็บปลายทางจริงด้านล่าง
  }

  // ส่งต่อไปยัง backend จริง (n8n / Make / Google Sheets / Line OA) ถ้ามีตั้งค่าไว้
  // best-effort: ถ้า webhook ล้มเหลว เรายังบันทึกไฟล์สำเร็จและคืน lead ตามปกติ
  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
    } catch {
      // เงียบไว้โดยตั้งใจ — ไม่ให้ปัญหา webhook ทำให้ผู้ใช้กรอกฟอร์มแล้ว error
      // (ใน production จริงควร log ไปยังระบบ monitoring แทน)
    }
  }

  return lead;
}
