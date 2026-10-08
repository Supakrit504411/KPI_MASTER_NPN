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

// item -> { item, description, unit, target, targetYearly, rows: { [pea]: row } } ตามลำดับในชีต
export function buildItemIndex(data) {
  const index = new Map();
  for (const item of getUniqueItems(data)) {
    index.set(item, { item, description: '', unit: '', target: 0, targetYearly: 0, group: '', rows: {} });
  }
  for (const row of data) {
    const entry = index.get(row.item);
    if (!entry) continue;
    entry.rows[row.pea] = row;
    if (!entry.description && row.description) entry.description = row.description;
    if (!entry.unit && row.unit) entry.unit = row.unit;
    if (!entry.target && row.targetLevel5) entry.target = row.targetLevel5;
    if (!entry.targetYearly && row.targetYearly) entry.targetYearly = row.targetYearly;
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

// เรียงอันดับ "ภายในกลุ่ม (Group) เดียวกัน" — หน่วยงานเทียบกันเฉพาะหน่วยที่อยู่กลุ่มเดียวกัน
// คืน ranks[pea] = อันดับในกลุ่ม, counts[pea] = จำนวนหน่วยงานในกลุ่มนั้นที่มีผลแล้ว
export function rankItemRowsByGroup(entry) {
  const byGroup = {};
  for (const row of Object.values(entry.rows)) {
    if (row.status === 'pending') continue;
    (byGroup[row.group] ||= []).push(row);
  }
  const ranks = {};
  const counts = {};
  for (const rows of Object.values(byGroup)) {
    rows.sort((a, b) => b.score - a.score || b.percentage - a.percentage);
    rows.forEach((r, i) => {
      const prev = rows[i - 1];
      ranks[r.pea] = prev && prev.score === r.score && prev.percentage === r.percentage ? ranks[prev.pea] : i + 1;
      counts[r.pea] = rows.length;
    });
  }
  return { ranks, counts };
}

// สรุปทั้งหน่วยงาน + อันดับ % คะแนนสุทธิ "เทียบเฉพาะในกลุ่ม (Group) เดียวกัน"
export function buildPEAOverview(data, focusPeas) {
  // กลุ่มของแต่ละหน่วยงาน (เอาจากแถวแรกที่เจอ)
  const peaGroup = {};
  for (const row of data) {
    const pea = normalizeKeyLocal(row.pea);
    if (pea && !(pea in peaGroup)) peaGroup[pea] = row.group || '';
  }
  const all = getUniquePEAs(data).map((pea) => ({ ...getPEASummary(data, pea), group: peaGroup[pea] || '' }));

  // จัดอันดับและค่าเฉลี่ยภายในแต่ละกลุ่ม
  const byGroup = {};
  for (const s of all) (byGroup[s.group] ||= []).push(s);
  const rankOf = {};
  const groupTotal = {};
  const groupAvgOf = {};
  for (const list of Object.values(byGroup)) {
    list.sort((a, b) => b.percentage - a.percentage);
    const gAvg = list.length ? list.reduce((t, x) => t + x.percentage, 0) / list.length : 0;
    list.forEach((s, i) => {
      rankOf[s.pea] = i + 1;
      groupTotal[s.pea] = list.length;
      groupAvgOf[s.pea] = gAvg;
    });
  }

  const focus = focusPeas.map((pea) => ({
    ...getPEASummary(data, pea),
    group: peaGroup[pea] || '',
    rank: rankOf[pea],
    groupTotal: groupTotal[pea] || 0,
    groupAvg: groupAvgOf[pea] || 0,
  }));

  // ค่าเฉลี่ยของแต่ละกลุ่มที่มีหน่วยงานโฟกัสอยู่ (ไว้โชว์หัวสไลด์)
  const groups = [...new Set(focus.map((f) => f.group))].map((g) => ({
    group: g,
    total: byGroup[g]?.length || 0,
    avg: byGroup[g] && byGroup[g].length ? byGroup[g].reduce((t, x) => t + x.percentage, 0) / byGroup[g].length : 0,
  }));

  return { focus, groups, totalPeas: all.length };
}

function normalizeKeyLocal(value) {
  return String(value ?? '').trim();
}

export const ITEM_FILTERS = {
  all: 'ทั้งหมด',
  passed: 'ข้อที่ผ่าน',
  failed: 'ข้อที่ไม่ผ่าน',
};

// all = ทุกข้อ, failed = มี PEA ที่เลือกอย่างน้อย 1 หน่วยไม่ผ่าน, passed = PEA ที่เลือกผ่านครบทุกหน่วย
export function filterItems(index, focusPeas, mode) {
  const items = [];
  for (const entry of index.values()) {
    const statuses = focusPeas.map((p) => entry.rows[p]?.status ?? 'pending');
    const keep =
      mode === 'failed' ? statuses.includes('failed')
        : mode === 'passed' ? statuses.length > 0 && statuses.every((s) => s === 'passed')
          : true;
    if (keep) items.push(entry.item);
  }
  return items;
}

// ลิงก์แชร์ Google Drive แสดงเป็นรูปตรงๆ ไม่ได้ — แปลงเป็นลิงก์รูปภาพ
export function toImageUrl(url) {
  const value = String(url || '').trim();
  const m = value.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w1920` : value;
}

// ย่อรูปที่เลือกจากเครื่องให้ไม่เกิน 1920x1080 เพื่อเก็บใน localStorage ได้
export function fileToCoverDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(1, 1920 / img.width, 1080 / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(src);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error('ไม่สามารถอ่านไฟล์รูปได้'));
    };
    img.src = src;
  });
}
