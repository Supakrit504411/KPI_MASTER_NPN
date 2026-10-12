import Papa from 'papaparse';

const COLUMN_INDEX = {
  item: 0, // A
  description: 1, // B
  pea: 2, // C
  targetYearly: 3, // D
  targetLevel5: 4, // E
  result: 5, // F
  score: 6, // G
  weight: 7, // H
  scoreNet: 8, // I
  scoreFull: 9, // J
  note: 10, // K
  percentage: 11, // L
  unit: 12, // M
  group: 13, // N
};

export const MONITOR_PEAS = ['กฟส.นพ.', 'กฟส.ธพ.', 'กฟส.นก.', 'กฟส.บพง.'];
export const DISPLAY_GROUPS = ['NE1', 'S', 'จุดรวมงาน'];

function normalizeKey(value) {
  return String(value ?? '').trim();
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).replace(/,/g, '').trim();
  if (normalized === '') return 0;
  const num = Number.parseFloat(normalized);
  return Number.isNaN(num) ? 0 : num;
}

function deriveStatus(rawScore) {
  const normalized = String(rawScore ?? '').trim();
  if (!normalized) return 'pending';
  const num = toNumber(normalized);
  if (Number.isNaN(num)) return 'pending';
  return num >= 5 ? 'passed' : 'failed';
}

function getCell(row, fields, index) {
  const key = fields[index];
  if (!key) return '';
  return row[key];
}

export function parseSheetCSV(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => normalizeKey(header),
  });

  if (result.errors.length > 0) {
    console.warn('CSV parse warnings:', result.errors);
  }

  const fields = result.meta.fields || [];

  return result.data.map((row, index) => {
    const score = toNumber(getCell(row, fields, COLUMN_INDEX.score));
    const status = deriveStatus(getCell(row, fields, COLUMN_INDEX.score));
    const percentage = toNumber(getCell(row, fields, COLUMN_INDEX.percentage));
    const group = normalizeKey(getCell(row, fields, COLUMN_INDEX.group));

    return {
      item: normalizeKey(getCell(row, fields, COLUMN_INDEX.item)),
      description: normalizeKey(getCell(row, fields, COLUMN_INDEX.description)),
      pea: normalizeKey(getCell(row, fields, COLUMN_INDEX.pea)),
      targetYearly: toNumber(getCell(row, fields, COLUMN_INDEX.targetYearly)),
      targetLevel5: toNumber(getCell(row, fields, COLUMN_INDEX.targetLevel5)),
      result: toNumber(getCell(row, fields, COLUMN_INDEX.result)),
      score,
      weight: toNumber(getCell(row, fields, COLUMN_INDEX.weight)),
      scoreNet: toNumber(getCell(row, fields, COLUMN_INDEX.scoreNet)),
      scoreFull: toNumber(getCell(row, fields, COLUMN_INDEX.scoreFull)),
      note: normalizeKey(getCell(row, fields, COLUMN_INDEX.note)),
      percentage,
      unit: normalizeKey(getCell(row, fields, COLUMN_INDEX.unit)),
      group,
      _rowIndex: index + 2,
      status,
      isPassed: status === 'passed',
      isPending: status === 'pending',
    };
  });
}

export function filterValidRows(data) {
  return data.filter((row) => {
    const pea = normalizeKey(row.pea);
    const item = normalizeKey(row.item);
    return pea && item;
  });
}

export function getUniqueGroups(data) {
  const seen = new Set();
  const groups = [];

  for (const row of data) {
    const group = normalizeKey(row.group);
    if (!group || seen.has(group)) continue;
    seen.add(group);
    groups.push(group);
  }

  return groups;
}

// กลุ่มหลักของแต่ละหน่วยงาน = กลุ่มที่พบบ่อยสุดในแถวของหน่วยนั้น
// กันกรณีข้อมูลผิด (บางแถวพิมพ์กลุ่มผิด) ไม่ให้หน่วยงานโผล่ผิดกลุ่ม
export function getPeaGroupMap(data) {
  const counts = {};
  for (const row of data) {
    const pea = normalizeKey(row.pea);
    const group = normalizeKey(row.group);
    if (!pea || !group) continue;
    (counts[pea] ??= {})[group] = (counts[pea][group] || 0) + 1;
  }
  const map = {};
  for (const pea of Object.keys(counts)) {
    map[pea] = Object.entries(counts[pea]).sort((a, b) => b[1] - a[1])[0][0];
  }
  return map;
}

export function getUniquePEAs(data) {
  const seen = new Set();
  const peas = [];

  for (const row of data) {
    const pea = normalizeKey(row.pea);
    if (!pea || seen.has(pea)) continue;
    seen.add(pea);
    peas.push(pea);
  }

  return peas;
}

export function getPEAsByGroup(data, groupName) {
  const normalizedGroup = normalizeKey(groupName);
  const seen = new Set();
  const peas = [];

  for (const row of data) {
    if (normalizeKey(row.group) !== normalizedGroup) continue;
    const pea = normalizeKey(row.pea);
    if (!pea || seen.has(pea)) continue;
    seen.add(pea);
    peas.push(pea);
  }

  return peas;
}

// น้ำหนักตามเกณฑ์เขต (รวม 80% ยังไม่ประกาศอีก 20%)
// เมื่อประกาศแล้ว ปรับแก้ที่ตารางนี้ที่เดียว
export const SCORE_WEIGHTS = [
  { label: 'กลุ่ม A (ข้อ 1–8)', min: 1, max: 8, weight: 30 },
  { label: 'กลุ่ม B (ข้อ 9–39)', min: 9, max: 39, weight: 30 },
  { label: 'กลุ่ม C (ข้อ 40–42)', min: 40, max: 42, weight: 20 },
];
const KNOWN_WEIGHT_SUM = SCORE_WEIGHTS.reduce((s, g) => s + g.weight, 0); // = 80

