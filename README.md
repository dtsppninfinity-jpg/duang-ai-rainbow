# ดวงสีรุ้ง · Rainbow Fortune

แอปทำนายดวงจากวันเดือนปีเกิด ธีมสีรุ้ง mobile-first สร้างด้วย **Next.js (App Router) + TypeScript + plain CSS** ไม่มี Tailwind / ไม่มี CSS-in-JS / ไม่มีไลบรารี UI หรือ chart ภายนอก

> **เพื่อความบันเทิงเท่านั้น** — ผลทำนายคำนวณจากวันเกิดของคุณแบบคงที่ (deterministic) ไม่ได้เป็นการพยากรณ์จริง โปรดใช้เป็นกำลังใจและความสนุก ไม่ใช่คำแนะนำด้านการเงิน สุขภาพ หรือการตัดสินใจสำคัญในชีวิต

---

## ความต้องการของระบบ (Requirements)

- **Node.js 18.18 ขึ้นไป (แนะนำ Node 20 LTS)** — เป็นข้อกำหนดของ **Next.js 15** เอง ซึ่งระบุ `engines.node = "^18.18.0 || ^19.8.0 || >= 20.0.0"` ดังนั้น Node 18.0–18.17 จะรัน `next dev` / `next build` ไม่ผ่าน (React 19 / Next 15 ทำงานได้เสถียรที่สุดบน Node 20+)
- npm (มากับ Node อยู่แล้ว)

ตรวจสอบเวอร์ชัน:

```bash
node -v
```

---

## ติดตั้งและรัน (Install & Run)

```bash
# 1) ติดตั้ง dependencies
npm install

# 2) รันโหมดพัฒนา (dev)
npm run dev
# เปิดเบราว์เซอร์ที่ http://localhost:3000

# 3) build สำหรับ production
npm run build

# 4) รัน production server (ต้อง build ก่อน)
npm start
```

