"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/leads-store";

const ADMIN_CODE = "1234";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString();
  }
}

function csvCell(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export default function LeadsPage() {
  const [authed, setAuthed] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [gateErr, setGateErr] = useState("");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [query, setQuery] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setLoadErr("");
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ (" + res.status + ")");
      const data = await res.json();
      setLeads(Array.isArray(data.leads) ? (data.leads as Lead[]) : []);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      loadLeads();
    }
  }, [authed, loadLeads]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (codeInput.trim() === ADMIN_CODE) {
      setAuthed(true);
      setGateErr("");
    } else {
      setGateErr("รหัสไม่ถูกต้อง ลองอีกครั้ง");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const hay = [l.name, l.phone, l.contact].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [leads, query]);

  function exportCsv() {
    const headers = [
      "เวลา",
      "ชื่อ",
      "เบอร์",
      "ช่องทางติดต่อ",
      "ความสนใจ",
      "วันเกิด",
      "ราศี/นักษัตร",
      "เลขชีวิต",
    ];
    const lines = [headers.join(",")];
    for (const l of filtered) {
      lines.push(
        [
          csvCell(l.createdAt),
          csvCell(l.name),
          csvCell(l.phone),
          csvCell(l.contact),
          csvCell(l.interest),
          csvCell(l.birthDate),
          csvCell(l.zodiac),
          csvCell(l.lifePath),
        ].join(",")
      );
    }
    const csv = "﻿" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "leads-" + stamp + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <main className="page">
        <section className="section">
          <div className="admin-gate">
            <h1 className="section-title">หน้าผู้ดูแล · จัดการ Lead</h1>
            <p className="hint">
              ใส่รหัสผ่านเพื่อเข้าดูรายชื่อผู้สนใจ
            </p>
            <form className="form-grid" onSubmit={handleUnlock}>
              <div className="field">
                <label className="label" htmlFor="admin-code">
                  รหัสผ่านผู้ดูแล
                </label>
                <input
                  id="admin-code"
                  className="input"
                  type="password"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="ใส่รหัส"
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                เข้าสู่ระบบ
              </button>
            </form>
            {gateErr && <p className="msg msg-err">{gateErr}</p>}
            <p className="hint">
              หมายเหตุ: รหัสนี้เป็นเพียงการกั้นหน้าจอเบื้องต้น ไม่ใช่ระบบความปลอดภัยจริง
              อย่าเก็บข้อมูลที่ละเอียดอ่อนไว้บนหน้านี้ในการใช้งานจริง
            </p>
            <p className="footer">
              <Link className="link" href="/">
                ← กลับหน้าแรก
              </Link>
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="section admin-app">
        <h1 className="section-title">หน้าผู้ดูแล · จัดการ Lead</h1>
        <p className="hint">
          หมายเหตุ: การกั้นด้วยรหัสนี้ไม่ใช่ระบบความปลอดภัยจริง ใช้เพื่อกันการเปิดดูโดยบังเอิญเท่านั้น
        </p>

        <div className="toolbar">
          <input
            className="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ / เบอร์ / ช่องทางติดต่อ"
            aria-label="ค้นหา Lead"
          />
          <button type="button" className="btn btn-ghost" onClick={loadLeads} disabled={loading}>
            {loading ? "กำลังโหลด..." : "รีเฟรช"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            ส่งออก CSV
          </button>
          <Link className="link" href="/">
            ← กลับหน้าแรก
          </Link>
        </div>

        <p className="count">
          ทั้งหมด {leads.length} รายการ
          {query.trim() ? " · แสดง " + filtered.length + " รายการที่ตรงกับการค้นหา" : ""}
        </p>

        {loadErr && <p className="msg msg-err">{loadErr}</p>}

        {filtered.length === 0 ? (
          <p className="empty">
            {loading
              ? "กำลังโหลดข้อมูล..."
              : loadErr
              ? "โหลดข้อมูลไม่สำเร็จ"
              : "ยังไม่มีข้อมูล Lead ที่ตรงกับเงื่อนไข"}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>เวลา</th>
                  <th>ชื่อ</th>
                  <th>เบอร์</th>
                  <th>ช่องทางติดต่อ</th>
                  <th>ความสนใจ</th>
                  <th>วันเกิด</th>
                  <th>ราศี/นักษัตร</th>
                  <th>เลขชีวิต</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>{fmtTime(l.createdAt)}</td>
                    <td>{l.name}</td>
                    <td>{l.phone}</td>
                    <td>{l.contact}</td>
                    <td>{l.interest || "-"}</td>
                    <td>{l.birthDate || "-"}</td>
                    <td>{l.zodiac || "-"}</td>
                    <td>{l.lifePath ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="footer">
          ข้อมูลนี้ใช้เพื่อการติดต่อกลับเท่านั้น · เพื่อความบันเทิง
        </p>
      </section>
    </main>
  );
}
