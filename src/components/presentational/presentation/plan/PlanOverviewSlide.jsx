import SlideShell from '../SlideShell';
import { GRADE_ORDER, gradeStyle } from '../../../../utils/parsePlan';

const BRAND = 'PEA Dashboard · ความก้าวหน้าแผนปฏิบัติการ';
const fmtPct = (n) => (n == null ? '–' : `${n.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`);

function GradeBar({ summary }) {
  const total = summary.total || 1;
  return (
    <div className="flex h-6 rounded-full overflow-hidden bg-slate-200 gap-0.5">
      {GRADE_ORDER.map((g) => summary.byGrade[g] > 0 && (
        <div key={g} title={gradeStyle(g).label} style={{ flex: summary.byGrade[g] / total, background: gradeStyle(g).color }} />
      ))}
    </div>
  );
}

export default function PlanOverviewSlide({ deck, footer }) {
  const { areas, office, dataPeriod } = deck;
  return (
    <SlideShell
      kicker="ภาพรวมแผนปฏิบัติการ"
      title="สรุปความก้าวหน้าตามงานด้าน"
      brand={BRAND}
      aside={
        <div className="text-right">
          {office && <div className="text-3xl font-bold text-slate-700">{office}</div>}
          {dataPeriod && <div className="text-lg text-slate-500 mt-1">ข้อมูล {dataPeriod}</div>}
        </div>
      }
      footer={footer}
    >
      <div className="grid gap-8 h-full" style={{ gridTemplateColumns: `repeat(${Math.max(areas.length, 1)}, minmax(0, 1fr))` }}>
        {areas.map((a) => (
          <div key={a.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-10 flex flex-col">
            <div className="text-4xl font-bold text-slate-800">{a.label}</div>
            <div className="text-xl text-slate-500 mt-2">{a.summary.total} กิจกรรม</div>

            <div className="mt-10 flex items-end gap-3">
              <span className="text-[120px] leading-none font-bold text-blue-700">{fmtPct(a.summary.avgPct)}</span>
            </div>
            <div className="text-xl text-slate-500 mt-1">ผลงานเฉลี่ย ({a.summary.withResult} กิจกรรมที่มีผล)</div>

            <div className="mt-auto">
              <GradeBar summary={a.summary} />
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-6">
                {GRADE_ORDER.filter((g) => a.summary.byGrade[g] > 0).map((g) => {
                  const st = gradeStyle(g);
                  return (
                    <div key={g} className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-white" style={{ background: st.color }}>{g}</span>
                      <div className="leading-tight">
                        <div className="text-2xl font-bold text-slate-800">{a.summary.byGrade[g]}</div>
                        <div className="text-sm text-slate-500">{st.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
