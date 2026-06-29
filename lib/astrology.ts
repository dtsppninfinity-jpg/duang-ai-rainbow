// lib/astrology.ts
// Pure deterministic fortune engine. No React, no Math.random, no external libs.
// Runs identically on client and server. Same (DOB + name) => same Reading, always.
//
// Imports its content (sentence banks, day-color table, zodiac labels, life-path
// descriptions, lucky-color palettes) from the pure data module "@/lib/astro-data".

import {
  dayColors as DAY_COLORS,
  zodiacTH as ZODIAC_TH,
  lifePaths as LIFE_PATHS,
  predictions as PREDICTIONS,
  type DayColor,
  type ZodiacTH as ZodiacInfo,
  type LifePath as LifePathInfo,
  type Predictions as PredictionBank,
} from "@/lib/astro-data";

/* ------------------------------------------------------------------ *
 * Public types — EXPORTED EXACTLY per CONTRACT.types
 * ------------------------------------------------------------------ */

export type DOB = { day: number; month: number; year: number }; // year may be พ.ศ. or ค.ศ.

export type Reading = {
  name: string;
  dayTH: string;
  dayColor: string;
  dayColorHex: string;
  luckyColors: string[];
  badColor: string;
  zodiacTH: string;
  zodiacAnimal: string;
  zodiacWestern: string;
  lifePath: number;
  lifePathTitle: string;
  lifePathTraits: string;
  luckyNumbers: number[];
  score: number;
  love: string;
  money: string;
  work: string;
  health: string;
  overall: string;
};

/* ------------------------------------------------------------------ *
 * Year normalization: พ.ศ. (Buddhist) -> ค.ศ. (Gregorian)
 * Any year above 2400 is treated as พ.ศ. and converted by subtracting 543.
 * ------------------------------------------------------------------ */

export function normalizeYear(y: number): number {
  return y > 2400 ? y - 543 : y;
}

/* ------------------------------------------------------------------ *
 * Deterministic PRNG
 *  - fnv1aHash: stable 32-bit string hash (FNV-1a)
 *  - mulberry32: tiny, high-quality seeded PRNG
 * ------------------------------------------------------------------ */

function fnv1aHash(str: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // 32-bit FNV prime multiply via shifts to stay in integer range
    h = Math.imul(h, 0x01000193);
  }
  // force unsigned 32-bit
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Calendar helpers
 * ------------------------------------------------------------------ */

// Thai weekday names, index aligned with Date.getDay(): 0=Sun ... 6=Sat
const WEEKDAY_TH = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

// Day of week (0=Sun..6=Sat) from a normalized (ค.ศ.) date.
// The full year is set explicitly via setFullYear so that years 0-99 CE are not
// silently remapped to 1900-1999 by the Date(year, month, day) legacy behaviour.
// The Date is built from local midnight components, so getDay() is deterministic
// across client and server regardless of timezone.
function weekdayIndex(dayCE: DOB): number {
  const ce = normalizeYear(dayCE.year);
  const d = new Date(ce, dayCE.month - 1, dayCE.day);
  d.setFullYear(ce);
  return d.getDay();
}

// Thai 12-year zodiac index: ((ค.ศ.-4)%12+12)%12
// 0=ชวด ... 11=กุน. Verify: ค.ศ.2020 => 0 => ชวด.
function zodiacIndex(yearCE: number): number {
  return (((yearCE - 4) % 12) + 12) % 12;
}

// Western zodiac by (month, day) ranges; Capricorn wraps year-end.
function westernZodiac(month: number, day: number): string {
  const md = month * 100 + day; // e.g. Mar 21 => 321
  if (md >= 321 && md <= 419) return "เมษ (Aries)";
  if (md >= 420 && md <= 520) return "พฤษภ (Taurus)";
  if (md >= 521 && md <= 620) return "เมถุน (Gemini)";
  if (md >= 621 && md <= 722) return "กรกฎ (Cancer)";
  if (md >= 723 && md <= 822) return "สิงห์ (Leo)";
  if (md >= 823 && md <= 922) return "กันย์ (Virgo)";
  if (md >= 923 && md <= 1022) return "ตุล (Libra)";
  if (md >= 1023 && md <= 1121) return "พิจิก (Scorpio)";
  if (md >= 1122 && md <= 1221) return "ธนู (Sagittarius)";
  if (md >= 1222 || md <= 119) return "มังกร (Capricorn)"; // wrap
  if (md >= 120 && md <= 218) return "กุมภ์ (Aquarius)";
  return "มีน (Pisces)"; // 219 - 320
}

