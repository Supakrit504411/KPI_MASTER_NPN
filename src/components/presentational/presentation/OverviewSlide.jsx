import SlideShell from './SlideShell';
import { fmt, LEVEL_STYLE } from '../../../utils/presentation';

export default function OverviewSlide({ overview, footer }) {
  const { focus, groups } = overview;
  return (
    <SlideShell
      kicker="ภาพรวม"
      title="คะแนนสุทธิรวมทุกตัวชี้วัด"
      aside={
        <div className="text-right space-y-1">
          <div className="text-base text-slate-500">ค่าเฉลี่ยในกลุ่ม</div>
          {groups.map((g) => (
            <div key={g.group} className="flex items-baseline justify-end gap-2">
              <span className="text-base text-slate-500">{g.group} ({g.total})</span>
              <span className="text-2xl font-bold text-slate-700">{fmt(g.avg)}%</span>
            </div>
          ))}
        </div>
      }
      footer={footer}
    >
      <div className="grid gap-6 h-full" style={{ gridTemplateColumns: `repeat(${Math.max(focus.length, 1)}, minmax(0, 1fr))` }}>
        {focus.map((s) => {
          const above = s.percentage >= s.groupAvg;
          const segs = [
            ['passed', s.passed],
            ['failed', s.failed],
            ['pending', s.pending],
          ];
          return (
            <div key={s.pea} className="rounded-3xl border border-slate-200 bg-slate-50 p-8 flex flex-col">
              <div className="text-3xl font-bold text-slate-800">{s.pea}</div>
              <div className="text-lg text-slate-500 mt-1">อันดับ {s.rank} จาก {s.groupTotal} · กลุ่ม {s.group}</div>

              <div className="mt-8 flex items-baseline gap-2">
                <span className={`text-[96px] leading-none font-bold ${above ? 'text-blue-700' : 'text-red-600'}`}>
                  {fmt(s.percentage, 1)}
                </span>
                <span className="text-4xl text-slate-400">%</span>
              </div>
              <div className="text-xl text-slate-500 mt-2">
                {fmt(s.totalScoreNet)} / {fmt(s.totalScoreFull)} คะแนน
              </div>

              <div className="mt-auto">
                <div className="flex h-5 rounded-full overflow-hidden bg-slate-200 gap-0.5">
                  {segs.map(([lvl, n]) => n > 0 && (
                    <div key={lvl} style={{ flex: n, background: LEVEL_STYLE[lvl].color }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 mt-5 text-center">
                  {segs.map(([lvl, n]) => (
                    <div key={lvl}>
                      <div className="text-4xl font-bold" style={{ color: lvl === 'pending' ? '#64748b' : LEVEL_STYLE[lvl].color }}>{n}</div>
                      <div className="text-lg text-slate-500">{LEVEL_STYLE[lvl].label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-center text-base text-slate-400 mt-3">จาก {s.total} ข้อ</div>
              </div>
            </div>
          );
        })}
      </div>
    </SlideShell>
  );
}
