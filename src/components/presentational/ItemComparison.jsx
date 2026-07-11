import { useState, useMemo, useEffect, useRef } from 'react';
import { GitCompareArrows, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { getScoreLevel } from '../../utils/parseCSV';

// Dynamic color palette สำหรบั 61 PEA
const COLOR_POOL = [
  { bar: 'from-blue-400 to-blue-600', ring: 'ring-blue-300', soft: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { bar: 'from-purple-400 to-purple-600', ring: 'ring-purple-300', soft: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { bar: 'from-amber-400 to-orange-500', ring: 'ring-amber-300', soft: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { bar: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-300', soft: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bar: 'from-rose-400 to-red-500', ring: 'ring-rose-300', soft: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { bar: 'from-indigo-400 to-violet-500', ring: 'ring-indigo-300', soft: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bar: 'from-sky-400 to-blue-500', ring: 'ring-sky-300', soft: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { bar: 'from-lime-400 to-green-500', ring: 'ring-lime-300', soft: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
];
const peaColorCache = {};
let peaColorIdx = 0;
function getPEAColor(pea) {
  if (!peaColorCache[pea]) {
    peaColorCache[pea] = COLOR_POOL[peaColorIdx % COLOR_POOL.length];
    peaColorIdx++;
  }
  return peaColorCache[pea];
}

// ระดบัสีตามคะแนน
const LEVEL_STYLES = {
  passed: { label: 'ผ่านเกณฑ์', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bar: 'bg-emerald-500', score: 'text-emerald-600', icon: CheckCircle2, glow: 'shadow-emerald-200' },
  warning: { label: 'ใกล้เคียง', badge: 'bg-orange-100 text-orange-700 border-orange-300', bar: 'bg-orange-500', score: 'text-orange-600', icon: AlertTriangle, glow: 'shadow-orange-200' },
  failed: { label: 'ไม่ผ่าน', badge: 'bg-red-100 text-red-700 border-red-300', bar: 'bg-red-500', score: 'text-red-600', icon: XCircle, glow: 'shadow-red-200' },
  pending: { label: 'รอผล', badge: 'bg-gray-100 text-gray-600 border-gray-300', bar: 'bg-gray-400', score: 'text-gray-500', icon: Clock, glow: 'shadow-gray-200' },
};

/**
 * ItemComparison — เปรียบเทียบคะแนน PEA รายข้อ
 * รองรบั 61 PEA + ปุ่ม Next/Prev
 * Presentational Component
 */
export default function ItemComparison({ rawData, items, onSelectedItemChange, highlightedItem }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const itemListRef = useRef(null);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim();
    return items.filter((item) => item.includes(q));
  }, [items, search]);

  // ตรวจสอบว่า selectedItem ยงั อยอู่ใน filteredItems ไหม
  const selectedItem = selectedIdx >= 0 && selectedIdx < filteredItems.length
    ? filteredItems[selectedIdx]
    : null;

  // Reset selectedIdx when items prop changes (e.g. Monitor mode toggle, filter change)
  useEffect(() => {
    if (items.length > 0 && selectedIdx >= items.length) {
      setSelectedIdx(0);
    }
  }, [items, selectedIdx]);

  // Reset selectedIdx when filteredItems changes (search/filter)
  useEffect(() => {
    if (selectedIdx >= filteredItems.length && filteredItems.length > 0) {
      setSelectedIdx(0);
    }
  }, [filteredItems, selectedIdx]);

  // Sync with highlightedItem from parent (DataTable row click or SummaryScoreTable click)
  useEffect(() => {
    if (highlightedItem) {
      const idx = filteredItems.indexOf(highlightedItem);
      if (idx >= 0) {
        setSelectedIdx(idx);
        // Scroll the selected item into view in the list (use requestAnimationFrame for smoother scroll)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (itemListRef.current) {
              const buttons = itemListRef.current.querySelectorAll('button');
              if (buttons[idx]) {
                buttons[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          });
        });
      }
    }
  }, [highlightedItem, filteredItems]);

  const comparison = useMemo(() => {
    if (!selectedItem) return [];
    return rawData
      .filter((row) => row.item === selectedItem)
      .map((row) => ({
        pea: row.pea,
        score: row.score,
        scoreFull: row.scoreFull,
        status: row.status,
        level: getScoreLevel(row.status, row.score),
        description: row.description,
        percentage: row.percentage || 0,
        group: row.group || '',
        targetLevel5: row.targetLevel5 || '',
        result: row.result || '',
        targetYearly: row.targetYearly || '',
      }));
  }, [rawData, selectedItem]);

  const description = comparison[0]?.description || '';

  const summary = useMemo(() => {
    const passed = comparison.filter((c) => c.level === 'passed').length;
    const warning = comparison.filter((c) => c.level === 'warning').length;
    const failed = comparison.filter((c) => c.level === 'failed').length;
    const pending = comparison.filter((c) => c.level === 'pending').length;
    return { passed, warning, failed, pending };
  }, [comparison]);

  const goNext = () => {
    if (selectedIdx < filteredItems.length - 1) setSelectedIdx(selectedIdx + 1);
  };
  const goPrev = () => {
    if (selectedIdx > 0) setSelectedIdx(selectedIdx - 1);
  };

  const handleItemClick = (idx) => {
    const clickedItem = filteredItems[idx];
    if (highlightedItem === clickedItem) {
      // Toggle off: reset local state and signal parent to clear highlightedItem
      setSelectedIdx(-1);
      if (onSelectedItemChange) {
        onSelectedItemChange(null);
      }
    } else {
      setSelectedIdx(idx);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 ${expanded ? 'fixed inset-4 z-50 overflow-y-auto shadow-2xl' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <GitCompareArrows className="w-5 h-5 text-blue-600" />
        เปรียบเทียบคะแนนรายข้อ
        <span className="text-xs font-normal text-gray-400">
          ({comparison.length} หน่วยงาน)
        </span>
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* === ซ้าย: เลือกรายการ === */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            เลือกรายการที่ต้องการเปรียบเทียบ
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIdx(0); }}
            placeholder="ค้นหาข้อ... เช่น 1.1"
            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div ref={itemListRef} className="max-h-80 lg:max-h-96 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {filteredItems.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">ไม่พบข้อที่ค้นหา</p>
            ) : (
              filteredItems.map((item, idx) => (
                <button
                  key={item}
                  onClick={() => handleItemClick(idx)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors
                    ${selectedIdx === idx
                      ? 'bg-blue-600 text-white font-semibold'
                      : highlightedItem === item
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-blue-50 text-gray-700'}`}
                >
                  ข้อ {item}
                </button>
              ))
            )}
          </div>
        </div>

        {/* === ขวา: ผลเปรียบเทียบ === */}
        <div className="lg:col-span-3">
          {!selectedItem ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg p-10">
              เลือกรายการทางซ้ายเพื่อดูการเปรียบเทียบ
            </div>
          ) : (
            <div className="space-y-4">
              {/* หัวข้อ + Next/Prev */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">
                    ข้อ {selectedItem}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <SummaryPill label="ผ่าน" count={summary.passed} color="emerald" />
                    <SummaryPill label="ใกล้เคียง" count={summary.warning} color="orange" />
                    <SummaryPill label="ไม่ผ่าน" count={summary.failed} color="red" />
                    <SummaryPill label="รอผล" count={summary.pending} color="gray" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>

                {/* ปุ่ม Prev / Next + ขยาย */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-blue-200">
                  <button
                    onClick={goPrev}
                    disabled={selectedIdx <= 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                               bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    ข้อก่อนหน้า
                  </button>
                  <span className="text-xs text-gray-500 min-w-[80px] text-center">
                    {selectedIdx >= 0 ? selectedIdx + 1 : '—'} / {filteredItems.length}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={selectedIdx < 0 || selectedIdx >= filteredItems.length - 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                               bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ข้อถัดไป
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                               bg-white border border-gray-300 hover:bg-gray-50"
                    title={expanded ? 'ย่อ' : 'ขยายเต็มจอ'}
                  >
                    {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* การ์ดเปรียบเทียบแต่ละ PEA */}
              <div className={`grid gap-3 ${expanded ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} overflow-y-auto pr-1 ${expanded ? 'max-h-none' : 'max-h-[500px]'}`}>
                {comparison.length === 0 ? (
                  <p className="text-sm text-gray-400 col-span-2 text-center py-6">
                    ไม่มีข้อมูลสำหรับข้อนี้
                  </p>
                ) : (
                  comparison.map((c) => (
                    <PEAScoreCard key={c.pea} data={c} />
                  ))
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-100 flex-wrap">
                <LegendDot color="bg-emerald-500" label="≥ 5 คะแนน (ผ่าน)" />
                <LegendDot color="bg-orange-500" label="4.8 – 4.99 (ใกล้เคียง)" />
                <LegendDot color="bg-red-500" label="< 4.8 (ไม่ผ่าน)" />
                <LegendDot color="bg-gray-400" label="รอผล" />
              </div>
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
                       bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <Minimize2 className="w-4 h-4" />
            ย่อ
          </button>
        </div>
      )}
    </div>
  );
}

function PEAScoreCard({ data }) {
  const colors = getPEAColor(data.pea);
  const level = LEVEL_STYLES[data.level];
  const Icon = level.icon;
  const scorePercent = data.status === 'pending' ? 0 : Math.min((data.score / 5) * 100, 100);

  return (
    <div className={`rounded-xl border ${colors.border} p-3 ${level.glow} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold ${colors.text} truncate`} title={data.pea}>{data.pea}</span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${level.badge}`}>
          <Icon className="w-3 h-3" />
          {level.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-1.5">
        {data.status === 'pending' ? (
          <span className="text-xl font-bold text-gray-400">—</span>
        ) : (
          <span className={`text-2xl font-extrabold ${level.score}`}>{data.score.toFixed(2)}</span>
        )}
        <span className="text-xs text-gray-400">/ 5.00</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${level.bar}`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* คิดเป็น % + คอลัมน์ E/F */}
      <div className="mt-1.5 flex items-center justify-end gap-3 flex-wrap">
        {data.targetYearly && (
          <span className="text-[10px] text-gray-400">
            เป้ารายปี: <span className="text-xs font-semibold text-gray-600">{data.targetYearly}</span>
          </span>
        )}
        {data.targetLevel5 && (
          <span className="text-[10px] text-gray-400">
            เป้า L5: <span className="text-xs font-semibold text-gray-600">{data.targetLevel5}</span>
          </span>
        )}
        {data.result && (
          <span className="text-[10px] text-gray-400">
            ผลดำเนินงาน: <span className="text-xs font-semibold text-gray-600">{data.result}</span>
          </span>
        )}
        {data.percentage > 0 && (
          <span className="text-[10px] text-gray-400">
            คิดเป็น <span className="text-xs font-semibold text-gray-600">{data.percentage}%</span>
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryPill({ label, count, color }) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[11px] ${colorMap[color]}`}>
      {label} {count}
    </span>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
