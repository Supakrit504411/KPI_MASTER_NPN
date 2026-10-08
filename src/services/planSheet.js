// ดึงข้อมูล "แผนปฏิบัติ" จาก Google Sheet (คนละไฟล์กับ KPI) — 2 ชีต: บริการ, ธุรกิจ
const PLAN_SHEET_ID = import.meta.env.VITE_PLAN_SHEET_ID || '1EtRq3UVIlQ2RqtAD-m4l4DW4x_mLwdC3zDCbGiGOQO8';
export const PLAN_SHEETS = ['บริการ', 'ธุรกิจ'];
const BASE_URL = `https://docs.google.com/spreadsheets/d/${PLAN_SHEET_ID}/gviz/tq`;

/**
 * ดึง CSV ของทุกชีตแผนปฏิบัติ คืนเป็น { [ชื่อชีต]: csvText }
 */
export async function fetchPlanData() {
  const texts = await Promise.all(
    PLAN_SHEETS.map(async (name) => {
      try {
        const url = `${BASE_URL}?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
        const res = await fetch(url);
        return res.ok ? await res.text() : '';
      } catch {
        return '';
      }
    }),
  );
  // คงลำดับตาม PLAN_SHEETS (บริการ ก่อน ธุรกิจ)
  const out = {};
  PLAN_SHEETS.forEach((name, i) => { out[name] = texts[i]; });
  return out;
}

export { PLAN_SHEET_ID };
