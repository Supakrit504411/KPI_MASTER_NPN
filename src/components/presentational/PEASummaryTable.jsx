import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown, X, Target, Award } from 'lucide-react';

const COLOR_PALETTE = [
  { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { gradient: 'from-rose-500 to-red-500', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { gradient: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { gradient: 'from-sky-500 to-blue-500', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { gradient: 'from-lime-500 to-green-500', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  { gradient: 'from-fuchsia-500 to-pink-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  { gradient: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
];

const colorCache = {};
let colorIndex = 0;
function getPEAColor(peaName) {
  if (colorCache[peaName]) return colorCache[peaName];
  const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
  colorIndex++;
  colorCache[peaName] = color;
  return color;
}

// ลำดับความสำคัญของกลุ่มเขต: จุดรวมงานมาก่อน แล้วค่อย รวม → S → XS
// ใช้สำหรับจัดเรียง default เพื่อให้หน่วย "จุดรวมงาน" เช่น กฟส.นพ. ขึ้นมาก่อน
const GROUP_PRIORITY_ORDER = ['จุดรวมงาน', 'รวม', 'S', 'XS'];
// หากลุ่มเขตที่หน่วยงานนี้สังกัด พร้อมอันดับ/คะแนนจากชีต "จัดอันดับ"
// ใช้เป็นแหล่งเดียวกับคอลัมน์อันดับในตาราง เพื่อให้ modal แสดงเลขตรงกัน
function districtInfoOf(districtRanking, pea) {
  if (!districtRanking) return null;
  for (let i = 0; i < GROUP_PRIORITY_ORDER.length; i++) {
    const group = GROUP_PRIORITY_ORDER[i];
    const info = districtRanking[group]?.[pea];
    if (info) return { group, priority: i, ...info };
  }
  return null;
}

function peaGroupPriority(districtRanking, pea) {
  return districtInfoOf(districtRanking, pea)?.priority ?? 99;
}

function computeRankMap(summaries, districtRanking) {
  // อันดับใช้คะแนนถ่วงน้ำหนัก (weightedPct) ตามเกณฑ์เขต
  // ถ้ายังไม่มี weightedPct ให้ fallback เป็นคะแนนรวมเดิม
  // จัดลำดับกลุ่มเขตก่อน (จุดรวมงาน > รวม > S > XS) แล้วเรียงตามคะแนน
  const scoreOf = (s) => (s.weightedPct != null ? s.weightedPct : (s.totalScoreNet || 0));
  const sorted = [...summaries].sort((a, b) => {
    const pa = peaGroupPriority(districtRanking, a.pea);
    const pb = peaGroupPriority(districtRanking, b.pea);
    if (pa !== pb) return pa - pb;
    return scoreOf(b) - scoreOf(a);
  });
  const map = {};
  let lastScore = null;
  let lastRank = 0;
  sorted.forEach((s, i) => {
    const score = scoreOf(s);
    const rank = score === lastScore ? lastRank : i + 1;
    map[s.pea] = rank;
    lastScore = score;
    lastRank = rank;
  });
  return map;
}

// อ่านอันดับของหน่วยงานในกลุ่มที่ระบุจากข้อมูลที่ทางเขตจัดทำ
// คืน null ถ้าไม่มีในกลุ่มนั้น (เพื่อให้แสดง "–")
function districtRankOf(districtRanking, group, pea) {
  if (!districtRanking) return null;
  const g = districtRanking[group];
  if (!g) return null;
  return g[pea] || null;
}

function rankBadge(rank) {
  if (rank === 1) return 'bg-amber-100 text-amber-700 ring-1 ring-amber-300';
  if (rank === 2) return 'bg-slate-100 text-slate-700 ring-1 ring-slate-300';
  if (rank === 3) return 'bg-orange-100 text-orange-700 ring-1 ring-orange-300';
  return 'bg-gray-50 text-gray-600 ring-1 ring-gray-200';
}

const SORT_KEYS = {
  pea: (s) => s.pea,
  passed: (s) => s.passed,
  failed: (s) => s.failed,
  pending: (s) => s.pending,
  passRate: (s) => s.passRate,
  totalScoreNet: (s) => s.totalScoreNet,
  weightedPct: (s) => s.weightedPct ?? 0,
  rank: (s, ranks) => ranks[s.pea] || 999,
  // อันดับจากข้อมูลเขต (3 กลุ่ม) — ไม่มีให้ไปท้ายตาราง
  rankRuam: (s, _r, dr) => (districtRankOf(dr, 'รวม', s.pea)?.rank ?? 999),
  rankJuan: (s, _r, dr) => (districtRankOf(dr, 'จุดรวมงาน', s.pea)?.rank ?? 999),
  rankS: (s, _r, dr) => (districtRankOf(dr, 'S', s.pea)?.rank ?? 999),
};

function useSortedSummaries(summaries, rankMap, districtRanking) {
  const [sort, setSort] = useState({ key: 'rank', dir: 'asc' });
  const sorted = useMemo(() => {
    const getter = SORT_KEYS[sort.key] || SORT_KEYS.rank;
    const arr = [...summaries].sort((a, b) => {
      const va = getter(a, rankMap, districtRanking);
      const vb = getter(b, rankMap, districtRanking);
      if (typeof va === 'string') return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sort.dir === 'asc' ? (va - vb) : (vb - va);
    });
    return arr;
  }, [summaries, rankMap, districtRanking, sort]);
  const toggle = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'pea' ? 'asc' : (key === 'rank' ? 'asc' : 'desc') });
  return { sorted, sort, toggle };
}

// Cell ที่แสดงอันดับจากกลุ่มของทางเขต (หรือ "–" ถ้าไม่มี)
function DistrictRankCell({ info, totalInGroup, compact = false }) {
  if (!info) {
    return <span className="text-gray-300 text-sm">–</span>;
  }
  const sizeCls = compact ? 'text-sm min-w-[2.25rem]' : 'text-sm min-w-[2.5rem]';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`inline-flex items-center justify-center ${sizeCls} px-2 py-0.5 rounded-full font-bold ${rankBadge(info.rank)}`}>
        {info.rank}
      </span>
      <span className="text-xs text-slate-600 font-semibold tabular-nums">
        /{totalInGroup} · {info.score != null ? info.score.toFixed(3) : '–'}
      </span>
    </div>
  );
}

function SortHeader({ label, sortKey, sort, onToggle, align = 'center', className = '' }) {
  const active = sort.key === sortKey;
  const alignCls = align === 'left' ? 'text-left justify-start' : align === 'right' ? 'text-right justify-end' : 'text-center justify-center';
  return (
    <th className={`px-3 py-2.5 text-sm font-semibold text-gray-600 uppercase tracking-wide bg-gray-50 whitespace-nowrap ${alignCls.split(' ')[0]} ${className}`}>
      <button type="button" onClick={() => onToggle(sortKey)}
        className={`inline-flex items-center gap-1 ${alignCls.split(' ')[1]} w-full px-1.5 py-0.5 rounded transition-colors ${active ? 'text-blue-700 bg-blue-50' : 'hover:bg-gray-100'}`}>
        <span>{label}</span>
        {active
          ? (sort.dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)
          : <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
    </th>
  );
}

function DetailModal({ summary, rank, districtInfo, onClose, onFilter }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!summary) return null;
  const colors = getPEAColor(summary.pea);
  // ใช้อันดับจากชีต "จัดอันดับ" ให้ตรงกับคอลัมน์ในตาราง ถ้าไม่มีค่อย fallback เป็นอันดับที่คำนวณในแอป
  const shownRank = districtInfo?.rank ?? rank;
  const shownTotal = districtInfo?.total ?? summary._total;
  const rankLabel = districtInfo ? `อันดับ (${districtInfo.group})` : 'อันดับในชุด';
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
        <div className={`bg-gradient-to-r ${colors.gradient} px-6 py-5 text-white relative`}>
          <button type="button" onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/15 hover:bg-white/25" title="ปิด (Esc)"><X className="w-5 h-5" /></button>
          <div className="text-sm text-white/80">
            อันดับ {shownRank ?? '—'} จาก {shownTotal || '—'}
            {districtInfo && ` · ${districtInfo.group}`}
          </div>
          <div className="text-3xl font-bold mt-1">{summary.pea}</div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatBox icon={<CheckCircle2 className="w-5 h-5" />} label="ผ่าน" value={summary.passed} color="text-emerald-600" bg="bg-emerald-50" />
            <StatBox icon={<XCircle className="w-5 h-5" />} label="ไม่ผ่าน" value={summary.failed} color="text-red-600" bg="bg-red-50" />
            <StatBox icon={<Clock className="w-5 h-5" />} label="รอผล" value={summary.pending} color="text-amber-600" bg="bg-amber-50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatBox icon={<Target className="w-5 h-5" />} label="อัตราผ่าน (ที่ประเมิน)" value={`${summary.passRate}%`} color="text-blue-600" bg="bg-blue-50" />
            <StatBox icon={<Award className="w-5 h-5" />} label={rankLabel} value={shownRank != null ? `#${shownRank}` : '–'} color="text-purple-600" bg="bg-purple-50" />
          </div>

          {summary.weightedBreakdown && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-indigo-800">คะแนนถ่วงน้ำหนัก (ตามเกณฑ์เขต)</div>
                <div className="text-2xl font-bold text-indigo-700 tabular-nums">
                  {summary.weightedPct != null ? `${summary.weightedPct.toFixed(2)}%` : '–'}
                </div>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left font-medium py-1">กลุ่ม</th>
                    <th className="text-right font-medium py-1">น้ำหนัก</th>
                    <th className="text-right font-medium py-1">%</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {summary.weightedBreakdown.map((g) => (
                    <tr key={g.label} className="border-t border-indigo-100">
                      <td className="py-1">{g.label}</td>
                      <td className="py-1 text-right tabular-nums">{g.weight}%</td>
                      <td className="py-1 text-right tabular-nums font-semibold">{g.pct != null ? `${g.pct.toFixed(1)}%` : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-xs text-slate-500">
                * ฐานน้ำหนัก {summary.knownWeight}% ที่ประกาศแล้ว · อีก {100 - summary.knownWeight}% ยังไม่ประกาศ
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { onFilter(summary.pea, null); onClose(); }}
              className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${colors.gradient} text-white font-semibold hover:brightness-110 shadow`}>
              ดูเฉพาะหน่วยงานนี้
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">ปิด</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-3 border border-black/5`}>
      <div className={`flex items-center gap-1.5 ${color} text-sm font-medium`}>{icon}{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export default function PEASummaryTable({ summaries, activePEA, activeStatus, onCardClick, districtRanking }) {
  const [detailPea, setDetailPea] = useState(null);
  const rankMap = useMemo(() => computeRankMap(summaries, districtRanking), [summaries, districtRanking]);
  const { sorted, sort, toggle } = useSortedSummaries(summaries, rankMap, districtRanking);
  const detail = detailPea ? summaries.find((s) => s.pea === detailPea) : null;

  const common = {
    summaries: sorted,
    rankMap,
    districtRanking,
    sort,
    onToggle: toggle,
    activePEA,
    activeStatus,
    onCardClick,
    onOpenDetail: (pea) => setDetailPea(pea),
  };

  return (
    <>
      {summaries.length > 8 ? <PEASummaryTableMode {...common} /> : <PEASummaryGrid {...common} />}
      {detail && (
        <DetailModal
          summary={{ ...detail, _total: summaries.length }}
          rank={rankMap[detail.pea]}
          districtInfo={districtInfoOf(districtRanking, detail.pea)}
          onClose={() => setDetailPea(null)}
          onFilter={onCardClick}
        />
      )}
    </>
  );
}

// ตาราง ≤ 8 PEA
function PEASummaryGrid({ summaries, rankMap, districtRanking, sort, onToggle, activePEA, activeStatus, onCardClick, onOpenDetail }) {
  const totalRuam = districtRanking?.['รวม'] ? Object.keys(districtRanking['รวม']).length : 0;
  const totalJuan = districtRanking?.['จุดรวมงาน'] ? Object.keys(districtRanking['จุดรวมงาน']).length : 0;
  const totalS = districtRanking?.['S'] ? Object.keys(districtRanking['S']).length : 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-auto min-w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader label="หน่วยงาน" sortKey="pea" sort={sort} onToggle={onToggle} align="left" />
              <SortHeader label="ผ่าน" sortKey="passed" sort={sort} onToggle={onToggle} />
              <SortHeader label="ไม่ผ่าน" sortKey="failed" sort={sort} onToggle={onToggle} />
              <SortHeader label="รอผล" sortKey="pending" sort={sort} onToggle={onToggle} />
              <SortHeader label="อัตราผ่าน" sortKey="passRate" sort={sort} onToggle={onToggle} className="min-w-[130px]" />
              <SortHeader label="อันดับ (รวม)" sortKey="rankRuam" sort={sort} onToggle={onToggle} />
              <SortHeader label="อันดับ (จุดรวมงาน)" sortKey="rankJuan" sort={sort} onToggle={onToggle} />
              <SortHeader label="อันดับ (S)" sortKey="rankS" sort={sort} onToggle={onToggle} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summaries.map((summary) => {
              const colors = getPEAColor(summary.pea);
              const isThisPEAActive = activePEA === summary.pea;
              return (
                <tr key={summary.pea}
                  onClick={() => onOpenDetail(summary.pea)}
                  className={`transition-all cursor-pointer group ${isThisPEAActive ? 'bg-blue-50' : 'hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-transparent hover:shadow-sm'}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors.gradient} flex-shrink-0 group-hover:scale-125 transition-transform`} />
                      <span className={`font-semibold text-base ${colors.text} group-hover:underline`}>{summary.pea}</span>
                    </div>
                  </td>
                  <StatusCell count={summary.passed} active={activeStatus === 'passed' && isThisPEAActive}
                    onClick={(e) => { e.stopPropagation(); onCardClick(summary.pea, activeStatus === 'passed' ? null : 'passed'); }}
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} activeCls="bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" />
                  <StatusCell count={summary.failed} active={activeStatus === 'failed' && isThisPEAActive}
                    onClick={(e) => { e.stopPropagation(); onCardClick(summary.pea, activeStatus === 'failed' ? null : 'failed'); }}
                    icon={<XCircle className="w-4 h-4 text-red-500" />} activeCls="bg-red-100 text-red-700 ring-2 ring-red-300" />
                  <StatusCell count={summary.pending} active={activeStatus === 'pending' && isThisPEAActive}
                    onClick={(e) => { e.stopPropagation(); onCardClick(summary.pea, activeStatus === 'pending' ? null : 'pending'); }}
                    icon={<Clock className="w-4 h-4 text-amber-500" />} activeCls="bg-amber-100 text-amber-700 ring-2 ring-amber-300" />
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden min-w-[60px]">
                        <div className={`h-2 rounded-full transition-all duration-500 ${summary.passRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${(summary.passed / Math.max(summary.total, 1)) * 100}%` }} />
                      </div>
                      <span className={`text-sm font-bold w-11 text-right whitespace-nowrap ${summary.passRate >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{summary.passRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <DistrictRankCell info={districtRankOf(districtRanking, 'รวม', summary.pea)} totalInGroup={totalRuam} />
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <DistrictRankCell info={districtRankOf(districtRanking, 'จุดรวมงาน', summary.pea)} totalInGroup={totalJuan} />
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <DistrictRankCell info={districtRankOf(districtRanking, 'S', summary.pea)} totalInGroup={totalS} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusCell({ count, active, onClick, icon, activeCls }) {
  return (
    <td className="px-3 py-2.5 text-center">
      <button type="button" onClick={onClick}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-base transition-all ${active ? activeCls : 'text-gray-700 hover:bg-gray-100'}`}>
        {icon}<span className="font-bold">{count}</span>
      </button>
    </td>
  );
}

// ตาราง > 8 PEA (table mode)
function PEASummaryTableMode({ summaries, rankMap, districtRanking, sort, onToggle, activePEA, activeStatus, onCardClick, onOpenDetail }) {
  const totalRuam = districtRanking?.['รวม'] ? Object.keys(districtRanking['รวม']).length : 0;
  const totalJuan = districtRanking?.['จุดรวมงาน'] ? Object.keys(districtRanking['จุดรวมงาน']).length : 0;
  const totalS = districtRanking?.['S'] ? Object.keys(districtRanking['S']).length : 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-auto min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader label="หน่วยงาน" sortKey="pea" sort={sort} onToggle={onToggle} align="left" className="sticky left-0 z-20" />
              <SortHeader label="ผ่าน" sortKey="passed" sort={sort} onToggle={onToggle} />
              <SortHeader label="ไม่ผ่าน" sortKey="failed" sort={sort} onToggle={onToggle} />
              <SortHeader label="รอผล" sortKey="pending" sort={sort} onToggle={onToggle} />
              <SortHeader label="อัตราผ่าน" sortKey="passRate" sort={sort} onToggle={onToggle} className="min-w-[120px]" />
              <SortHeader label="อันดับ (รวม)" sortKey="rankRuam" sort={sort} onToggle={onToggle} />
              <SortHeader label="อันดับ (จุดรวมงาน)" sortKey="rankJuan" sort={sort} onToggle={onToggle} />
              <SortHeader label="อันดับ (S)" sortKey="rankS" sort={sort} onToggle={onToggle} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summaries.map((summary) => {
              const colors = getPEAColor(summary.pea);
              const isThisPEAActive = activePEA === summary.pea;
              return (
                <tr key={summary.pea}
                  onClick={() => onOpenDetail(summary.pea)}
                  className={`transition-all cursor-pointer group ${isThisPEAActive ? 'bg-blue-50' : 'hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-transparent'}`}>
                  <td className={`px-3 py-2 sticky left-0 z-10 whitespace-nowrap ${isThisPEAActive ? 'bg-blue-50' : 'bg-white group-hover:bg-blue-50/60'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${colors.gradient} flex-shrink-0 group-hover:scale-125 transition-transform`} />
                      <span className={`font-semibold text-sm ${colors.text} group-hover:underline`}>{summary.pea}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onCardClick(summary.pea, activeStatus === 'passed' ? null : 'passed'); }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm transition-all ${activeStatus === 'passed' && isThisPEAActive ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 font-bold' : 'text-gray-700 font-bold hover:bg-gray-100'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{summary.passed}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onCardClick(summary.pea, activeStatus === 'failed' ? null : 'failed'); }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm transition-all ${activeStatus === 'failed' && isThisPEAActive ? 'bg-red-100 text-red-700 ring-1 ring-red-300 font-bold' : 'text-gray-700 font-bold hover:bg-gray-100'}`}>
                      <XCircle className="w-3.5 h-3.5 text-red-500" />{summary.failed}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onCardClick(summary.pea, activeStatus === 'pending' ? null : 'pending'); }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm transition-all ${activeStatus === 'pending' && isThisPEAActive ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 font-bold' : 'text-gray-700 font-bold hover:bg-gray-100'}`}>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />{summary.pending}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 max-w-[60px] bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${summary.passRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${(summary.passed / Math.max(summary.total, 1)) * 100}%` }} />
                      </div>
                      <span className={`text-sm font-bold whitespace-nowrap ${summary.passRate >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{summary.passRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <DistrictRankCell info={districtRankOf(districtRanking, 'รวม', summary.pea)} totalInGroup={totalRuam} compact />
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <DistrictRankCell info={districtRankOf(districtRanking, 'จุดรวมงาน', summary.pea)} totalInGroup={totalJuan} compact />
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <DistrictRankCell info={districtRankOf(districtRanking, 'S', summary.pea)} totalInGroup={totalS} compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
