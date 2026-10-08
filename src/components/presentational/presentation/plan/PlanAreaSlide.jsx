import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, ReferenceLine, Tooltip } from 'recharts';
import SlideShell from '../SlideShell';
import { GRADE_ORDER, gradeStyle } from '../../../../utils/parsePlan';

const BRAND = 'PEA Dashboard · ความก้าวหน้าแผนปฏิบัติการ';
const CHART_W = 1500;
const CHART_H = 168;

const num = (n, d = 0) => (n == null ? '–' : Number(n).toLocaleString('th-TH', { maximumFractionDigits: d }));
const pct = (n) => (n == null ? '–' : `${Number(n).toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`);

function PlanTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const a = payload[0].payload.a;
  const st = gradeStyle(a.grade);
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 16, maxWidth: 560, boxShadow: '0 6px 18px rgba(0,0,0,.12)' }}>
      <div style={{ fontWeight: 700, color: '#1e293b' }}>ข้อ {a.item} · เกรด {a.grade} ({st.label})</div>
      <div style={{ color: '#475569', marginTop: 4, lineHeight: 1.4 }}>{a.activity.slice(0, 180)}{a.activity.length > 180 ? '…' : ''}</div>
      <div style={{ color: '#334155', marginTop: 6 }}>เป้าหมาย {num(a.targetSum ?? a.yearlyTarget, 2)} · ผลงาน {num(a.resultSum, 2)} {a.unit} · <b>{pct(a.resultPct)}</b></div>
    </div>
  );
}

function AreaChart({ activities }) {
  const data = activities.map((a) => ({ item: a.item, value: a.resultPct ?? 0, a }));
  const maxPct = Math.max(100, ...data.map((d) => d.value));
  return (
    <BarChart width={CHART_W} height={CHART_H} data={data} margin={{ top: 28, right: 20, left: 0, bottom: 4 }}>
      <CartesianGrid vertical={false} stroke="#e2e8f0" />
      <XAxis dataKey="item" tick={{ fontSize: 17, fill: '#334155', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} interval={0} />
      <YAxis tick={{ fontSize: 15, fill: '#64748b' }} tickFormatter={(v) => `${v}`} domain={[0, Math.ceil((maxPct * 1.1) / 20) * 20]} axisLine={false} tickLine={false} width={56} />
      <Tooltip content={<PlanTooltip />} cursor={{ fill: 'rgba(148,163,184,0.12)' }} />
      <ReferenceLine y={100} stroke="#1e40af" strokeDasharray="7 5" strokeWidth={2} label={{ value: 'เป้า 100%', position: 'right', fill: '#1e40af', fontSize: 16, fontWeight: 700 }} />
      <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={90} isAnimationActive={false}>
        {data.map((d) => <Cell key={d.item} fill={gradeStyle(d.a.grade).color} />)}
        <LabelList dataKey="value" position="top" formatter={(v) => (v ? pct(v) : '')} style={{ fontSize: 16, fontWeight: 700, fill: '#1e293b' }} />
      </Bar>
    </BarChart>
  );
}

export default function PlanAreaSlide({ area, footer }) {
  const { label, activities, summary } = area;
  return (
    <SlideShell
      kicker={`แผนปฏิบัติ · ${label}`}
      title={`งานด้าน${label} (${summary.total} กิจกรรม)`}
      brand={BRAND}
      aside={
        <div className="flex gap-2">
          {GRADE_ORDER.filter((g) => summary.byGrade[g] > 0).map((g) => {
            const st = gradeStyle(g);
            return (
              <span key={g} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full pl-1.5 pr-3 py-1">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: st.color }}>{g}</span>
                <b className="text-xl text-slate-800">{summary.byGrade[g]}</b>
              </span>
            );
          })}
        </div>
      }
      footer={footer}
    >
      <div className="flex flex-col h-full gap-3">
        <div className="shrink-0"><AreaChart activities={activities} /></div>

        <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-slate-100 text-slate-600" style={{ fontSize: 15 }}>
                <th className="px-3 py-1.5 w-16">ข้อ</th>
                <th className="px-3 py-1.5">กิจกรรม</th>
                <th className="px-3 py-1.5 w-36 text-right">เป้าหมาย</th>
                <th className="px-3 py-1.5 w-28 text-right">ผลงาน</th>
                <th className="px-3 py-1.5 w-24 text-right">ผลงาน%</th>
                <th className="px-3 py-1.5 w-20 text-center">เกรด</th>
                <th className="px-3 py-1.5 w-48">ผู้รับผิดชอบ</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => {
                const st = gradeStyle(a.grade);
                return (
                  <tr key={a.item} className="border-t border-slate-100 text-slate-700" style={{ fontSize: 15 }}>
                    <td className="px-3 py-0.5 font-semibold">{a.item}</td>
                    <td className="px-3 py-0.5 truncate" title={a.activity}>{a.activity}</td>
                    <td className="px-3 py-0.5 text-right tabular-nums">{num(a.targetSum ?? a.yearlyTarget, 2)} <span className="text-slate-400 text-xs">{a.unit}</span></td>
                    <td className="px-3 py-0.5 text-right tabular-nums">{num(a.resultSum, 2)}</td>
                    <td className="px-3 py-0.5 text-right tabular-nums font-semibold" style={{ color: st.color }}>{pct(a.resultPct)}</td>
                    <td className="px-3 py-0.5 text-center">
                      <span className="inline-flex w-8 h-8 rounded-lg items-center justify-center text-sm font-bold text-white" style={{ background: st.color }} title={st.desc}>{a.grade}</span>
                    </td>
                    <td className="px-3 py-0.5 truncate text-slate-500" title={a.owner}>{a.owner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SlideShell>
  );
}
