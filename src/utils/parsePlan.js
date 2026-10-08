import Papa from 'papaparse';

// ลำดับคอลัมน์ในชีตแผนปฏิบัติ (A..R)
const COL = {
  area: 0, // งานด้าน
  item: 1, // ข้อที่
  activity: 2, // กิจกรรม
  source: 3, // ที่มา
  period: 4, // ช่วงเวลาดำเนินการ
  office: 5, // รายการแรก กฟฟ.
  grade: 6, // เกณฑ์ประเมินความสำเร็จกิจกรรม (A/B/C/F/I/N/A)
  yearlyTarget: 7, // ค่าเป้าหมายรายปี
  q3Target: 8, // เป้าหมายสะสม Q3
  unit: 9, // หน่วย
  targetSum: 10, // ค่ารวมของ เป้าหมาย(จำนวน)
  resultSum: 11, // ค่ารวมของ ผลงาน(จำนวน)
  resultPct: 12, // ค่ารวมของ ผลงาน(%)
  quarterPct: 13, // ค่ารวมของ % ความสำเร็จไตรมาส
  passPct: 14, // ค่ารวมของ %Pass (Max100)
  issue: 15, // ปัญหาอุปสรรค/ข้อเสนอแนะ
  owner: 16, // ผู้รวบรวมติดตามและรายงาน
  dataPeriod: 17, // ข้อมูลสะสม
};

// เกรดสถานะตามเกณฑ์ประเมินความสำเร็จกิจกรรม (ตาม legend ของหน่วยงาน)
export const GRADE_ORDER = ['A', 'B', 'C', 'F', 'I', 'N/A'];
export const GRADE_STYLE = {
  A: { label: 'แล้วเสร็จ/ตามแผน', color: '#16a34a', chip: 'bg-green-100 text-green-700', desc: 'แล้วเสร็จ / เป็นไปตามแผน' },
  B: { label: 'ตามแผน', color: '#84a60c', chip: 'bg-lime-100 text-lime-700', desc: 'อยู่ระหว่างดำเนินการ และยังไม่น่าเป็นห่วง (ผลได้ตามแผนสายงาน)' },
  C: { label: 'ควรจับตา', color: '#eab308', chip: 'bg-amber-100 text-amber-700', desc: 'อยู่ระหว่างดำเนินการ แต่ควรจับตามองอย่างใกล้ชิด' },
  F: { label: 'ต่ำกว่าเป้า', color: '#dc2626', chip: 'bg-red-100 text-red-700', desc: 'ดำเนินการไม่เป็นไปตามเป้าหมาย (เกินกรอบเวลา/ต่ำกว่าเป้ารายไตรมาส)' },
  I: { label: 'ยังไม่ถึงเวลา', color: '#2563eb', chip: 'bg-blue-100 text-blue-700', desc: 'ยังไม่ถึงเวลาดำเนินการ' },
  'N/A': { label: 'ไม่สรุปผล', color: '#94a3b8', chip: 'bg-slate-100 text-slate-500', desc: 'ส่วนเกี่ยวข้องไม่สรุปผลการดำเนินงาน' },
};

export const gradeStyle = (g) => GRADE_STYLE[g] || GRADE_STYLE['N/A'];

function trim(v) {
  return String(v ?? '').trim();
}

// แปลงเป็นตัวเลข คืน null เมื่อว่าง (แยก "ว่าง" ออกจาก "0" จริง)
function numOrNull(v) {
  const s = trim(v).replace(/,/g, '');
  if (s === '') return null;
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

// ดึงชื่อหน่วยงานสั้น เช่น "D06101 -กฟส.นพ.-(L)" -> "กฟส.นพ."
export function officeName(raw) {
  const m = trim(raw).match(/(กฟ[จสฟ]\.[^-()\s]+)/);
  return m ? m[1] : trim(raw);
}

function cell(row, i) {
  return trim(row[i]);
}

// แปลง CSV ชีตเดียวเป็นรายการกิจกรรม
export function parsePlanCSV(csvText, areaLabel) {
  if (!csvText) return [];
  const { data } = Papa.parse(csvText, { skipEmptyLines: true });
  const rows = data.slice(1); // ตัดหัวตาราง
  const out = [];
  rows.forEach((row, idx) => {
    if (!row.some((c) => trim(c))) return;
    const item = cell(row, COL.item);
    const activity = cell(row, COL.activity);
    if (!item && !activity) return;
    const rawGrade = cell(row, COL.grade).toUpperCase();
    const grade = GRADE_STYLE[rawGrade] ? rawGrade : 'N/A';
    out.push({
      area: cell(row, COL.area) || areaLabel,
      areaLabel,
      item,
      activity,
      source: cell(row, COL.source),
      period: cell(row, COL.period),
      office: officeName(cell(row, COL.office)),
      grade,
      yearlyTarget: numOrNull(row[COL.yearlyTarget]),
      q3Target: numOrNull(row[COL.q3Target]),
      unit: cell(row, COL.unit),
      targetSum: numOrNull(row[COL.targetSum]),
      resultSum: numOrNull(row[COL.resultSum]),
      resultPct: numOrNull(row[COL.resultPct]),
      quarterPct: numOrNull(row[COL.quarterPct]),
      passPct: numOrNull(row[COL.passPct]),
      issue: cell(row, COL.issue),
      owner: cell(row, COL.owner),
      dataPeriod: cell(row, COL.dataPeriod),
      _row: idx,
    });
  });
  return out;
}

// สรุปจำนวนกิจกรรมตามเกรด + ค่าเฉลี่ยผลงาน% (เฉพาะที่มีผล)
export function summarizePlan(activities) {
  const byGrade = {};
  for (const g of GRADE_ORDER) byGrade[g] = 0;
  let pctSum = 0;
  let pctCount = 0;
  for (const a of activities) {
    byGrade[a.grade] = (byGrade[a.grade] || 0) + 1;
    if (a.resultPct != null) {
      pctSum += a.resultPct;
      pctCount += 1;
    }
  }
  return {
    total: activities.length,
    byGrade,
    avgPct: pctCount ? pctSum / pctCount : null,
    withResult: pctCount,
  };
}

// รวมทุกชีตเป็นโครงสร้างสำหรับนำเสนอ: { areas: [{key, label, activities, summary}], office, dataPeriod, activities(all) }
export function buildPlanDeck(csvBySheet) {
  const areas = Object.entries(csvBySheet).map(([label, csv]) => {
    const activities = parsePlanCSV(csv, label);
    return { key: label, label, activities, summary: summarizePlan(activities) };
  });
  const all = areas.flatMap((a) => a.activities);
  const office = all.find((a) => a.office)?.office || '';
  const dataPeriod = all.find((a) => a.dataPeriod)?.dataPeriod || '';
  return { areas, activities: all, office, dataPeriod, summary: summarizePlan(all) };
}
