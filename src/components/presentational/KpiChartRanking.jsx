import { Component, useMemo, useRef, useState, useEffect } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { ChevronLeft, ChevronRight, Maximize2, X, Download, Trophy, ArrowUpDown } from 'lucide-react';

const FOCUS_RE = /^กฟ[สจ]\.?\s*นพ\.?$/;
const isFocus = (pea) => FOCUS_RE.test(String(pea).trim());
const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

async function saveNode(node, filename) {
  if (!node) return;
  const { toPng } = await import('html-to-image');
  const url = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' });
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

/**
 * กราฟผลการดำเนินงานรายข้อ KPI + ตารางอันดับ
 * - กดที่ legend เพื่อแสดง/ซ่อนแต่ละเส้น
 * - Previous/Next เลื่อนข้อ KPI, ขยายกราฟ, โหลดภาพกราฟ/ตาราง
 */
function KpiChartRankingInner({ rawData, items, selectedItem, onSelectItem }) {
  const [localItem, setLocalItem] = useState(null);
  const [query, setQuery] = useState('');
  const [hidden, setHidden] = useState({});
  const [scale, setScale] = useState('linear');
  const [expanded, setExpanded] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [sort, setSort] = useState({ key: 'pct', dir: 'desc' });
  const chartRef = useRef(null);
  const tableRef = useRef(null);

  const current = onSelectItem ? selectedItem : localItem;
  const item = items.includes(current) ? current : items[0];
  const safeIdx = Math.max(0, items.indexOf(item));
  const select = (it) => (onSelectItem ? onSelectItem(it) : setLocalItem(it));
  const descOf = (it) => rawData.find((r) => r.item === it)?.description ?? '';

  const rows = useMemo(
    () => rawData.filter((r) => r.item === item).map((r) => ({
      ...r,
      // คิดเป็น % = ผล / เป้าหมายรายปี (ใช้ค่าจาก Sheet ก่อน ถ้าว่างให้คำนวณเอง)
      pct: r.percentage || (r.targetYearly > 0 ? (r.result / r.targetYearly) * 100 : 0),
    })),
    [rawData, item],
  );
  const first = rows[0];

  const ranked = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      return typeof av === 'string' ? av.localeCompare(bv, 'th') * dir : (av - bv) * dir;
    });
  }, [rows, sort]);

  // อันดับคงที่ตามคิดเป็น % (ผลเท่ากันใช้ผลดำเนินงานตัดสิน, ไม่เปลี่ยนตามการเรียงตาราง)
  const rankOf = useMemo(() => {
    const m = new Map();
    const sorted = [...rows].sort((a, b) => b.pct - a.pct || b.result - a.result);
    sorted.forEach((r, i) => {
      const prev = sorted[i - 1];
      const tie = i > 0 && prev.pct === r.pct && prev.result === r.result;
      m.set(r.pea, r.pct === 0 && r.result === 0 ? '-' : tie ? m.get(prev.pea) : i + 1);
    });
    return m;
  }, [rows]);

  const note = rows.map((r) => r.note).find(Boolean);

  useEffect(() => {
    if (!expanded && !tableExpanded) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { setExpanded(false); setTableExpanded(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, tableExpanded]);

  if (!items.length) return null;

  const go = (d) => select(items[(safeIdx + d + items.length) % items.length]);
  const onQuery = (v) => {
    setQuery(v);
    const hit = items.find((it) => it === v.trim());
    if (hit) { select(hit); setQuery(''); }
  };
  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'pea' ? 'asc' : 'desc' }));

  const renderLegend = ({ payload }) => (
    <div className="flex justify-center gap-4 flex-wrap text-sm mb-1">
      {payload.map((p) => {
        const off = hidden[p.dataKey];
        return (
          <button
            key={p.dataKey}
            type="button"
            onClick={() => setHidden((h) => ({ ...h, [p.dataKey]: !h[p.dataKey] }))}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition ${off ? 'opacity-40 line-through bg-gray-50' : 'bg-white shadow-sm'}`}
          >
            <span className="inline-block w-5 h-0 border-t-2" style={{ borderColor: p.color, borderStyle: p.dataKey === 'result' ? 'solid' : 'dashed' }} />
            {p.value}
          </button>
        );
      })}
    </div>
  );

  const chart = (height, big) => {
  const n = rows.length;
  const angle = n > 30 ? -90 : n > 12 ? -60 : -25;
  const tickSize = (n > 30 ? 9 : n > 20 ? 11 : 12) + (big ? 2 : 0);
  const showLabels = n <= 25;
  const xHeight = (n > 30 ? 95 : n > 12 ? 85 : 70) + (big ? 15 : 0);

  const XTick = ({ x, y, payload }) => {
    const f = isFocus(payload.value);
    return (
      <text x={x} y={y + 8} textAnchor="end" transform={`rotate(${angle} ${x} ${y + 8})`}
        fontSize={tickSize} fontWeight={f ? 800 : 400} fill={f ? '#d97706' : '#4b5563'}>
        {payload.value}
      </text>
    );
  };
  const ResultDot = ({ cx, cy, payload }) => {
    if (cx == null || cy == null) return null;
    const f = isFocus(payload.pea);
    return <circle cx={cx} cy={cy} r={f ? 8 : n > 30 ? 3 : 5} fill={f ? '#f59e0b' : '#3b82f6'} stroke="#fff" strokeWidth={2} />;
  };
  const SERIES_KEYS = ['result', 'targetYearly', 'targetLevel5'];
  const LABEL_COLOR = { result: '#1e3a8a', targetYearly: '#047857', targetLevel5: '#b91c1c' };
  const visibleKeys = SERIES_KEYS.filter((k) => !hidden[k]);

  // คำนวณสเกลแกน Y เอง เพื่อรู้ตำแหน่งพิกเซลของแต่ละจุด แล้ววางตัวเลขให้ชิดจุดและไม่ทับกัน
  const MARGIN = { top: 28, right: 24, left: 0, bottom: 10 };
  const plotH = height - MARGIN.top - MARGIN.bottom - xHeight;
  const tv = (v) => (scale === 'symlog' ? Math.log1p(Math.max(0, v)) : v);
  const rawMax = Math.max(1e-9, ...rows.flatMap((r) => visibleKeys.map((k) => r[k])));
  const niceStep = (() => {
    const need = (rawMax * 1.08) / 5;
    const exp = 10 ** Math.floor(Math.log10(need));
    return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * exp).find((st) => st >= need) ?? 10 * exp;
  })();
  const yMax = niceStep * 5;
  const yTicks = scale === 'linear' ? [0, 1, 2, 3, 4, 5].map((i) => +(i * niceStep).toPrecision(12)) : undefined;
  const pyOf = (v) => MARGIN.top + plotH * (1 - tv(v) / tv(yMax));
  const FS = 13 + (big ? 2 : 0);
  const gap = FS + 3;

  // จัดตำแหน่งตัวเลขของจุดหนึ่ง: ชิดจุดก่อน ถ้าชนกันค่อยขยับขึ้น/ลงทีละขั้น
  const layoutAt = (row) => {
    const items = visibleKeys.map((k) => ({ k, py: pyOf(row[k]) })).sort((a, c) => a.py - c.py);
    const placed = [];
    const out = {};
    for (const it of items) {
      const cands = [];
      for (let i = 0; i < 6; i += 1) cands.push(it.py - 9 - i * gap, it.py + FS + 6 + i * gap);
      const ok = cands.find((c) => c > MARGIN.top - 12 && c < MARGIN.top + plotH + 2 && placed.every((q) => Math.abs(q - c) >= gap));
      const y = ok ?? cands[0];
      placed.push(y);
      out[it.k] = y;
    }
    return out;
  };
  const makeLabel = (key) => function SeriesLabel({ x, value, index }) {
    const row = rows[index];
    if (!row || value == null) return null; // index เก่าค้างตอนข้อมูลเปลี่ยน (เช่น เปลี่ยนตัวกรอง)
    const f = isFocus(row.pea);
    if (!showLabels && !f) return null;
    const y = layoutAt(row)[key];
    if (y == null) return null;
    const color = key === 'result' && f ? '#b45309' : LABEL_COLOR[key];
    return (
      <text x={x} y={y} textAnchor="middle" fontSize={f && key === 'result' ? FS + 2 : FS} fontWeight={key === 'result' ? 800 : 700}
        fill={color} stroke="#fff" strokeWidth={3} paintOrder="stroke">
        {fmt(value)}
      </text>
    );
  };

  return (
    <div>
      {renderLegend({ payload: [
        { dataKey: 'result', color: '#3b82f6', value: 'ผลดำเนินงาน' },
        { dataKey: 'targetLevel5', color: '#ef4444', value: 'เป้าหมายระดับ 5' },
        { dataKey: 'targetYearly', color: '#10b981', value: 'เป้าหมายรายปี' },
      ] })}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={MARGIN}>
            <defs>
              <linearGradient id="resFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="pea" interval={0} padding={{ left: 28, right: 28 }} height={xHeight} tick={<XTick />} />
            <YAxis width={big ? 90 : 78} label={unit ? { value: unit, angle: -90, position: 'insideLeft', offset: big ? -6 : 4, style: { textAnchor: 'middle', fontSize: big ? 14 : 12, fill: '#6b7280' } } : undefined} tickFormatter={fmt} tick={{ fontSize: big ? 14 : 12 }} scale={scale} domain={[0, yMax]} ticks={yTicks} allowDataOverflow />
            <Tooltip formatter={(v, n) => [`${fmt(v)}${unit ? ' ' + unit : ''}`, n]} />
            <Area
              type="monotone" dataKey="result" name="ผลดำเนินงาน" stroke="#3b82f6" strokeWidth={3}
              fill="url(#resFill)" hide={!!hidden.result} animationDuration={700}
              dot={<ResultDot />} activeDot={{ r: 9 }}
            >
              <LabelList dataKey="result" content={makeLabel('result')} />
            </Area>
            <Line
              type="monotone" dataKey="targetYearly" name="เป้าหมายรายปี" stroke="#10b981" strokeWidth={2}
              strokeDasharray="6 4" dot={n <= 25 ? { r: 3 } : false} hide={!!hidden.targetYearly} animationDuration={700}
            >
              <LabelList dataKey="targetYearly" content={makeLabel('targetYearly')} />
            </Line>
            <Line
              type="monotone" dataKey="targetLevel5" name="เป้าหมายระดับ 5" stroke="#ef4444" strokeWidth={2}
              strokeDasharray="6 4" dot={n <= 25 ? { r: 3 } : false} hide={!!hidden.targetLevel5} animationDuration={700}
            >
              <LabelList dataKey="targetLevel5" content={makeLabel('targetLevel5')} />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  };

  const th = (label, key) => (
    <th className="px-2 py-2 text-left font-semibold">
      <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-blue-600">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sort.key === key ? 'text-blue-600' : 'text-gray-300'}`} />
      </button>
    </th>
  );

  const table = (maxH) => (
    <div className="overflow-y-auto" style={{ maxHeight: maxH }}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white shadow-[0_1px_0_#e5e7eb]">
          <tr>
            <th className="px-2 py-2 text-left"><Trophy className="w-4 h-4 text-amber-500 inline" /> อันดับ</th>
            {th('PEA', 'pea')}
            {th(unit ? `ผลดำเนินงาน (${unit})` : 'ผลดำเนินงาน', 'result')}
            {th('คิดเป็น %', 'pct')}
            {th('คะแนน KPIs', 'score')}
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => (
            <tr key={r.pea + i} className={isFocus(r.pea) ? 'bg-amber-100 font-bold text-amber-800' : i % 2 ? 'bg-gray-50' : ''}>
              <td className="px-2 py-2">{rankOf.get(r.pea)}</td>
              <td className="px-2 py-2">{isFocus(r.pea) && '⭐ '}{r.pea}</td>
              <td className="px-2 py-2">{fmt(r.result)}</td>
              <td className="px-2 py-2">{r.pct.toFixed(1)}%</td>
              <td className="px-2 py-2">{r.score.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const btn = 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition hover:brightness-110 active:scale-95';
  const title = `${item} ${first?.description ?? ''}`;
  const unit = first?.unit ? first.unit : '';

  const chartCard = (height, inModal) => (
    <div ref={inModal ? null : chartRef} className="bg-white rounded-2xl shadow p-5 min-w-0">
      <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
        <h3 className="font-semibold text-gray-800">📈 กราฟแสดงผลการดำเนินงาน</h3>
        <div className="flex gap-2" data-html2canvas-ignore>
          <button type="button" className={`${btn} bg-gray-500`} onClick={() => go(-1)}><ChevronLeft className="w-4 h-4" />Previous</button>
          <button type="button" className={`${btn} bg-gray-500`} onClick={() => go(1)}>Next<ChevronRight className="w-4 h-4" /></button>
          {!inModal && <button type="button" className={`${btn} bg-blue-500`} onClick={() => setExpanded(true)}><Maximize2 className="w-4 h-4" />ขยายกราฟ</button>}
          <button type="button" className={`${btn} bg-blue-500`} onClick={() => saveNode(inModal ? document.getElementById('kpi-chart-modal') : chartRef.current, `kpi-${item}-chart.png`)}><Download className="w-4 h-4" />โหลดกราฟ</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-2" data-html2canvas-ignore>
        <label className="text-sm text-gray-600">เลือกข้อ:</label>
        <select
          value={item}
          onChange={(e) => select(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm max-w-full sm:max-w-md"
        >
          {items.map((it) => <option key={it} value={it}>{it} — {descOf(it).slice(0, 60)}</option>)}
        </select>
        <input
          type="text"
          list={`kpi-items-${inModal ? 'm' : 'n'}`}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="พิมพ์เลขข้อ เช่น 4.1"
          className="border rounded-lg px-2 py-1 text-sm w-40"
        />
        <datalist id={`kpi-items-${inModal ? 'm' : 'n'}`}>
          {items.map((it) => <option key={it} value={it}>{descOf(it).slice(0, 60)}</option>)}
        </datalist>
        <span className="text-xs text-gray-400">{safeIdx + 1} / {items.length}</span>
        <div className="inline-flex rounded-lg border overflow-hidden text-sm ml-auto" title="Log เหมาะเมื่อค่าต่างกันมาก (ค่า 0 แสดงได้ปกติ)">
          {[['linear', 'เส้นตรง'], ['symlog', 'Log']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setScale(v)}
              className={`px-3 py-1 ${scale === v ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{l}</button>
          ))}
        </div>
      </div>
      <p className={`${inModal ? 'text-lg' : 'text-base'} font-medium text-gray-800`}>กำลังแสดงผลของ &quot;{title}&quot;</p>
      <p className={`${inModal ? 'text-base' : 'text-sm'} text-blue-600 mb-2`}>
        {first?.weight ? <>น้ำหนัก: {first.weight}</> : null}
        {unit ? <span className="ml-3 text-gray-700">หน่วย: <b>{unit}</b></span> : null}
      </p>
      {chart(height, inModal)}
      <div className="mt-3 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm">
        <div className="font-semibold">📝 หมายเหตุ:</div>
        <div className="text-gray-600">{note || 'ไม่มีหมายเหตุ'}</div>
      </div>
    </div>
  );

  const tableCard = (maxH, inModal) => (
    <div ref={inModal ? null : tableRef} className="bg-white rounded-2xl shadow p-5 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">ผลการดำเนินงาน</h3>
          <p className="text-xs text-gray-500">หัวข้อ KPIs: {title}</p>
        </div>
        <div className="flex gap-2" data-html2canvas-ignore>
          {!inModal && <button type="button" className={`${btn} bg-emerald-500`} onClick={() => setTableExpanded(true)}><Maximize2 className="w-4 h-4" />ขยาย</button>}
          <button type="button" className={`${btn} bg-emerald-500`} onClick={() => saveNode(inModal ? document.getElementById('kpi-table-modal') : tableRef.current, `kpi-${item}-ranking.png`)}><Download className="w-4 h-4" />โหลด</button>
        </div>
      </div>
      {table(maxH)}
    </div>
  );

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {chartCard(340, false)}
        {tableCard(420, false)}
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-auto" onClick={() => setExpanded(false)}>
          <div id="kpi-chart-modal" className="relative max-w-6xl mx-auto bg-white rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200" onClick={() => setExpanded(false)}><X className="w-5 h-5" /></button>
            {chartCard(Math.round(window.innerHeight * 0.6), true)}
          </div>
        </div>
      )}
      {tableExpanded && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-auto" onClick={() => setTableExpanded(false)}>
          <div id="kpi-table-modal" className="relative max-w-3xl mx-auto bg-white rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200" onClick={() => setTableExpanded(false)}><X className="w-5 h-5" /></button>
            {tableCard(Math.round(window.innerHeight * 0.75), true)}
          </div>
        </div>
      )}
    </>
  );
}


class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, key: props.resetKey };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }

  render() {
    if (this.state.failed) {
      return <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">แสดงกราฟไม่สำเร็จ ลองเปลี่ยนข้อหรือตัวกรองอีกครั้ง</div>;
    }
    return this.props.children;
  }
}

export default function KpiChartRanking(props) {
  return (
    <Boundary resetKey={`${props.items.length}|${props.selectedItem}|${props.rawData.length}`}>
      <KpiChartRankingInner {...props} />
    </Boundary>
  );
}
