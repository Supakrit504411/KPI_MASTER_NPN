import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, Trophy, Medal, Award, RefreshCw, Camera, Monitor, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { fetchXSLeaderboard } from '../../services/xsRanking';

// รายชื่อหน่วย XS ที่ต้อง monitor (ตามลำดับที่กำหนด)
const MONITOR_XS = [
  'กฟส.ท่าอุเทน',
  'กฟส.นาหว้า',
  'กฟส.ศรีสงคราม',
  'กฟส.ปลาปาก',
  'กฟส.โพนสวรรค์',
  'กฟส.เรณูนคร',
  'กฟส.วังยาง',
  'กฟส.นาทม',
];
const MONITOR_SET = new Set(MONITOR_XS);
const MONITOR_ORDER = new Map(MONITOR_XS.map((n, i) => [n, i]));

function rankBadge(rank) {
  if (rank === 1) return { cls: 'bg-amber-100 text-amber-700 ring-2 ring-amber-300', icon: <Trophy className="w-3.5 h-3.5" /> };
  if (rank === 2) return { cls: 'bg-slate-100 text-slate-700 ring-2 ring-slate-300', icon: <Medal className="w-3.5 h-3.5" /> };
  if (rank === 3) return { cls: 'bg-orange-100 text-orange-700 ring-2 ring-orange-300', icon: <Award className="w-3.5 h-3.5" /> };
  return { cls: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200', icon: null };
}

function scoreColor(score) {
  if (score == null) return 'text-gray-400';
  if (score >= 5) return 'text-emerald-600';
  if (score >= 4.8) return 'text-blue-600';
  if (score >= 4.5) return 'text-amber-600';
  return 'text-red-600';
}

function SortHeader({ label, sortKey, sort, onToggle, align = 'left', className = '' }) {
  const active = sort.key === sortKey;
  const alignCls = align === 'right' ? 'justify-end text-right' : align === 'center' ? 'justify-center text-center' : 'justify-start text-left';
  return (
    <th className={`px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap ${className}`}>
      <button type="button" onClick={() => onToggle(sortKey)}
        className={`inline-flex items-center gap-1 w-full px-1 py-0.5 rounded transition-colors ${alignCls} ${active ? 'text-blue-700 bg-blue-50' : 'hover:bg-gray-100'}`}>
        <span>{label}</span>
        {active
          ? (sort.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
          : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
      </button>
    </th>
  );
}

export default function XSLeaderboard({ onExit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [monitorOnly, setMonitorOnly] = useState(false);
  const [sort, setSort] = useState({ key: 'rank', dir: 'asc' });
  const captureRef = useRef(null);

  const load = () => {
    setLoading(true);
    fetchXSLeaderboard().then((d) => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const toggleSort = (key) => {
    setSort((s) => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: key === 'pea' || key === 'code' || key === 'rank' ? 'asc' : 'desc' });
  };

  const filtered = useMemo(() => {
    if (!data?.rows) return [];
    let rows = data.rows;
    if (monitorOnly) {
      rows = rows.filter((r) => MONITOR_SET.has(r.pea));
      // เรียงตามลำดับที่กำหนดไว้ใน MONITOR_XS เสมอ ไม่สนใจ sort key
      return [...rows].sort((a, b) => (MONITOR_ORDER.get(a.pea) ?? 99) - (MONITOR_ORDER.get(b.pea) ?? 99));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        r.pea.toLowerCase().includes(q) ||
        (r.code && r.code.toLowerCase().includes(q)) ||
        (r.raw && r.raw.toLowerCase().includes(q))
      );
    }
    const getter = {
      rank: (r) => r.rank,
      pea: (r) => r.pea,
      code: (r) => r.code || '',
      score: (r) => r.score ?? -Infinity,
    }[sort.key] || ((r) => r.rank);
    const sorted = [...rows].sort((a, b) => {
      const va = getter(a), vb = getter(b);
      if (typeof va === 'string') return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sort.dir === 'asc' ? va - vb : vb - va;
    });
    return sorted;
  }, [data, query, monitorOnly, sort]);

  const stats = useMemo(() => {
    if (!data?.rows?.length) return null;
    const base = monitorOnly ? data.rows.filter((r) => MONITOR_SET.has(r.pea)) : data.rows;
    const scores = base.map((r) => r.score).filter((s) => s != null);
    const perfect = scores.filter((s) => s >= 5).length;
    const passed = scores.filter((s) => s >= 4.5).length;
    const avg = scores.reduce((s, v) => s + v, 0) / Math.max(scores.length, 1);
    return { perfect, passed, avg, total: base.length };
  }, [data, monitorOnly]);

  const handleScreenshot = async () => {
    const el = captureRef.current;
    if (!el) return;
    try {
      const { toPng } = await import('html-to-image');
      const rootSaved = { width: el.style.width, maxWidth: el.style.maxWidth, overflow: el.style.overflow };
      el.style.width = 'max-content';
      el.style.maxWidth = 'none';
      el.style.overflow = 'visible';
      const inner = el.querySelectorAll('[class*="max-h-"], [class*="overflow-x"], [class*="overflow-auto"]');
      const innerSaved = [];
      inner.forEach((sc) => {
        innerSaved.push({ el: sc, maxHeight: sc.style.maxHeight, overflow: sc.style.overflow, overflowX: sc.style.overflowX, overflowY: sc.style.overflowY, width: sc.style.width, minWidth: sc.style.minWidth });
        sc.style.maxHeight = 'none';
        sc.style.overflow = 'visible';
        sc.style.overflowX = 'visible';
        sc.style.overflowY = 'visible';
        sc.style.width = 'max-content';
        sc.style.minWidth = '100%';
      });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const fullW = el.scrollWidth, fullH = el.scrollHeight;
      const dataUrl = await toPng(el, {
        pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true,
        width: fullW, height: fullH,
        style: { width: fullW + 'px', height: fullH + 'px', overflow: 'visible' },
      });
      el.style.width = rootSaved.width;
      el.style.maxWidth = rootSaved.maxWidth;
      el.style.overflow = rootSaved.overflow;
      innerSaved.forEach(({ el: s, maxHeight, overflow, overflowX, overflowY, width, minWidth }) => {
        s.style.maxHeight = maxHeight; s.style.overflow = overflow;
        s.style.overflowX = overflowX; s.style.overflowY = overflowY;
        s.style.width = width; s.style.minWidth = minWidth;
      });
      const link = document.createElement('a');
      link.download = `xs-leaderboard-${monitorOnly ? 'monitor-' : ''}${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot error:', err);
      alert('ไม่สามารถบันทึกภาพได้: ' + (err.message || 'ข้อผิดพลาด'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-gradient-to-r from-indigo-800 to-blue-700 text-white shadow-lg" data-html2canvas-ignore>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={onExit}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">XS Leaderboard</h1>
              <p className="text-blue-100 text-sm">อันดับหน่วย กฟฟ. กลุ่ม XS {data?.period ? `· ${data.period}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setMonitorOnly((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${monitorOnly ? 'bg-amber-400 text-blue-900 hover:bg-amber-300' : 'bg-white/15 hover:bg-white/25'}`}>
              <Monitor className="w-4 h-4" />
              Monitor 8 หน่วย
              {monitorOnly && <X className="w-3.5 h-3.5" />}
            </button>
            <button onClick={handleScreenshot}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg transition-colors text-sm font-medium">
              <Camera className="w-4 h-4" />
              บันทึกภาพ
            </button>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>
      </header>

      <main ref={captureRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {monitorOnly && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            โหมด Monitor: แสดงเฉพาะ {MONITOR_XS.length} หน่วยที่กำหนด (เรียงตามลำดับที่ตั้งไว้)
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="หน่วย" value={stats.total} color="text-slate-700" bg="bg-white" />
            <StatCard label="คะแนนเต็ม (≥5)" value={stats.perfect} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard label="ผ่าน (≥4.5)" value={stats.passed} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="คะแนนเฉลี่ย" value={stats.avg.toFixed(3)} color="text-indigo-600" bg="bg-indigo-50" />
          </div>
        )}

        {!monitorOnly && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5" data-html2canvas-ignore>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาหน่วยงาน หรือรหัส..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">กำลังโหลด...</div>
          ) : !filtered.length ? (
            <div className="p-10 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <SortHeader label="อันดับ" sortKey="rank" sort={sort} onToggle={toggleSort} align="center" className="w-20" />
                    <SortHeader label="หน่วยงาน" sortKey="pea" sort={sort} onToggle={toggleSort} align="left" />
                    <SortHeader label="รหัส" sortKey="code" sort={sort} onToggle={toggleSort} align="left" className="hidden sm:table-cell w-32" />
                    <SortHeader label="คะแนน" sortKey="score" sort={sort} onToggle={toggleSort} align="right" className="w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row) => {
                    const badge = rankBadge(row.rank);
                    const highlighted = MONITOR_SET.has(row.pea);
                    return (
                      <tr key={row.raw}
                        className={`transition-colors ${highlighted && !monitorOnly ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-blue-50/40'}`}>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center justify-center gap-1 min-w-[2.25rem] px-2 py-0.5 rounded-full text-sm font-bold ${badge.cls}`}>
                            {badge.icon}
                            {row.rank}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-800 text-sm">
                            {row.pea}
                            {highlighted && !monitorOnly && (
                              <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded">
                                <Monitor className="w-2.5 h-2.5" />M
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          <span className="text-xs text-gray-500 tabular-nums">{row.code}</span>
                        </td>
                        <td className={`px-3 py-2 text-right text-sm font-bold tabular-nums ${scoreColor(row.score)}`}>
                          {row.score != null ? row.score.toFixed(3) : '–'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center pb-4">
          ข้อมูลจากชีต "จัดอันดับ XS" · แยกออกจาก dataset หลัก (L/M/S) เพื่อไม่กระทบตัวเลขรวม
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl border border-black/5 shadow-sm p-3`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
