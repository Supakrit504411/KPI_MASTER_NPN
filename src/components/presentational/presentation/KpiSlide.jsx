import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, ReferenceLine, Tooltip, useYAxisScale, usePlotArea, ZIndexLayer } from 'recharts';
import SlideShell from './SlideShell';
import { fmt, levelOf, rankItemRows, rankItemRowsByGroup, LEVEL_STYLE } from '../../../utils/presentation';

const CHART_W = 960;
const CHART_H = 600;

const TARGET_YEARLY_COLOR = '#d97706';
const TARGET_LEVEL5_COLOR = '#1e40af';

// tooltip ตอน hover: แสดงผลดำเนินงาน + ค่าเป้าของหน่วยงานนั้น (ระดับ 5 และทั้งปี)
function FocusTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 18, boxShadow: '0 6px 18px rgba(0,0,0,.12)', lineHeight: 1.5 }}>
      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{d.pea}</div>
      <div style={{ color: '#334155' }}>ผลดำเนินงาน: <b>{fmt(d.value)}</b> {unit}</div>
      {d.target > 0 && <div style={{ color: TARGET_LEVEL5_COLOR }}>เป้าระดับ 5: <b>{fmt(d.target)}</b> {unit}</div>}
      {d.targetYearly > 0 && <div style={{ color: TARGET_YEARLY_COLOR }}>เป้าทั้งปี: <b>{fmt(d.targetYearly)}</b> {unit}</div>}
    </div>
  );
}

// เส้นเป้าหมายแยกรายหน่วยงาน วางทับแต่ละแท่งตามค่าเป้าของหน่วยนั้นเอง (ไม่ใช่ค่าเดียวทั้งกราฟ)
// recharts 3: yScale จาก hook เป็นพิกัดเต็มอยู่แล้ว ส่วนตำแหน่งแนวนอนคำนวณจากพื้นที่กราฟ (plotArea)
// โดยกระจายให้ตรงกลางแต่ละแท่งแบบสม่ำเสมอ: cx = plot.x + band*(i+0.5) — ตรงกับที่ recharts วางแท่งทุกจำนวน
// (ไม่ใช้ xScale เพราะ scaleBand คำนวณตำแหน่งเพี้ยนเมื่อมีหน่วยงานเดียว)
function PerPeaTargets({ data }) {
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!yScale || !plot || !data.length) return null;
  const band = plot.width / data.length;
  const half = Math.min(band * 0.4, 80);
  const mark = (cx, v, color, key) => {
    const y = yScale(v);
    return (
      <g key={key}>
        <line x1={cx - half} x2={cx + half} y1={y} y2={y} stroke={color} strokeWidth={4} strokeDasharray="8 5" />
        <text x={cx} y={y - 6} textAnchor="middle" fontSize={16} fontWeight={700} fill={color} stroke="#ffffff" strokeWidth={3.5} paintOrder="stroke" strokeLinejoin="round">{fmt(v)}</text>
      </g>
    );
  };
  return (
    <g>
      {data.map((d, i) => {
        const cx = plot.x + band * (i + 0.5);
        return (
          <g key={d.pea}>
            {d.targetYearly > 0 && mark(cx, d.targetYearly, TARGET_YEARLY_COLOR, 'ty')}
            {d.target > 0 && mark(cx, d.target, TARGET_LEVEL5_COLOR, 't5')}
          </g>
        );
      })}
    </g>
  );
}

function TargetLegend() {
  const item = (color, label) => (
    <span className="flex items-center gap-2 text-slate-600">
      <svg width="34" height="10"><line x1="1" y1="5" x2="33" y2="5" stroke={color} strokeWidth="4" strokeDasharray="8 5" /></svg>
      {label}
    </span>
  );
  return (
    <div className="flex items-center gap-6 mb-1 text-lg font-medium">
      {item(TARGET_LEVEL5_COLOR, 'เป้าระดับ 5')}
      {item(TARGET_YEARLY_COLOR, 'เป้าทั้งปี')}
      <span className="text-slate-400 text-base">(เป้าของแต่ละหน่วยงาน)</span>
    </div>
  );
}

