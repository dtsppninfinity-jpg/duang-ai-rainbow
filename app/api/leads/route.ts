import { NextResponse } from "next/server";
import { getLeads, addLead } from "@/lib/leads-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "ส่งข้อมูลไม่ถูกต้อง (JSON ไม่ถูกรูปแบบ)" },
      { status: 400 }
    );
  }

  const data = (body ?? {}) as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "กรุณากรอกชื่อและเบอร์โทรให้ครบถ้วน" },
      { status: 400 }
    );
  }

  const contact = typeof data.contact === "string" ? data.contact.trim() : "";
  const interest =
    typeof data.interest === "string" && data.interest.trim()
      ? data.interest.trim()
      : undefined;
  const birthDate =
    typeof data.birthDate === "string" && data.birthDate.trim()
      ? data.birthDate.trim()
      : undefined;
  const zodiac =
    typeof data.zodiac === "string" && data.zodiac.trim()
      ? data.zodiac.trim()
      : undefined;
  const lifePath =
    typeof data.lifePath === "number" &&
    Number.isInteger(data.lifePath) &&
    data.lifePath >= 1 &&
    data.lifePath <= 9
      ? data.lifePath
      : undefined;

  try {
    const lead = await addLead({
      name,
      phone,
      contact,
      interest,
      birthDate,
      zodiac,
      lifePath,
    });
    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json(
      { ok: false, error: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const leads = await getLeads();
    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json({ leads: [] }, { status: 500 });
  }
}
