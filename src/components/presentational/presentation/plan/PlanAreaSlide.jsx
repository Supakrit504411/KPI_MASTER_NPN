import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, ReferenceLine, Tooltip } from 'recharts';
import { X, Target, TrendingUp, AlertTriangle, User } from 'lucide-react';
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
      <div style={{ color: '#334155', marginTop: 6 }}>เป้าทั้งปี {num(a.yearlyTarget, 2)} {a.unit} · เป้า {num(a.targetSum, 2)} · ผลงาน {num(a.resultSum, 2)} · <b>{pct(a.quarterPct)}</b></div>
    </div>
  );
}

function AreaChart({ activities }) {
  const data = activities.map((a) => ({ item: a.item, value: a.quarterPct ?? 0, a }));
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

function ActivityModal({ activity: a, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!a) return null;
  const st = gradeStyle(a.grade);
  const pctVal = a.quarterPct ?? 0;
  const barW = Math.min(pctVal, 100);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* header */}
        <div className="px-6 py-5 relative" style={{ background: `linear-gradient(135deg, ${st.color}22, ${st.color}08)` }}>
          <button type="button" onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5"><X className="w-5 h-5 text-slate-500" /></button>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow" style={{ background: st.color }}>{a.grade}</span>
            <div>
              <div className="text-sm font-medium" style={{ color: st.color }}>{st.label}</div>
              <div className="text-slate-800 text-xl font-bold">ข้อ {a.item}</div>
            </div>
          </div>
          <p className="text-slate-700 text-base leading-relaxed">{a.activity}</p>
        </div>

        {/* body */}
        <div className="px-6 py-5 space-y-4">
          {/* progress bar */}
          <div>
            <div className="flex items-center justify-between text-sm text-slate-600 mb-1.5">
              <span>ผลงาน</span>
              <span className="font-bold text-lg" style={{ color: st.color }}>{pct(a.quarterPct)}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, background: st.color }} />
            </div>
          </div>

          {/* stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={<Target className="w-5 h-5" />} label="เป้าหมายรายปี" value={a.yearlyTarget != null ? `${num(a.yearlyTarget, 2)} ${a.unit}` : '–'} color="#2563eb" />
            <StatCard icon={<Target className="w-5 h-5" />} label="เป้า(จำนวน)" value={num(a.targetSum, 2)} color="#7c3aed" />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="ผลงาน(จำนวน)" value={num(a.resultSum, 2)} color="#059669" />
          </div>

          {/* extra info */}
          <div className="grid grid-cols-2 gap-3">
            {a.source && <InfoRow label="ที่มา" value={a.source} />}
            {a.period && <InfoRow label="ช่วงเวลา" value={a.period} />}
            {a.dataPeriod && <InfoRow label="ข้อมูลสะสม" value={a.dataPeriod} />}
            {a.q3Target != null && <InfoRow label="เป้าหมาย Q3" value={num(a.q3Target, 2)} />}
          </div>

          {a.issue && (
            <div className="flex gap-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-700">ปัญหาอุปสรรค</div>
                <div className="text-sm text-amber-800 mt-0.5">{a.issue}</div>
              </div>
            </div>
          )}

          {a.owner && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span className="font-medium">ผู้รับผิดชอบ:</span>
              <span className="text-slate-800">{a.owner}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700">ปิด</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="rounded-xl p-3 border border-black/5" style={{ background: `${color}0a` }}>
      <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color }}>{icon}{label}</div>
      <div className="mt-1 text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm text-slate-700 font-medium">{value}</div>
    </div>
  );
}

export default function PlanAreaSlide({ area, footer }) {
  const { label, activities, summary } = area;
  const [detail, setDetail] = useState(null);

  return (
    <>
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
                  <th className="px-3 py-1.5 w-14">ข้อ</th>
                  <th className="px-3 py-1.5">กิจกรรม</th>
                  <th className="px-3 py-1.5 w-32 text-right">เป้าหมาย</th>
                  <th className="px-3 py-1.5 w-24 text-right">เป้า(จน.)</th>
                  <th className="px-3 py-1.5 w-24 text-right">ผลงาน</th>
                  <th className="px-3 py-1.5 w-22 text-right">ผลงาน%</th>
                  <th className="px-3 py-1.5 w-18 text-center">เกรด</th>
                  <th className="px-3 py-1.5 w-40">ผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => {
                  const st = gradeStyle(a.grade);
                  return (
                    <tr
                      key={a.item}
                      onClick={() => setDetail(a)}
                      className="border-t border-slate-100 text-slate-700 cursor-pointer transition-all hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-transparent hover:shadow-sm group"
                      style={{ fontSize: 15 }}
                    >
                      <td className="px-3 py-0.5 font-semibold group-hover:text-blue-700">{a.item}</td>
                      <td className="px-3 py-0.5 truncate group-hover:text-blue-700 group-hover:underline" title={a.activity}>{a.activity}</td>
                      <td className="px-3 py-0.5 text-right tabular-nums">{num(a.yearlyTarget, 2)} <span className="text-slate-400 text-xs">{a.unit}</span></td>
                      <td className="px-3 py-0.5 text-right tabular-nums">{num(a.targetSum, 2)}</td>
                      <td className="px-3 py-0.5 text-right tabular-nums">{num(a.resultSum, 2)}</td>
                      <td className="px-3 py-0.5 text-right tabular-nums font-semibold" style={{ color: st.color }}>{pct(a.quarterPct)}</td>
                      <td className="px-3 py-0.5 text-center">
                        <span className="inline-flex w-8 h-8 rounded-lg items-center justify-center text-sm font-bold text-white group-hover:scale-110 transition-transform" style={{ background: st.color }} title={st.desc}>{a.grade}</span>
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

      {detail && <ActivityModal activity={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
