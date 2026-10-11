// ดึงอันดับที่ทางเขตจัดทำจากชีต "จัดอันดับ"
// โครงสร้าง: คอลัมน์ A=กลุ่ม (รวม|จุดรวมงาน|S), B=รหัส-กฟฟ, C=คะแนน, D=ข้อมูลสะสม
// แถวในแต่ละกลุ่มเรียงตามคะแนนจากมากไปน้อยอยู่แล้ว
import Papa from 'papaparse';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '1P90pDKqos8bchlJRpr7GiQQJPEXdMIZvBps5BDVO1zE';
const RANK_SHEET = 'จัดอันดับ';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(RANK_SHEET)}`;

// ดึงชื่อหน่วยงานสั้นๆ จาก "D15z -รวม กฟส.อด.2-(L)" หรือ "D06201 -กฟส.ธพ.-(S)"
function extractPeaName(raw) {
  const s = String(raw ?? '').trim();
  // จับ "กฟ[สจฟ].xxx" โดยหยุดก่อนขีด/วงเล็บ/ช่องว่าง
  const m = s.match(/(กฟ[สจฟ]\.[^-()\s]+)/);
  return m ? m[1] : '';
}

function toNumber(v) {
  const n = Number.parseFloat(String(v ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * คืนรูปแบบ: { รวม: {peaName: {rank, score, period, raw}}, จุดรวมงาน: {...}, S: {...} }
 * อันดับคิดจากคะแนน (น้อย = เลขอันดับน้อย) — คะแนนเท่ากันได้อันดับเดียวกัน
 */
export async function fetchDistrictRanking() {
  try {
    const res = await fetch(URL);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.length < 10) return null;
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const fields = parsed.meta.fields || [];
    const groupKey = fields[0];
    const codeKey = fields[1];
    const scoreKey = fields[2];
    const periodKey = fields[3];
    // แยกรายการตามกลุ่ม
    const byGroup = {};
    for (const row of parsed.data) {
      const group = String(row[groupKey] ?? '').trim();
      const code = String(row[codeKey] ?? '').trim();
      if (!group || !code) continue;
      const pea = extractPeaName(code);
      if (!pea) continue;
      const score = toNumber(row[scoreKey]);
      const period = String(row[periodKey] ?? '').trim();
      (byGroup[group] ??= []).push({ pea, score, period, raw: code });
    }
    // ให้อันดับภายในแต่ละกลุ่ม (ข้อมูลเรียงจากคะแนนมากไปน้อยอยู่แล้ว แต่กันเหนียวจัดเรียงอีกครั้ง)
    const out = {};
    for (const [group, rows] of Object.entries(byGroup)) {
      const sorted = [...rows].sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
      const map = {};
      let lastScore = null;
      let lastRank = 0;
      sorted.forEach((r, i) => {
        const rank = r.score === lastScore ? lastRank : i + 1;
        map[r.pea] = { rank, score: r.score, period: r.period, raw: r.raw, total: sorted.length };
        lastScore = r.score;
        lastRank = rank;
      });
      out[group] = map;
    }
    return out;
  } catch (err) {
    console.warn('fetchDistrictRanking failed:', err);
    return null;
  }
}
