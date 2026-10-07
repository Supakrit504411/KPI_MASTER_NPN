import { getScoreLevel, getUniqueItems, getUniquePEAs, getPEASummary } from './parseCSV';

export const LEVEL_STYLE = {
  passed: { label: 'ผ่านเกณฑ์', color: '#059669', chip: 'bg-emerald-100 text-emerald-700' },
  warning: { label: 'ใกล้ผ่าน', color: '#d97706', chip: 'bg-amber-100 text-amber-700' },
  failed: { label: 'ไม่ผ่าน', color: '#dc2626', chip: 'bg-red-100 text-red-700' },
  pending: { label: 'รอผล', color: '#cbd5e1', chip: 'bg-slate-100 text-slate-500' },
};

export const fmt = (n, digits = 2) =>
  Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: digits });

export function levelOf(row) {
  return row ? getScoreLevel(row.status, row.score) : 'pending';
}

// item -> { item, description, unit, target, rows: { [pea]: row } } ตามลำดับในชีต
export function buildItemIndex(data) {
  const index = new Map();
  for (const item of getUniqueItems(data)) {
    index.set(item, { item, description: '', unit: '', target: 0, group: '', rows: {} });
  }
  for (const row of data) {
    const entry = index.get(row.item);
    if (!entry) continue;
    entry.rows[row.pea] = row;
    if (!entry.description && row.description) entry.description = row.description;
    if (!entry.unit && row.unit) entry.unit = row.unit;
    if (!entry.target && row.targetLevel5) entry.target = row.targetLevel5;
  }
  return index;
}

// เรียงอันดับตามคะแนน KPI แล้วตาม % (เฉพาะแถวที่มีผลแล้ว)
export function rankItemRows(entry) {
  const rows = Object.values(entry.rows)
    .filter((r) => r.status !== 'pending')
    .toSorted((a, b) => b.score - a.score || b.percentage - a.percentage);
  const ranks = {};
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    ranks[r.pea] = prev && prev.score === r.score && prev.percentage === r.percentage ? ranks[prev.pea] : i + 1;
  });
  return { rows, ranks, count: rows.length };
}

// สรุปทั้งหน่วยงาน + อันดับ % คะแนนสุทธิ เทียบกับทุก PEA
export function buildPEAOverview(data, focusPeas) {
  const all = getUniquePEAs(data)
    .map((pea) => getPEASummary(data, pea))
    .toSorted((a, b) => b.percentage - a.percentage);
  const rankOf = {};
  all.forEach((s, i) => { rankOf[s.pea] = i + 1; });
  const avg = all.length ? all.reduce((s, x) => s + x.percentage, 0) / all.length : 0;
  return {
    focus: focusPeas.map((pea) => ({ ...getPEASummary(data, pea), rank: rankOf[pea] })),
    totalPeas: all.length,
    avg,
  };
}

// ข้อที่ยังไม่ผ่านของ PEA ที่เลือก (ทุกข้อที่มีผลแล้วแต่คะแนน < 5)
export function defaultFocusItems(index, focusPeas) {
  const items = [];
  for (const entry of index.values()) {
    if (focusPeas.some((p) => entry.rows[p] && entry.rows[p].status === 'failed')) items.push(entry.item);
  }
  return items;
}
