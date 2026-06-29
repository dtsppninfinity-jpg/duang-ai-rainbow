'use client';

import { useState, type FormEvent } from 'react';
import { reading, normalizeYear, type Reading } from '@/lib/astrology';

type Props = {
  onResult: (r: Reading) => void;
};

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

// ค่าเพศที่ engine (lib/astrology.ts) รู้จัก — ใช้สตริงไทยตามสัญญา (CONTRACT)
// reading(dob, name, gender?) จะเทียบ gender กับสตริงเหล่านี้พอดี
const GENDER_OPTIONS = ['หญิง', 'ชาย', 'ไม่ระบุ'] as const;

// ปีปัจจุบัน ค.ศ. 2026 = พ.ศ. 2569 — สร้างตัวเลือกปีสำหรับอายุ ~0-90 ปี
const CURRENT_BE = 2569;
const YEARS_BE: number[] = Array.from({ length: 91 }, (_, i) => CURRENT_BE - i);

// จำนวนวันสูงสุดของเดือน/ปีที่เลือก (ใช้ปี ค.ศ. ที่ normalize แล้ว เพื่อให้กุมภาพันธ์ปีอธิกสุรทินถูกต้อง)
function daysInMonth(monthBE: number, yearBE: number): number {
  const ce = normalizeYear(yearBE);
  // new Date(year, month, 0) => วันสุดท้ายของเดือนนั้น (month เป็น 1-12 ที่นี่)
  return new Date(ce, monthBE, 0).getDate();
}

export default function FortuneForm({ onResult }: Props) {
  const [inName, setInName] = useState('');
  const [inGender, setInGender] = useState<string>('ไม่ระบุ');
  const [inDay, setInDay] = useState(1);
  const [inMonth, setInMonth] = useState(1);
  const [inYear, setInYear] = useState(CURRENT_BE - 25); // ค่าเริ่มต้นที่สมเหตุสมผล

  // จำนวนวันที่ถูกต้องสำหรับเดือน/ปีที่เลือกในตอนนี้
  const maxDay = daysInMonth(inMonth, inYear);
  const DAYS: number[] = Array.from({ length: maxDay }, (_, i) => i + 1);

  // ถ้าวันที่เลือกอยู่เกินจำนวนวันของเดือนใหม่ ให้ปรับลงมาที่วันสุดท้ายที่ถูกต้อง
  function clampDay(day: number, month: number, year: number): number {
    const max = daysInMonth(month, year);
    return Math.min(day, max);
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const month = Number(e.target.value);
    setInMonth(month);
    setInDay((d) => clampDay(d, month, inYear));
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const year = Number(e.target.value);
    setInYear(year);
    setInDay((d) => clampDay(d, inMonth, year));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // เผื่อกรณีขอบ: ยืนยันว่าวันไม่เกินจำนวนวันจริงของเดือน/ปี ก่อนคำนวณ
    const safeDay = clampDay(inDay, inMonth, inYear);
    if (safeDay !== inDay) setInDay(safeDay);
    const r = reading(
      { day: safeDay, month: inMonth, year: inYear },
      inName.trim(),
      inGender,
    );
    onResult(r);
  }

  return (
    <form className="card section" onSubmit={handleSubmit}>
      <h2 className="section-title">กรอกวันเกิดเพื่อเปิดดวง</h2>

      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="ff-name">
            ชื่อเล่น (ไม่บังคับ)
          </label>
          <input
            id="ff-name"
            className="input"
            type="text"
            value={inName}
            onChange={(e) => setInName(e.target.value)}
            placeholder="เช่น มะลิ"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="ff-gender">
            เพศ
          </label>
          <select
            id="ff-gender"
            className="select"
            value={inGender}
            onChange={(e) => setInGender(e.target.value)}
          >
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="ff-day">
            วันที่
          </label>
          <select
            id="ff-day"
            className="select"
            value={inDay}
            onChange={(e) => setInDay(Number(e.target.value))}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="ff-month">
            เดือน
          </label>
          <select
            id="ff-month"
            className="select"
            value={inMonth}
            onChange={handleMonthChange}
          >
            {THAI_MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="ff-year">
            ปีเกิด (พ.ศ.)
          </label>
          <select
            id="ff-year"
            className="select"
            value={inYear}
            onChange={handleYearChange}
          >
            {YEARS_BE.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button className="btn btn-primary" type="submit">
        เปิดดวงของฉัน
      </button>

      <p className="hint">
        ผลเดิมทุกครั้งสำหรับวันเกิดเดิม เพราะคำนวณจากวันเกิดคุณจริง ๆ ไม่ใช่การสุ่ม · เพื่อความบันเทิง
      </p>
    </form>
  );
}
