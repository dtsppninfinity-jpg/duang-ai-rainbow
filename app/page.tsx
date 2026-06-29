"use client";

import { useState } from "react";
import type { Reading } from "@/lib/astrology";
import FortuneForm from "@/components/FortuneForm";
import ResultCard from "@/components/ResultCard";
import LeadForm from "@/components/LeadForm";

const FORTUNE_IMAGES = [
  { src: "/generated-fortune/01-rainbow-fortune-hero.png", alt: "Rainbow fortune crystal sphere" },
  { src: "/generated-fortune/02-lucky-numbers.png", alt: "Lucky numbers charm illustration" },
  { src: "/generated-fortune/03-love-reading.png", alt: "Love reading crystal hearts" },
  { src: "/generated-fortune/04-money-reading.png", alt: "Money reading golden charm tree" },
  { src: "/generated-fortune/05-career-reading.png", alt: "Career reading celestial compass" },
  { src: "/generated-fortune/06-health-reading.png", alt: "Health reading crystal lotus" },
  { src: "/generated-fortune/07-zodiac-wheel.png", alt: "Golden zodiac wheel" },
  { src: "/generated-fortune/08-weekday-colors.png", alt: "Seven weekday color crystals" },
  { src: "/generated-fortune/09-lucky-colors.png", alt: "Rainbow lucky color ribbons" },
  { src: "/generated-fortune/10-monthly-reading.png", alt: "Monthly reading moon wheel" },
  { src: "/generated-fortune/11-free-report.png", alt: "Free fortune report envelope" },
  { src: "/generated-fortune/12-auspicious-day.png", alt: "Auspicious day golden tray" },
  { src: "/generated-fortune/13-tarot-cards.png", alt: "Opal fortune cards" },
  { src: "/generated-fortune/14-compatibility.png", alt: "Compatibility constellations" },
  { src: "/generated-fortune/15-overall-score.png", alt: "Overall score crystal ring" },
];

export default function HomePage() {
  const [reading, setReading] = useState<Reading | null>(null);

  return (
    <main className="page">
      {/* Hero */}
      <header className="hero">
        <div className="brand">ดวงสีรุ้ง · Rainbow Fortune</div>
        <p className="tagline">
          ทำนายดวงจากวันเดือนปีเกิด แม่นและคงที่ทุกครั้ง เพราะคำนวณจากวันเกิดคุณจริง ๆ
          ไม่สุ่ม (เพื่อความบันเทิง)
        </p>
        <span className="chip">เพื่อความบันเทิง · ไม่ต้องสมัครสมาชิก</span>
      </header>

      {/* Form */}
      <section className="section card">
        <h2 className="section-title">เปิดดวงของคุณ</h2>
        <p className="hint">
          กรอกแค่วันเดือนปีเกิด แล้วกดปุ่มเดียวเห็นผลทันที — ผลเดิมทุกครั้งสำหรับวันเกิดเดิม
          เพราะคำนวณจากวันเกิดคุณจริง ๆ ไม่ใช่การสุ่ม
        </p>
        <FortuneForm onResult={setReading} />
      </section>

      {/* Result */}
      {reading && <ResultCard reading={reading} />}

      {/* Lead capture (post-value soft gate) */}
      <LeadForm reading={reading} />

      <section className="section card fortune-gallery-section">
        <h2 className="section-title">Rainbow Fortune Gallery</h2>
        <div className="fortune-gallery">
          {FORTUNE_IMAGES.map((image) => (
            <figure className="fortune-shot" key={image.src}>
              <img src={image.src} alt={image.alt} loading="lazy" />
            </figure>
          ))}
        </div>
      </section>

      {/* About / disclaimer */}
      <section className="section card">
        <h2 className="section-title">เกี่ยวกับดวงสีรุ้ง</h2>
        <p className="cat-text">
          ดวงสีรุ้งคำนวณคำทำนายจากวันเดือนปีเกิด (และชื่อ) ของคุณแบบคงที่ —
          วันเกิดเดิมจะได้ผลเดิมเสมอ ไม่ใช่การสุ่ม จึงรู้สึกแม่นและเปิดซ้ำได้ผลเดียวกันทุกครั้ง.
          เราผูกธีมสีรุ้งกับสีประจำวันเกิดไทยทั้ง 7 สี เพื่อให้สีสื่อความหมาย ไม่ใช่แค่สวยงาม.
        </p>
        <p className="hint">
          ข้อจำกัด: เนื้อหาทั้งหมดจัดทำขึ้นเพื่อความบันเทิงเท่านั้น ไม่ใช่คำแนะนำทางการแพทย์
          การเงิน กฎหมาย หรือการตัดสินใจสำคัญในชีวิต โปรดใช้วิจารณญาณและปรึกษาผู้เชี่ยวชาญตามความเหมาะสม.
          เราไม่สัญญาเรื่องโชคลาภและไม่มีเจตนาสร้างความกลัว ขอให้คำทำนายเป็นเพียงกำลังใจเล็ก ๆ ในแต่ละวัน.
        </p>
        <p className="hint">
          ความเป็นส่วนตัว: หากคุณฝากข้อมูลติดต่อ เราจะใช้เพื่อติดต่อกลับและส่งดวงให้คุณเท่านั้น
          ไม่สแปม ยกเลิกได้ทุกเมื่อ · ไม่ส่งต่อบุคคลที่สาม (ตาม PDPA).
        </p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span>ดวงสีรุ้ง · Rainbow Fortune — เพื่อความบันเทิง</span>
        <a className="link" href="/leads">
          จัดการ Lead
        </a>
      </footer>
    </main>
  );
}
