// ดึง leaderboard ของกลุ่ม XS จากชีต "จัดอันดับ XS" (แยกจากชีตหลักเพื่อไม่ให้กระทบ dataset L/M/S)
// โครงสร้าง: A=กลุ่ม(XS), B=รหัส-กฟฟ, C=คะแนน, D=ข้อมูลสะสม
import Papa from 'papaparse';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '1P90pDKqos8bchlJRpr7GiQQJPEXdMIZvBps5BDVO1zE';
const XS_SHEET = 'จัดอันดับ XS';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(XS_SHEET)}`;

function extractPeaName(raw) {
  const s = String(raw ?? '').trim();
  const m = s.match(/กฟ[สจฟ]\.\s*[^\s\-()]+/);
  return m ? m[0].replace(/\s+/g, '') : '';
}

function extractCode(raw) {
  const s = String(raw ?? '').trim();
  const m = s.match(/^(D\d+)/);
  return m ? m[1] : '';
}

function toNumber(v) {
  const n = Number.parseFloat(String(v ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * คืน: { rows: [{rank, pea, code, score, period, raw}], period, total }
 * ข้อมูลในชีตเรียงจากคะแนนมากไปน้อยอยู่แล้ว แต่ parser เรียงซ้ำกันพลาด
 */
export async function fetchXSLeaderboard() {
  try {
    const res = await fetch(URL);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.length < 10) return null;
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const fields = parsed.meta.fields || [];
    const codeKey = fields[1];
    const scoreKey = fields[2];
    const periodKey = fields[3];

    const rows = [];
    for (const r of parsed.data) {
      const raw = String(r[codeKey] ?? '').trim();
      if (!raw) continue;
      const pea = extractPeaName(raw);
      if (!pea) continue;
      const code = extractCode(raw);
      const score = toNumber(r[scoreKey]);
      const period = String(r[periodKey] ?? '').trim();
      rows.push({ pea, code, score, period, raw });
    }
    const sorted = [...rows].sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
    let lastScore = null;
    let lastRank = 0;
    const ranked = sorted.map((r, i) => {
      const rank = r.score === lastScore ? lastRank : i + 1;
      lastScore = r.score;
      lastRank = rank;
      return { ...r, rank };
    });
    return {
      rows: ranked,
      period: ranked[0]?.period || '',
      total: ranked.length,
    };
  } catch (err) {
    console.warn('fetchXSLeaderboard failed:', err);
    return null;
  }
}
