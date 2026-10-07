import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, ReferenceLine, Tooltip } from 'recharts';
import SlideShell from './SlideShell';
import { fmt, levelOf, rankItemRows, LEVEL_STYLE } from '../../../utils/presentation';

const CHART_W = 960;
const CHART_H = 600;

function FocusChart({ entry, focusPeas }) {
  const data = focusPeas.map((pea) => {
    const row = entry.rows[pea];
    return { pea, value: row ? row.result : 0, level: levelOf(row) };
  });
  const hasResult = data.some((d) => d.value);
  if (!hasResult) {
    return (
      <div style={{ width: CHART_W, height: CHART_H }} className="flex items-center justify-center rounded-3xl bg-slate-50 text-3xl text-slate-400">
        ยังไม่มีผลดำเนินงาน
      </div>
    );
  }
  const max = Math.max(entry.target || 0, ...data.map((d) => d.value));
  return (
    <BarChart width={CHART_W} height={CHART_H} data={data} margin={{ top: 50, right: 120, left: 10, bottom: 10 }}>
      <CartesianGrid vertical={false} stroke="#e2e8f0" />
      <XAxis dataKey="pea" tick={{ fontSize: 24, fill: '#334155', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
      <YAxis tick={{ fontSize: 18, fill: '#64748b' }} tickFormatter={(v) => fmt(v, 0)} domain={[0, Math.ceil(max * 1.15) || 1]} axisLine={false} tickLine={false} width={90} />
      <Tooltip formatter={(v) => [fmt(v), 'ผลดำเนินงาน']} contentStyle={{ fontSize: 18 }} />
      {entry.target > 0 && (
        <ReferenceLine
          y={entry.target}
          stroke="#1e40af"
          strokeDasharray="8 6"
          strokeWidth={2}
          label={{ value: `เป้า ${fmt(entry.target)}`, position: 'right', fill: '#1e40af', fontSize: 20, fontWeight: 700 }}
        />
      )}
      <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={150} isAnimationActive={false}>
        {data.map((d) => <Cell key={d.pea} fill={LEVEL_STYLE[d.level].color} />)}
        <LabelList dataKey="value" position="top" formatter={(v) => fmt(v)} style={{ fontSize: 26, fontWeight: 700, fill: '#1e293b' }} />
      </Bar>
    </BarChart>
  );
}

function AllPeaChart({ entry, focusPeas }) {
  const { rows } = rankItemRows(entry);
  if (rows.length === 0) {
    return (
      <div style={{ width: CHART_W, height: CHART_H }} className="flex items-center justify-center rounded-3xl bg-slate-50 text-3xl text-slate-400">
        ยังไม่มีผลดำเนินงาน
      </div>
    );
  }
  const data = rows.map((r) => ({ pea: r.pea, score: r.score, focus: focusPeas.includes(r.pea), level: levelOf(r) }));
  return (
    <BarChart width={CHART_W} height={CHART_H} data={data} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
      <CartesianGrid vertical={false} stroke="#e2e8f0" />
      <XAxis
        dataKey="pea"
        interval={0}
        angle={-70}
        textAnchor="end"
        height={110}
        tick={({ x, y, payload }) => {
          const focus = focusPeas.includes(payload.value);
          return (
            <text x={x} y={y + 6} transform={`rotate(-70 ${x} ${y + 6})`} textAnchor="end" fontSize={focus ? 15 : 12} fontWeight={focus ? 700 : 400} fill={focus ? '#1e40af' : '#94a3b8'}>
              {payload.value}
            </text>
          );
        }}
      />
      <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 18, fill: '#64748b' }} axisLine={false} tickLine={false} width={50} />
      <Tooltip formatter={(v) => [fmt(v), 'คะแนน']} contentStyle={{ fontSize: 18 }} />
      <ReferenceLine y={5} stroke="#059669" strokeDasharray="6 6" />
      <Bar dataKey="score" isAnimationActive={false} radius={[4, 4, 0, 0]}>
        {data.map((d) => <Cell key={d.pea} fill={d.focus ? LEVEL_STYLE[d.level].color : '#cbd5e1'} />)}
      </Bar>
    </BarChart>
  );
}

export default function KpiSlide({ entry, focusPeas, drill, onToggleDrill, footer }) {
  const { ranks, count } = rankItemRows(entry);
  return (
    <SlideShell
      kicker={`ตัวชี้วัดข้อ ${entry.item}`}
      title={<span className="line-clamp-2 text-[34px] block">{entry.description}</span>}
      aside={
        entry.target > 0 && (
          <div className="text-right bg-blue-50 rounded-2xl px-6 py-3">
            <div className="text-lg text-blue-700">เป้าหมายระดับ 5</div>
            <div className="text-4xl font-bold text-blue-800">
              {fmt(entry.target)} <span className="text-xl font-medium">{entry.unit}</span>
            </div>
          </div>
        )
      }
      footer={footer}
    >
      <div className="flex gap-8 h-full">
        <div className="shrink-0 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            {[[false, `ผลดำเนินงาน ${focusPeas.length} หน่วยงาน`], [true, `คะแนน KPI ทุกหน่วยงาน (${count})`]].map(([v, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => drill !== v && onToggleDrill()}
                className={`px-4 py-1.5 rounded-full text-lg font-medium border transition-colors
                  ${drill === v ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
            <span className="text-base text-slate-400 ml-2">กด D เพื่อสลับ</span>
          </div>
          {drill ? <AllPeaChart entry={entry} focusPeas={focusPeas} /> : <FocusChart entry={entry} focusPeas={focusPeas} />}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {focusPeas.map((pea) => {
            const row = entry.rows[pea];
            const lvl = levelOf(row);
            return (
              <div key={pea} className="flex-1 min-h-0 rounded-2xl border border-slate-200 px-5 py-3 flex flex-col justify-center" style={{ borderLeft: `8px solid ${LEVEL_STYLE[lvl].color}` }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-bold text-slate-800">{pea}</span>
                  <span className={`text-base font-semibold px-3 py-0.5 rounded-full ${LEVEL_STYLE[lvl].chip}`}>{LEVEL_STYLE[lvl].label}</span>
                </div>
                {row && lvl !== 'pending' ? (
                  <div className="flex items-end justify-between gap-3 mt-1">
                    <div className="text-lg text-slate-500 leading-snug">
                      ผลงาน <b className="text-slate-700">{fmt(row.result)}</b> {entry.unit}
                      {row.percentage ? <> · คิดเป็น <b className="text-slate-700">{fmt(row.percentage)}</b></> : null}
                      {ranks[pea] && <div>อันดับ {ranks[pea]} / {count}</div>}
                    </div>
                    <div className="text-5xl font-bold leading-none" style={{ color: LEVEL_STYLE[lvl].color }}>{fmt(row.score)}</div>
                  </div>
                ) : (
                  <div className="text-lg text-slate-400 mt-1">ยังไม่มีผลดำเนินงาน</div>
                )}
                {row?.note && <div className="text-base text-amber-700 mt-1 truncate" title={row.note}>หมายเหตุ: {row.note}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </SlideShell>
  );
}
