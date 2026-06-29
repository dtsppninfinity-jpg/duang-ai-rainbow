# เก็บ Lead ลง Google Sheets (ฟรี ไม่ต้องมีเซิร์ฟเวอร์)

ทำให้รายชื่อที่คนกรอกในเว็บ ถูกบันทึกลง Google Sheet ของคุณจริง ๆ
และหน้าแอดมิน `/leads` ดึงข้อมูลกลับมาแสดง/ส่งออก CSV ได้ (แม้ deploy บน Vercel)

## ขั้นตอน (ครั้งเดียว ~5 นาที)

1. สร้าง **Google Sheet** ใหม่ 1 ไฟล์ (sheet.new)
2. เมนู **Extensions → Apps Script**
3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดจากไฟล์ [`Code.gs`](./Code.gs) ลงไป
4. แก้บรรทัด `var TOKEN = "เปลี่ยนรหัสนี้ด้วย";` ให้เป็นรหัสลับของคุณเอง (เดายาก ๆ เช่น `rainbow-7f3a9k`)
5. กด **Deploy → New deployment**
   - คลิกรูปเฟือง เลือกชนิด **Web app**
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
   - กด **Deploy** แล้วอนุญาตสิทธิ์ (Authorize) ตามที่ Google ขอ
6. คัดลอก **Web app URL** ที่ได้ (ลงท้ายด้วย `/exec`)
7. **ต่อท้าย URL ด้วย `?token=<รหัสลับของคุณ>`** เช่น:
   ```
   https://script.google.com/macros/s/AKfyc.../exec?token=rainbow-7f3a9k
   ```

## เอา URL ไปใส่ในเว็บ

### รันในเครื่อง (local)
สร้างไฟล์ `.env.local` ที่รากโปรเจกต์:
```
LEADS_WEBHOOK_URL=https://script.google.com/macros/s/AKfyc.../exec?token=rainbow-7f3a9k
```
แล้ว `npm run dev` ใหม่

### บน Vercel
Project → **Settings → Environment Variables** → เพิ่ม
- Name: `LEADS_WEBHOOK_URL`
- Value: URL เต็ม (รวม `?token=...`)

แล้ว **Redeploy** หนึ่งครั้ง

> หรือผ่าน CLI: `vercel env add LEADS_WEBHOOK_URL` แล้ววาง URL

## ทำงานยังไง
- มีคนกรอกฟอร์ม → เว็บ **POST** lead ไปที่ Apps Script → ต่อแถวใหม่ใน Sheet
- หน้า `/leads` → เว็บ **GET** จาก Apps Script → แสดงรายชื่อ + ส่งออก CSV ได้
- `token` ป้องกันไม่ให้คนอื่นที่ไม่รู้รหัสยิงข้อมูลมั่ว/แอบอ่าน

## ทางเลือกอื่น: Formspree
ถ้าใช้ [Formspree](https://formspree.io) แค่เอา endpoint (`https://formspree.io/f/xxxx`)
มาใส่เป็น `LEADS_WEBHOOK_URL` ก็เก็บ Lead ได้ทันที — แต่หน้าแอดมิน `/leads` จะดึงกลับมาแสดงไม่ได้
(ให้ไปดูรายชื่อใน Dashboard ของ Formspree แทน) เพราะ Formspree ไม่มี GET คืนรายการ
