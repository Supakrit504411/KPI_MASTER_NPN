import SlideShell from './SlideShell';
import { fmt, levelOf, LEVEL_STYLE } from '../../../utils/presentation';

// ปรับความหนาแน่นของรายการตามจำนวนข้อที่มากที่สุดในสไลด์
// เพื่อให้แสดงครบทุกข้อโดยไม่ล้นกรอบสไลด์ (1600x900)
function densityOf(maxRows) {
  if (maxRows <= 10) return { gap: 'space-y-2', pad: 'px-3 py-2', item: 'text-lg', desc: 'text-base', score: 'text-lg' };
  if (maxRows <= 14) return { gap: 'space-y-1.5', pad: 'px-3 py-1.5', item: 'text-base', desc: 'text-sm', score: 'text-base' };
  if (maxRows <= 18) return { gap: 'space-y-1', pad: 'px-2.5 py-1', item: 'text-sm', desc: 'text-sm', score: 'text-sm' };
  return { gap: 'space-y-0.5', pad: 'px-2 py-0.5', item: 'text-xs', desc: 'text-xs', score: 'text-xs' };
}

export default function SummarySlide({ index, focusPeas, onJump, footer }) {
  const entries = [...index.values()];
  const failedBy = new Map(
    focusPeas.map((pea) => [
      pea,
      entries
        .filter((e) => e.rows[pea] && e.rows[pea].status === 'failed')
        .toSorted((a, b) => a.rows[pea].score - b.rows[pea].score),
    ]),
  );
  const d = densityOf(Math.max(0, ...[...failedBy.values()].map((l) => l.length)));

  return (
    <SlideShell kicker="สรุป" title="ตัวชี้วัดที่ต้องเร่งดำเนินการ (คะแนน < 5)" footer={footer}>
      <div className="grid gap-6 h-full" style={{ gridTemplateColumns: `repeat(${Math.max(focusPeas.length, 1)}, minmax(0, 1fr))` }}>
        {focusPeas.map((pea) => {
          const failed = failedBy.get(pea) || [];
          return (
            <div key={pea} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 flex flex-col min-h-0">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-2xl font-bold text-slate-800">{pea}</span>
                <span className="text-lg text-slate-500">{failed.length} ข้อ</span>
              </div>
              {failed.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-2xl text-emerald-600 font-semibold">
                  ผ่านเกณฑ์ทุกข้อ
                </div>
              ) : (
                <ul className={`${d.gap} flex-1 min-h-0 overflow-hidden`}>
                  {failed.map((e) => {
                    const row = e.rows[pea];
                    const lvl = levelOf(row);
                    return (
                      <li key={e.item}>
                        <button
                          type="button"
                          onClick={() => onJump(e.item)}
                          className={`w-full flex items-center gap-2 bg-white rounded-lg ${d.pad} hover:ring-2 hover:ring-blue-300 text-left`}
                        >
                          <span className={`${d.item} font-bold text-slate-700 w-12 shrink-0`}>{e.item}</span>
                          <span className={`${d.desc} text-slate-500 truncate flex-1`}>{e.description}</span>
                          <span className={`${d.score} font-bold shrink-0`} style={{ color: LEVEL_STYLE[lvl].color }}>
                            {fmt(row.score)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </SlideShell>
  );
}
