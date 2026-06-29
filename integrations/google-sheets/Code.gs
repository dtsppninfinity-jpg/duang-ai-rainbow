/**
 * Google Apps Script — รับ Lead จากเว็บ "ดวงสีรุ้ง" แล้วบันทึกลง Google Sheets
 * และอ่านกลับมาแสดงในหน้าแอดมิน /leads ได้
 *
 * วิธีติดตั้งแบบละเอียด: ดูไฟล์ integrations/google-sheets/SHEETS-SETUP.md
 *
 * สรุปสั้น:
 *  1) สร้าง Google Sheet ใหม่ 1 ไฟล์
 *  2) เมนู Extensions > Apps Script แล้ววางโค้ดนี้ทับทั้งหมด
 *  3) แก้ค่า TOKEN ด้านล่างเป็นรหัสลับของคุณเอง (อะไรก็ได้ที่เดายาก)
 *  4) Deploy > New deployment > ประเภท "Web app"
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  5) คัดลอก Web app URL มาต่อท้ายด้วย ?token=<TOKEN ของคุณ>
 *       เช่น  https://script.google.com/macros/s/XXXX/exec?token=my-secret-123
 *     แล้วเอา URL นี้ไปใส่เป็น env "LEADS_WEBHOOK_URL" ในเว็บ/Vercel
 */

// ⚠️ เปลี่ยนเป็นรหัสลับของคุณเอง (ต้องตรงกับ ?token=... ใน URL)
var TOKEN = "เปลี่ยนรหัสนี้ด้วย";

var SHEET_NAME = "Leads";
var HEADERS = [
  "createdAt", "id", "name", "phone", "contact",
  "interest", "birthDate", "zodiac", "lifePath",
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkToken_(e) {
  return e && e.parameter && e.parameter.token === TOKEN;
}

// POST = บันทึก Lead ใหม่ (เว็บจะยิงมาที่นี่ตอนมีคนกรอกฟอร์ม)
function doPost(e) {
  try {
    if (!checkToken_(e)) return json_({ ok: false, error: "unauthorized" });
    var d = {};
    if (e.postData && e.postData.contents) d = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    sheet.appendRow([
      d.createdAt || new Date().toISOString(),
      d.id || "",
      d.name || "",
      d.phone || "",
      d.contact || "",
      d.interest || "",
      d.birthDate || "",
      d.zodiac || "",
      (d.lifePath === 0 || d.lifePath) ? d.lifePath : "",
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// GET = อ่าน Lead ทั้งหมด (หน้าแอดมิน /leads จะดึงจากที่นี่)
function doGet(e) {
  try {
    if (!checkToken_(e)) return json_({ ok: false, error: "unauthorized" });
    var sheet = getSheet_();
    var values = sheet.getDataRange().getValues();
    var rows = values.slice(1); // ตัดแถว header
    var leads = rows
      .filter(function (r) { return r[1] || r[2] || r[3]; }) // ต้องมี id/ชื่อ/เบอร์
      .map(function (r) {
        return {
          createdAt: String(r[0] || ""),
          id: String(r[1] || ""),
          name: String(r[2] || ""),
          phone: String(r[3] || ""),
          contact: String(r[4] || ""),
          interest: String(r[5] || ""),
          birthDate: String(r[6] || ""),
          zodiac: String(r[7] || ""),
          lifePath: r[8] === "" || r[8] == null ? undefined : Number(r[8]),
        };
      });
    return json_({ leads: leads });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
