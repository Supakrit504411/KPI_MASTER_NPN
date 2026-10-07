import SlideShell from './SlideShell';
import { fmt, levelOf, LEVEL_STYLE } from '../../../utils/presentation';

const MAX_ROWS = 10;

export default function SummarySlide({ index, focusPeas, onJump, footer }) {
  const entries = [...index.values()];
  return (
    <SlideShell kicker="สรุป" title="ตัวชี้วัดที่ต้องเร่งดำเนินการ (คะแนน < 5)" footer={footer}>
      <div className="grid gap-6 h-full" style={{ gridTemplateColumns: `repeat(${Math.max(focusPeas.length, 1)}, minmax(0, 1fr))` }}>
        {focusPeas.map((pea) => {
          const failed = entries
            .filter((e) => e.rows[pea] && e.rows[pea].status === 'failed')
            .toSorted((a, b) => a.rows[pea].score - b.rows[pea].score);
          return (
            <div key={pea} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col min-h-0">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-2xl font-bold text-slate-800">{pea}</span>
                <span className="text-lg text-slate-500">{failed.length} ข้อ</span>
              </div>
              {failed.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-2xl text-emerald-600 font-semibold">
                  ผ่านเกณฑ์ทุกข้อ
                </div>
              ) : (
                <ul className="space-y-2">
                  {failed.slice(0, MAX_ROWS).map((e) => {
                    const row = e.rows[pea];
                    const lvl = levelOf(row);
                    return (
                      <li key={e.item}>
                        <button
                          type="button"
                          onClick={() => onJump(e.item)}
                          className="w-full flex items-center gap-3 bg-white rounded-xl px-3 py-2 hover:ring-2 hover:ring-blue-300 text-left"
                        >
                          <span className="text-lg font-bold text-slate-700 w-14 shrink-0">{e.item}</span>
                          <span className="text-base text-slate-500 truncate flex-1">{e.description}</span>
                          <span className="text-lg font-bold shrink-0" style={{ color: LEVEL_STYLE[lvl].color }}>
                            {fmt(row.score)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {failed.length > MAX_ROWS && (
                    <li className="text-base text-slate-400 px-3">และอีก {failed.length - MAX_ROWS} ข้อ</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </SlideShell>
  );
}
