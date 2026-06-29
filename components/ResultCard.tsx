import type { Reading } from "@/lib/astrology";

/**
 * ResultCard
 * Server-safe component (no client hooks). Renders a Reading produced by
 * the deterministic engine in @/lib/astrology.
 *
 * Layout (mobile-first, single column):
 *  - result-header: ชื่อ + วงคะแนนดวงรวม (score-badge)
 *  - meta row: สีประจำวันเกิด (color-badge + badge-dot), สีมงคล, กาลกิณี,
 *              ปีนักษัตร, ราศี, เลขชีวิต + คำอธิบาย, เลขมงคล (chip)
 *  - cat-grid: 5 การ์ดหมวด ความรัก/การเงิน/การงาน/สุขภาพ/ภาพรวม
 */

type CategoryDef = {
  key: keyof Pick<Reading, "love" | "money" | "work" | "health" | "overall">;
  title: string;
  icon: string;
};

const CATEGORIES: CategoryDef[] = [
  { key: "love", title: "ความรัก", icon: "💗" },
  { key: "money", title: "การเงิน", icon: "💚" },
  { key: "work", title: "การงาน", icon: "💼" },
  { key: "health", title: "สุขภาพ", icon: "🧡" },
  { key: "overall", title: "ภาพรวม", icon: "🌈" },
];

export default function ResultCard({ reading }: { reading: Reading }) {
  return (
    <div className="result">
      {/* หัวผล: ชื่อ + คะแนนดวงรวม */}
      <div className="result-header">
        <div>
          <div className="section-title">ผลทำนายของ {reading.name}</div>
          <p className="hint">
            คำนวณจากวันเกิดของคุณจริง ๆ ผลเดิมทุกครั้ง ไม่ใช่การสุ่ม · เพื่อความบันเทิง
          </p>
        </div>
        <div
          className="score-badge"
          role="img"
          aria-label={`คะแนนดวงรวม ${reading.score} จาก 100`}
        >
          <span>{reading.score}</span>
          <small>/100</small>
        </div>
      </div>

      {/* สีประจำวันเกิด + สีมงคล + กาลกิณี */}
      <div className="section">
        <div className="lucky-row">
          <span className="color-badge">
            <span
              className="badge-dot"
              style={{ backgroundColor: reading.dayColorHex }}
              aria-hidden="true"
            />
            เกิดวัน{reading.dayTH} · สี{reading.dayColor}
          </span>
        </div>

        <div className="lucky-row">
          <span className="hint">สีมงคล:</span>
          {reading.luckyColors.map((c, i) => (
            <span className="chip" key={`luck-color-${i}-${c}`}>
              {c}
            </span>
          ))}
        </div>

        <div className="lucky-row">
          <span className="hint">สีกาลกิณี (ควรเลี่ยง):</span>
          <span className="chip">{reading.badColor}</span>
        </div>
      </div>

      {/* ปีนักษัตร + ราศี */}
      <div className="section">
        <div className="lucky-row">
          <span className="hint">ปีนักษัตร:</span>
          <span className="chip">
            {reading.zodiacTH} ({reading.zodiacAnimal})
          </span>
          <span className="hint">ราศี:</span>
          <span className="chip">{reading.zodiacWestern}</span>
        </div>
      </div>

      {/* เลขชีวิต + คำอธิบาย */}
      <div className="section">
        <div className="cat">
          <div className="cat-icon" aria-hidden="true">
            🔢
          </div>
          <div>
            <div className="cat-title">
              เลขชีวิต {reading.lifePath} · {reading.lifePathTitle}
            </div>
            <div className="cat-text">{reading.lifePathTraits}</div>
          </div>
        </div>
      </div>

      {/* เลขมงคล */}
      <div className="section">
        <div className="lucky-row">
          <span className="hint">เลขมงคลประจำตัว:</span>
          {reading.luckyNumbers.map((n, i) => (
            <span className="chip" key={`luck-num-${i}-${n}`}>
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* 5 การ์ดหมวด */}
      <div className="section">
        <div className="section-title">คำทำนายรายหมวด</div>
        <div className="cat-grid">
          {CATEGORIES.map((cat) => (
            <div
              className={`cat cat--${cat.key}`}
              key={cat.key}
              data-cat={cat.key}
            >
              <div className="cat-icon" aria-hidden="true">
                {cat.icon}
              </div>
              <div>
                <div className="cat-title">{cat.title}</div>
                <div className="cat-text">{reading[cat.key]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