function FocusChart({ entry, focusPeas }) {
  const data = focusPeas.map((pea) => {
    const row = entry.rows[pea];
    return {
      pea,
      value: row ? row.result : 0,
      level: levelOf(row),
      target: row?.targetLevel5 || 0,
      targetYearly: row?.targetYearly || 0,
    };
  });
  const hasResult = data.some((d) => d.value);
  if (!hasResult) {
    return (
      <div style={{ width: CHART_W, height: CHART_H }} className="flex items-center justify-center rounded-3xl bg-slate-50 text-3xl text-slate-400">
        ยังไม่มีผลดำเนินงาน
      </div>
    );
  }
  const max = Math.max(...data.flatMap((d) => [d.value, d.target, d.targetYearly]), 0);
  return (
    <div style={{ width: CHART_W }}>
      <TargetLegend />
      <BarChart width={CHART_W} height={CHART_H - 36} data={data} margin={{ top: 50, right: 70, left: 10, bottom: 10 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="pea" tick={{ fontSize: 24, fill: '#334155', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis tick={{ fontSize: 18, fill: '#64748b' }} tickFormatter={(v) => fmt(v, 0)} domain={[0, Math.ceil(max * 1.15) || 1]} axisLine={false} tickLine={false} width={90} />
        <Tooltip content={(props) => <FocusTooltip {...props} unit={entry.unit} />} cursor={{ fill: 'rgba(148,163,184,0.12)' }} />
        <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={150} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.pea} fill={LEVEL_STYLE[d.level].color} />)}
          <LabelList dataKey="value" position="top" formatter={(v) => fmt(v)} style={{ fontSize: 26, fontWeight: 700, fill: '#1e293b' }} />
        </Bar>
        {/* zIndex 450 = เหนือแท่ง (300) และเหนือ cursor สีเทาตอน hover (200) เพื่อไม่ให้เส้น/เลขเป้าถูกบัง */}
        <ZIndexLayer zIndex={450}>
          <PerPeaTargets data={data} />
        </ZIndexLayer>
      </BarChart>
    </div>
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

export default function KpiSlide({ entry, focusPeas, peaGroup, drill, onToggleDrill, footer }) {
  const [hovered, setHovered] = useState(null); // หน่วยงานที่เมาส์ชี้อยู่ (ทำลูกเล่นการ์ด)
  const { count } = rankItemRows(entry); // จำนวนทุกหน่วยงานที่มีผล (ใช้กับป้ายปุ่ม "ทุกหน่วยงาน")
  // อันดับในการ์ด = เทียบเฉพาะหน่วยงานในกลุ่ม (Group) เดียวกัน (ใช้กลุ่มหลัก กันข้อมูลแถวหลงกลุ่ม)
  const { ranks, counts } = rankItemRowsByGroup(entry, peaGroup);
  // ข้อนี้มีคอลัมน์ "คิดเป็น" (% เทียบเป้าทั้งปี) หรือไม่ — ถ้ามีจึงแสดง % ทุกหน่วย (รวมที่เป็น 0)
  const itemHasPct = focusPeas.some((p) => entry.rows[p]?.percentage > 0);
  return (
    <SlideShell
      kicker={`ตัวชี้วัดข้อ ${entry.item}`}
      title={<span className="line-clamp-2 text-[34px] block">{entry.description}</span>}
      aside={
        entry.unit && (
          <div className="text-right bg-blue-50 rounded-2xl px-6 py-3">
            <div className="text-lg text-blue-700">หน่วยวัด</div>
            <div className="text-4xl font-bold text-blue-800">{entry.unit}</div>
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
            const yearly = row && row.targetYearly > 0 ? row.targetYearly : 0;
            // ใช้ % "คิดเป็น" จากชีต (คอลัมน์ L) เป็นค่าเดียว ไม่คำนวณซ้ำเพราะผลงานในชีตถูกปัดเศษแล้ว
            const yearlyPct = itemHasPct && row ? row.percentage : null;
            const color = LEVEL_STYLE[lvl].color;
            const isHover = hovered === pea;
            return (
              <div
                key={pea}
                onMouseEnter={() => setHovered(pea)}
                onMouseLeave={() => setHovered(null)}
                className="flex-1 min-h-0 rounded-2xl border bg-white px-5 py-3 flex flex-col justify-center transition-all duration-200 ease-out will-change-transform cursor-default"
                style={{
                  borderColor: isHover ? color : '#e2e8f0',
                  borderLeft: `8px solid ${color}`,
                  transform: isHover ? 'translateY(-4px) scale(1.025)' : 'none',
                  boxShadow: isHover ? `0 16px 34px -8px ${color}66` : '0 1px 2px rgba(15,23,42,0.05)',
                  zIndex: isHover ? 5 : 1,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-bold transition-colors duration-200" style={{ color: isHover ? color : '#1e293b' }}>{pea}</span>
                  <span className={`text-base font-semibold px-3 py-0.5 rounded-full ${LEVEL_STYLE[lvl].chip}`}>{LEVEL_STYLE[lvl].label}</span>
                </div>
                {row && lvl !== 'pending' ? (
                  <div className="flex items-end justify-between gap-3 mt-1">
                    <div className="text-lg text-slate-500 leading-snug">
                      ผลงาน <b className="text-slate-700">{fmt(row.result)}</b> {entry.unit}
                      {yearly > 0 && <> · เป้าทั้งปี <b className="text-slate-700">{fmt(yearly)}</b> {entry.unit}</>}
                      {yearlyPct != null && (
                        <div>
                          ทำได้ <b style={{ color: yearlyPct >= 100 ? '#059669' : '#d97706' }}>{fmt(yearlyPct)}%</b> ของเป้าทั้งปี
                          {ranks[pea] && <> · อันดับ {ranks[pea]} / {counts[pea]} ในกลุ่ม</>}
                        </div>
                      )}
                      {yearlyPct == null && ranks[pea] && <div>อันดับ {ranks[pea]} / {counts[pea]} ในกลุ่ม</div>}
                    </div>
                    <div className="text-5xl font-bold leading-none transition-transform duration-200 origin-right" style={{ color, transform: isHover ? 'scale(1.12)' : 'none' }}>{fmt(row.score)}</div>
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
