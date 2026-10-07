import SlideShell from './SlideShell';
import { fmt, levelOf, LEVEL_STYLE } from '../../../utils/presentation';

// ภาพรวมทุกข้อในหน้าเดียว: 1 ช่อง = 1 ข้อ, แถบสี = สถานะของแต่ละ PEA (คลิกเพื่อไปที่สไลด์ข้อนั้น)
export default function MatrixSlide({ index, focusPeas, deckItems, onJump, footer }) {
  const entries = [...index.values()];
  const cols = entries.length > 60 ? 12 : 10;
  const rows = Math.max(1, Math.ceil(entries.length / cols));
  const tileH = Math.min(150, Math.floor((640 - (rows - 1) * 10) / rows));
  const compact = tileH < 100;

  return (
    <SlideShell
      kicker="แผนที่ตัวชี้วัด"
      title="สถานะรายข้อ"
      aside={
        <div className="flex flex-col items-end gap-2 text-base text-slate-600">
          <div className="flex gap-4">
            {['passed', 'warning', 'failed', 'pending'].map((l) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded" style={{ background: LEVEL_STYLE[l].color }} />
                {LEVEL_STYLE[l].label}
              </span>
            ))}
          </div>
          <div className="text-slate-400">แถบเรียงตาม: {focusPeas.join(' · ')}</div>
        </div>
      }
      footer={footer}
    >
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {entries.map((e) => {
          const inDeck = deckItems.includes(e.item);
          return (
            <button
              key={e.item}
              type="button"
              onClick={() => onJump(e.item)}
              title={e.description}
              style={{ height: tileH }}
              className={`rounded-xl border-2 p-2 flex flex-col text-left transition-transform hover:scale-105 hover:shadow-lg
                ${inDeck ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white'}`}
            >
              <span className={`${compact ? 'text-base' : 'text-xl'} font-bold text-slate-700`}>{e.item}</span>
              <div className="mt-auto flex gap-1">
                {focusPeas.map((p) => {
                  const row = e.rows[p];
                  const lvl = levelOf(row);
                  return (
                    <div
                      key={p}
                      className="flex-1 rounded-md flex items-center justify-center text-white font-semibold"
                      style={{ background: LEVEL_STYLE[lvl].color, height: compact ? 18 : 30, fontSize: compact ? 11 : 14 }}
                    >
                      {!compact && row && lvl !== 'pending' ? fmt(row.score, 1) : ''}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </SlideShell>
  );
}