หน้าเว็บหลักอยู่ที่ [http://localhost:3000](http://localhost:3000)
หน้าแอดมินดู Lead อยู่ที่ [http://localhost:3000/leads](http://localhost:3000/leads)

---

## การทำงานแบบ Deterministic (ผลเดิมทุกครั้ง)

หัวใจของแอปคือ **ผลทำนายคงที่เสมอสำหรับวันเกิดเดิม (และชื่อเดิม)** — ไม่ใช่การสุ่ม

- เอ็นจินใน `lib/astrology.ts` เป็น **pure function** ของ (วัน, เดือน, ปี, ชื่อ)
- ใช้ตัวสุ่มแบบมี seed (mulberry32 จาก hash ของวันเกิด + ชื่อ) เพื่อเลือกคะแนน เลขนำโชค และประโยคคำทำนาย
- **ไม่ใช้ `Math.random` ในเอ็นจินเด็ดขาด** ดังนั้นเปิดซ้ำกี่ครั้งก็ได้ผลเดียวกัน
- ปีรองรับทั้ง **พ.ศ.** และ **ค.ศ.** — ฟอร์มเก็บเป็น พ.ศ. แล้วเอ็นจินแปลงให้ (`normalizeYear`: ถ้าปี > 2400 จะลบ 543)

สิ่งที่คำนวณได้ เช่น วันเกิดไทย + สีประจำวันเกิด (7 สี), นักษัตร (ปีชวด–กุน), ราศีสากล, เลขชีวิต (Life Path 1–9), เลขนำโชค, คะแนนดวงรวม 0–100 และคำทำนาย 4 หมวด (ความรัก / การงาน / การเงิน / สุขภาพ)

เพราะเป็น pure function จึงรองรับ caching / SSG / ISR ได้เต็มที่

---

## การเก็บ Lead (รายชื่อผู้สนใจ)

ผู้ใช้เห็น **ผลฟรีเต็มก่อนเสมอ** แล้วจึงค่อยเชิญกรอกฟอร์มสั้น ๆ เพื่อขอรับ "ดวงเชิงลึก" ทางอีเมล/Line (post-value soft gate)

### กลไกฝั่งเซิร์ฟเวอร์

- ฟอร์ม `LeadForm` ส่งข้อมูลไปที่ **`POST /api/leads`**
- Route Handler เรียก `lib/leads-store.ts` ซึ่งเป็นโมดูล **server-only** เก็บข้อมูลแบบไฟล์ที่
  **`<project>/data/leads.json`** (สร้างโฟลเดอร์/ไฟล์ให้อัตโนมัติถ้ายังไม่มี)
- แต่ละ Lead ได้ `id` จาก `crypto.randomUUID()` และ `createdAt` เป็น ISO timestamp

### API

| Method | Path         | คำอธิบาย |
|--------|--------------|----------|
| POST   | `/api/leads` | บันทึก Lead — body JSON `{ name, phone, contact, interest?, birthDate?, zodiac?, lifePath? }` (ต้องมี `name` + `phone`) → `200 { ok:true, lead }` หรือ `400 { ok:false, error }` |
| GET    | `/api/leads` | คืนรายการ Lead ทั้งหมด เรียงใหม่สุดก่อน → `200 { leads: Lead[] }` |

### หน้าแอดมิน `/leads`

- ใส่รหัสผ่าน admin (gate ฝั่ง client) แล้วดูตาราง Lead, ค้นหา, และ **Export CSV**
- **คำเตือน:** admin gate นี้ **ไม่ใช่ความปลอดภัยจริง** เป็นเพียงด่านกันคนทั่วไปเท่านั้น ห้ามใช้กับข้อมูลจริงบน production โดยไม่เพิ่มการยืนยันตัวตนฝั่งเซิร์ฟเวอร์ (เช่น auth/middleware) เสียก่อน

---

## ต่อ Backend จริง (Webhook / Automation)

ตั้งค่า environment variable **`LEADS_WEBHOOK_URL`** เพื่อให้ทุก Lead ใหม่ถูกส่งต่อ (POST) ไปยังปลายทางจริงแบบ best-effort (ห่อด้วย try/catch ไม่ล้มแม้ปลายทางพัง)

```bash
# ตัวอย่าง (.env.local)
LEADS_WEBHOOK_URL=https://your-n8n-or-sheet-or-lineoa-webhook
```

ใช้ต่อกับ n8n / Google Sheet / Line OA automation เพื่อเก็บ Lead อัตโนมัติและส่งดวงรายวันกลับ

> **หมายเหตุเรื่อง serverless:** บนแพลตฟอร์ม serverless (เช่น Vercel/Netlify) ระบบไฟล์มักเป็นแบบ ephemeral — ไฟล์ `data/leads.json` **อาจไม่คงอยู่ถาวร** และหายเมื่อ instance รีไซเคิล สำหรับ production จริงควรใช้ฐานข้อมูลจริงหรือ `LEADS_WEBHOOK_URL` ไปยังบริการเก็บข้อมูลภายนอกแทน

---

## ความเป็นส่วนตัว / PDPA

- ฟอร์ม Lead มี **checkbox ยินยอม (consent) ที่มองเห็นชัด** และข้อความกำกับว่า **ใช้ข้อมูลเพื่อติดต่อกลับเท่านั้น**
- มีคำมั่น: *ไม่สแปม ยกเลิกได้ทุกเมื่อ · ไม่ส่งต่อบุคคลที่สาม · เพื่อความบันเทิง*
- เก็บข้อมูลเท่าที่จำเป็น สอดคล้องแนวทาง PDPA ของไทย

---

## โครงสร้างไฟล์ (File Structure)

```
.
├── app/
│   ├── layout.tsx          # (authored แยก) import "./globals.css", <html lang="th">
│   ├── globals.css         # ธีมสีรุ้ง + คลาส component ทั้งหมด (plain CSS)
│   ├── page.tsx            # หน้าแรก: hero + FortuneForm + ResultCard + LeadForm + about + footer
│   ├── leads/
│   │   └── page.tsx        # หน้าแอดมิน: gate + ตาราง + ค้นหา + export CSV
│   └── api/
│       └── leads/
│           └── route.ts    # POST=บันทึก Lead, GET=ดึงรายการ
├── components/
│   ├── FortuneForm.tsx     # 'use client' ฟอร์มวันเกิด -> คำนวณ reading -> onResult
│   ├── ResultCard.tsx      # แสดงผลทำนาย (วงแหวนคะแนน + การ์ด 4 หมวด)
│   └── LeadForm.tsx        # 'use client' ส่งข้อมูลไป /api/leads
├── lib/
│   ├── astro-data.ts       # ข้อมูลล้วน (สีประจำวัน, นักษัตร, ราศี, เลขชีวิต, ประโยคทำนาย)
│   ├── astrology.ts        # เอ็นจิน pure: normalizeYear(), reading()
│   └── leads-store.ts      # server-only: getLeads(), addLead() เก็บที่ data/leads.json
├── data/
│   └── leads.json          # ไฟล์เก็บ Lead (สร้างอัตโนมัติ — อย่า commit ข้อมูลจริง)
└── README.md
```

> ไฟล์ตั้งค่าโปรเจกต์ (`package.json`, `tsconfig.json`, `next.config`, `app/layout.tsx`, `next-env.d.ts`) ถูกจัดทำแยกต่างหาก
>
> **แนะนำ:** ใส่ฟิลด์ `"engines"` ใน `package.json` ให้ตรงกับ Next.js 15 เพื่อบังคับเวอร์ชัน Node ตั้งแต่ตอนติดตั้ง เช่น `"engines": { "node": "^18.18.0 || ^19.8.0 || >= 20.0.0" }`

---

## เกร็ดเทคนิค

- **Path alias** `@/*` ชี้ไปที่ root ของโปรเจกต์ เช่น `import { reading } from "@/lib/astrology"`
- เอ็นจินรันได้ทั้งฝั่ง client และ server (pure, ไม่พึ่ง React)
- `lib/leads-store.ts` ใช้ `import "server-only"` กันไม่ให้หลุดไป bundle ฝั่ง client
- ใช้ `crypto.randomUUID()` และ `fetch` ที่มีอยู่แล้วใน Node runtime (รองรับตั้งแต่ Node 18+) — แต่ตัวกำหนดเวอร์ชันขั้นต่ำจริงคือ Next.js 15 (Node ≥ 18.18) ไม่ใช่ API เหล่านี้

---

*ดวงสีรุ้ง · Rainbow Fortune — เพื่อความบันเทิง* 🌈
