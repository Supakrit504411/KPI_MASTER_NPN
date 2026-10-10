import Papa from 'papaparse';

// คอลัมน์ที่ใช้: A=กฟฟ, B=เดือน(MM/YYYY), C=จำนวนCA, I=รวมชำระเงิน
const COL = { office: 0, month: 1, ca: 2, payment: 8 };

export const TH_MONTHS = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// "D06101:กฟจ.นครพนม" -> "กฟจ.นครพนม"
export function officeName(raw) {
  const s = String(raw ?? '').trim();
  const i = s.indexOf(':');
  return i >= 0 ? s.slice(i + 1).trim() : s;
}

function toNumber(v) {
  const n = Number.parseFloat(String(v ?? '').replace(/,/g, '').trim());
  return Number.isNaN(n) ? 0 : n;
}

// "05/2024" หรือ "9/2024" -> { month: 5, year: 2024 }
function parseMonth(raw) {
  const [m, y] = String(raw ?? '').split('/').map((x) => Number.parseInt(x, 10));
  return { month: m || 0, year: y || 0 };
}

export const monthLabel = (month, year) => `${TH_MONTHS[month] || month} ${year}`;

export function parseLinePea(csvText) {
  if (!csvText) return [];
  const { data } = Papa.parse(csvText, { skipEmptyLines: true });
  return data.slice(1)
    .filter((r) => r[COL.office] && r[COL.month])
    .map((r) => {
      const { month, year } = parseMonth(r[COL.month]);
      return {
        office: officeName(r[COL.office]),
        monthNo: month,
        year,
        label: monthLabel(month, year),
        ca: toNumber(r[COL.ca]),
        payment: toNumber(r[COL.payment]),
      };
    })
    .filter((r) => r.month !== 0 && r.year !== 0)
    .sort((a, b) => a.year - b.year || a.monthNo - b.monthNo);
}

// รายการปี/เดือน/หน่วยงานที่มีในข้อมูล (ไว้ทำตัวกรอง)
export function linePeaFacets(rows) {
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const months = [...new Set(rows.map((r) => r.monthNo))].sort((a, b) => a - b);
  const offices = [...new Set(rows.map((r) => r.office))];
  return { years, months, offices };
}
