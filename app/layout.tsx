import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ดูดวงสีรุ้ง 🌈 | ทำนายแม่นจากวันเกิด",
  description:
    "เว็บทำนายดวงธีมสีรุ้ง — ใส่วันเดือนปีเกิดแล้วรับคำทำนายเฉพาะคุณ (สีประจำวันเกิด เลขศาสตร์ ปีนักษัตร ราศี) เพื่อความบันเทิง",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