// Life path: sum all digits of day + month + year(ค.ศ.), reduce to 1-9.
function lifePathNumber(dob: DOB): number {
  const ce = normalizeYear(dob.year);
  const digits = `${dob.day}${dob.month}${ce}`;
  let sum = 0;
  for (const ch of digits) {
    const d = ch.charCodeAt(0) - 48;
    if (d >= 0 && d <= 9) sum += d;
  }
  // reduce to a single digit 1-9
  while (sum > 9) {
    let next = 0;
    while (sum > 0) {
      next += sum % 10;
      sum = Math.floor(sum / 10);
    }
    sum = next;
  }
  return sum === 0 ? 9 : sum;
}

/* ------------------------------------------------------------------ *
 * PRNG-driven pickers
 * ------------------------------------------------------------------ */

function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) {
    // defensive: should not happen with a well-formed data module
    return undefined as unknown as T;
  }
  const i = Math.floor(rng() * arr.length);
  return arr[i % arr.length];
}

// String picker that degrades gracefully: never returns undefined, so a data gap
// renders an empty string instead of the literal text "undefined" in the UI.
function pickStr(rng: () => number, arr: readonly string[]): string {
  if (arr.length === 0) return "";
  const i = Math.floor(rng() * arr.length);
  return arr[i % arr.length] ?? arr[0] ?? "";
}

// Score in an inclusive integer range.
function scoreInRange(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/* ------------------------------------------------------------------ *
 * Main engine
 * ------------------------------------------------------------------ */

export function reading(dob: DOB, name: string, gender?: string): Reading {
  const cleanName = (name ?? "").trim();
  const ce = normalizeYear(dob.year);

  // Deterministic seed from DOB + name (+ gender if supplied). Stable per person.
  const seedStr = `${dob.day}-${dob.month}-${ce}|${cleanName}|${gender ?? ""}`;
  const seed = fnv1aHash(seedStr);
  const rng = mulberry32(seed);

  // --- Day of birth + Thai birth-day color -------------------------------
  const wIdx = weekdayIndex(dob);
  const dayTH = WEEKDAY_TH[wIdx];
  const dc: DayColor = DAY_COLORS[wIdx];
  const dayColor = dc.mainColor;
  const dayColorHex = dc.mainColorHex;
  const luckyColors = [...dc.luckyColors];
  const badColor = dc.badColor;

  // --- Thai 12-year zodiac ----------------------------------------------
  const zIdx = zodiacIndex(ce);
  const zInfo: ZodiacInfo = ZODIAC_TH[zIdx];
  const zodiacTH = zInfo.nameTH;
  const zodiacAnimal = zInfo.animal;

  // --- Western zodiac ----------------------------------------------------
  const zodiacWestern = westernZodiac(dob.month, dob.day);

  // --- Life path ---------------------------------------------------------
  // LIFE_PATHS is 1-indexed (entries at 1..9, a placeholder sits at index 0),
  // so reading LIFE_PATHS[lifePath] is always defined for lifePath in 1..9.
  const lifePath = lifePathNumber(dob);
  const lp: LifePathInfo = LIFE_PATHS[lifePath];
  const lifePathTitle = lp.title;
  const lifePathTraits = lp.traits;

  // --- Lucky numbers (deterministic, distinct, 0-9) ----------------------
  const luckyNumbers: number[] = [];
  let guard = 0;
  while (luckyNumbers.length < 3 && guard < 50) {
    const n = Math.floor(rng() * 10);
    if (!luckyNumbers.includes(n)) luckyNumbers.push(n);
    guard++;
  }
  // ensure exactly 3 even in pathological cases
  while (luckyNumbers.length < 3) luckyNumbers.push(luckyNumbers.length);

  // --- Category & overall scores (deterministic) -------------------------
  const loveScore = scoreInRange(rng, 55, 99);
  const moneyScore = scoreInRange(rng, 55, 99);
  const workScore = scoreInRange(rng, 55, 99);
  const healthScore = scoreInRange(rng, 55, 99);
  // Overall is a blended, stable score in 0-100 (kept in a positive range).
  const score = Math.round(
    (loveScore + moneyScore + workScore + healthScore) / 4
  );

  // --- Prediction sentences (deterministic choice from data banks) -------
  // pickStr never returns undefined, so a missing/empty bank degrades to "".
  const bank: PredictionBank = PREDICTIONS;
  const love = pickStr(rng, bank.love);
  const money = pickStr(rng, bank.money);
  const work = pickStr(rng, bank.work);
  const health = pickStr(rng, bank.health);
  const overall = pickStr(rng, bank.overall);

  return {
    name: cleanName,
    dayTH,
    dayColor,
    dayColorHex,
    luckyColors,
    badColor,
    zodiacTH,
    zodiacAnimal,
    zodiacWestern,
    lifePath,
    lifePathTitle,
    lifePathTraits,
    luckyNumbers,
    score,
    love,
    money,
    work,
    health,
    overall,
  };
}