// ดึงเลขข้อหลัก (ตัวเลขก่อนจุด) จาก item เช่น "1.1" -> 1
function itemMajor(item) {
  const n = Number.parseInt(String(item ?? '').trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function computeWeightedPct(rows) {
  let weightedSum = 0;
  let totalWeightUsed = 0;
  const breakdown = [];
  for (const g of SCORE_WEIGHTS) {
    const inGroup = rows.filter((r) => {
      const m = itemMajor(r.item);
      return m != null && m >= g.min && m <= g.max;
    });
    // คิดเฉพาะข้อที่ประเมินผลแล้ว ให้ใช้ฐานเดียวกับ "อัตราผ่าน (ที่ประเมิน)"
    // ถ้านับข้อที่ยังรอผลเข้าไปในตัวหารด้วย เปอร์เซ็นต์จะถูกฉุดต่ำผิดจริง
    const evaluated = inGroup.filter((r) => r.status !== 'pending');
    const pendingCount = inGroup.length - evaluated.length;
    const net = evaluated.reduce((s, r) => s + r.scoreNet, 0);
    const full = evaluated.reduce((s, r) => s + r.scoreFull, 0);
    const pct = full > 0 ? (net / full) * 100 : null;
    if (pct != null) {
      weightedSum += pct * g.weight;
      totalWeightUsed += g.weight;
    }
    breakdown.push({ ...g, net, full, pct, pendingCount });
  }
  // ปรับฐานเป็น 100% ของน้ำหนักที่ประกาศแล้ว เพื่อให้อันดับเทียบกันได้
  const normalized = totalWeightUsed > 0 ? weightedSum / totalWeightUsed : 0;
  return { weightedPct: normalized, weightedBreakdown: breakdown, knownWeight: KNOWN_WEIGHT_SUM };
}

function summarizeRows(rows, labelKey) {
  const total = rows.length;
  const passed = rows.filter((row) => row.status === 'passed').length;
  const failed = rows.filter((row) => row.status === 'failed').length;
  const pending = rows.filter((row) => row.status === 'pending').length;
  const evaluated = passed + failed;
  const totalScoreNet = rows.reduce((sum, row) => sum + row.scoreNet, 0);
  const totalScoreFull = rows.reduce((sum, row) => sum + row.scoreFull, 0);
  const percentage = totalScoreFull > 0 ? (totalScoreNet / totalScoreFull) * 100 : 0;
  const { weightedPct, weightedBreakdown, knownWeight } = computeWeightedPct(rows);

  return {
    [labelKey]: rows[0]?.[labelKey] ?? '',
    total,
    passed,
    failed,
    pending,
    evaluated,
    totalScoreNet: Math.round(totalScoreNet * 100) / 100,
    totalScoreFull: Math.round(totalScoreFull * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    weightedPct: Math.round(weightedPct * 100) / 100,
    weightedBreakdown,
    knownWeight,
    passRate: evaluated > 0 ? Math.round((passed / evaluated) * 100) : 0,
  };
}

export function getPEASummary(data, peaName) {
  const peaData = data.filter((row) => normalizeKey(row.pea) === normalizeKey(peaName));
  return {
    pea: normalizeKey(peaName),
    ...summarizeRows(peaData, 'pea'),
  };
}

export function getGroupSummary(data, groupName) {
  const groupData = data.filter((row) => normalizeKey(row.group) === normalizeKey(groupName));
  return {
    group: normalizeKey(groupName),
    ...summarizeRows(groupData, 'group'),
  };
}

export function getComparisonData(data) {
  return getUniquePEAs(data).map((pea) => getPEASummary(data, pea));
}

export function getGroupComparisonData(data) {
  return getUniqueGroups(data).map((group) => getGroupSummary(data, group));
}

export function getUniqueItems(data) {
  const seen = new Set();
  const items = [];

  for (const row of data) {
    const item = normalizeKey(row.item);
    if (!item || seen.has(item)) continue;
    seen.add(item);
    items.push(item);
  }

  return items;
}

export function getItemComparison(data, itemName) {
  const rows = data.filter((row) => normalizeKey(row.item) === normalizeKey(itemName));
  return rows.map((row) => ({
    pea: row.pea,
    score: row.score,
    scoreNet: row.scoreNet,
    scoreFull: row.scoreFull,
    status: row.status,
    description: row.description,
    target: row.targetLevel5 || row.targetYearly || '',
    result: row.result || '',
    percentage: row.percentage || 0,
    group: row.group || '',
  }));
}

export function getScoreLevel(status, score) {
  if (status === 'pending') return 'pending';
  if (score >= 5) return 'passed';
  if (score >= 4.8) return 'warning';
  return 'failed';
}

export function getOverallSummary(data) {
  const peas = getUniquePEAs(data);
  const summaries = peas.map((pea) => getPEASummary(data, pea));
  const total = summaries.reduce((s, sum) => s + sum.total, 0);
  const passed = summaries.reduce((s, sum) => s + sum.passed, 0);
  const failed = summaries.reduce((s, sum) => s + sum.failed, 0);
  const pending = summaries.reduce((s, sum) => s + sum.pending, 0);
  const evaluated = passed + failed;

  return {
    totalPEAs: peas.length,
    totalItems: total,
    totalPassed: passed,
    totalFailed: failed,
    totalPending: pending,
    evaluated,
    overallPassRate: evaluated > 0 ? Math.round((passed / evaluated) * 100) : 0,
  };
}
