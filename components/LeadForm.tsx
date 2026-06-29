'use client';

import { useState } from 'react';
import type { Reading } from '@/lib/astrology';

type LeadFormProps = {
  reading?: Reading | null;
};

const INTEREST_OPTIONS = [
  'ดวงเชิงลึก 12 เดือน',
  'วันมงคล / ฤกษ์ดี',
  'เลขเด็ดประจำตัว',
  'ดวงรายวันส่งทุกเช้า',
  'ดวงคู่ / ความเข้ากัน',
  'อื่น ๆ',
];

type Status = 'idle' | 'loading' | 'ok' | 'err';

type LeadApiResponse = {
  ok?: boolean;
  error?: string;
} | null;

export default function LeadForm({ reading }: LeadFormProps) {
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadInterest, setLeadInterest] = useState(INTEREST_OPTIONS[0]);
  const [leadConsent, setLeadConsent] = useState(false);

  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = leadName.trim();
    const phone = leadPhone.trim();
    const contact = leadContact.trim();

    if (!name) {
      setStatus('err');
      setMessage('กรุณากรอกชื่อเล่นของคุณ');
      return;
    }
    if (!phone) {
      setStatus('err');
      setMessage('กรุณากรอกเบอร์โทรเพื่อให้เราติดต่อกลับ');
      return;
    }
    if (!leadConsent) {
      setStatus('err');
      setMessage('กรุณายืนยันการยินยอมก่อนส่งข้อมูล');
      return;
    }

    setStatus('loading');
    setMessage('');

    const payload: {
      name: string;
      phone: string;
      contact: string;
      interest?: string;
      birthDate?: string;
      zodiac?: string;
      lifePath?: number;
    } = {
      name,
      phone,
      contact,
      interest: leadInterest,
    };

    if (reading) {
      payload.zodiac = reading.zodiacTH;
      payload.lifePath = reading.lifePath;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as LeadApiResponse;

      if (res.ok && data && data.ok) {
        setStatus('ok');
        setMessage('รับเรื่องแล้ว เราจะส่งดวงฉบับเต็มให้คุณเร็ว ๆ นี้ ขอบคุณค่ะ');
        setLeadName('');
        setLeadPhone('');
        setLeadContact('');
        setLeadInterest(INTEREST_OPTIONS[0]);
        setLeadConsent(false);
      } else {
        setStatus('err');
        setMessage(
          (data && data.error) ||
            'ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้งนะคะ'
        );
      }
    } catch {
      setStatus('err');
      setMessage('เชื่อมต่อไม่ได้ กรุณาลองใหม่อีกครั้งนะคะ');
    }
  }

  return (
    <section className="section lead-section">
      <h2 className="section-title">ปลดล็อกดวงเชิงลึก 12 เดือน ฟรี</h2>
      <p className="hint">
        ผลด้านบนคือเวอร์ชันฟรีเต็ม ๆ แล้ว หากอยากได้ดวงเชิงลึก 12 เดือน
        วันมงคล และเลขเด็ดประจำตัว ส่งให้ฟรี ทิ้งช่องทางติดต่อไว้ได้เลย
        (เพื่อความบันเทิง)
      </p>

      <form className="lead-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="field">
            <label className="label" htmlFor="lead-name">
              ชื่อเล่น
            </label>
            <input
              id="lead-name"
              name="leadName"
              className="input"
              type="text"
              placeholder="เช่น มายด์"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="lead-phone">
              เบอร์โทร
            </label>
            <input
              id="lead-phone"
              name="leadPhone"
              className="input"
              type="tel"
              inputMode="tel"
              placeholder="0xx-xxx-xxxx"
              value={leadPhone}
              onChange={(e) => setLeadPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="lead-contact">
              LINE / อีเมล (ถ้ามี)
            </label>
            <input
              id="lead-contact"
              name="leadContact"
              className="input"
              type="text"
              placeholder="LINE ID หรืออีเมลสำหรับส่งดวง"
              value={leadContact}
              onChange={(e) => setLeadContact(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="lead-interest">
              สนใจเรื่องไหนเป็นพิเศษ
            </label>
            <select
              id="lead-interest"
              name="leadInterest"
              className="select"
              value={leadInterest}
              onChange={(e) => setLeadInterest(e.target.value)}
            >
              {INTEREST_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="checkbox" htmlFor="lead-consent">
          <input
            id="lead-consent"
            name="leadConsent"
            type="checkbox"
            checked={leadConsent}
            onChange={(e) => setLeadConsent(e.target.checked)}
            required
          />
          <span>
            ฉันยินยอมให้เก็บข้อมูลนี้เพื่อติดต่อกลับและส่งดวงเท่านั้น
            (ตาม PDPA) ไม่สแปม ยกเลิกได้ทุกเมื่อ · ไม่ส่งต่อบุคคลที่สาม
          </span>
        </label>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'กำลังส่ง...' : 'ส่งดวงให้ฉันฟรี'}
        </button>

        <p className="hint">
          เพื่อความบันเทิง · ใช้ข้อมูลเพื่อติดต่อกลับเท่านั้น
        </p>

        {status === 'ok' && message ? (
          <p className="msg msg-ok" role="status">
            {message}
          </p>
        ) : null}
        {status === 'err' && message ? (
          <p className="msg msg-err" role="alert">
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
