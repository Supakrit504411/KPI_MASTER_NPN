import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, Trophy, Medal, Award, RefreshCw, Camera, Monitor, X, ArrowUpDown, ArrowUp, ArrowDown, Hash, Target, TrendingUp, Calendar } from 'lucide-react';
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
  const [detail, setDetail] = useState(null);
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
    } else {
      const q = query.trim().toLowerCase();
      if (q) {
        rows = rows.filter((r) =>
          r.pea.toLowerCase().includes(q) ||
          (r.code && r.code.toLowerCase().includes(q)) ||
          (r.raw && r.raw.toLowerCase().includes(q))
        );
      }
    }
    const getter = {
      rank: (r) => r.rank,
      pea: (r) => r.pea,
      code: (r) => r.code || '',
      score: (r) => r.score ?? -Infinity,
      // ค่า default สำหรับโหมด monitor: เรียงตามลำดับที่ตั้งไว้ใน MONITOR_XS
      monitor: (r) => MONITOR_ORDER.get(r.pea) ?? 99,
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
      // ปลดล็อกกล่องที่ scroll ได้ เพื่อให้ทุกแถว/ทุกคอลัมน์โผล่ครบในภาพ
      const inner = el.querySelectorAll('[class*="max-h-"], [class*="overflow-"]');
      const saved = [];
      inner.forEach((sc) => {
        saved.push({ el: sc, maxHeight: sc.style.maxHeight, overflow: sc.style.overflow });
        sc.style.maxHeight = 'none';
        sc.style.overflow = 'visible';
      });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const width = Math.ceil(el.scrollWidth);
      const height = Math.ceil(el.scrollHeight);
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width,
        height,
        // html-to-image คัดลอก computed style ของ root มาด้วย ทำให้ margin จาก mx-auto
        // ดันเนื้อหาไปทางขวาและถูกตัดขอบ จึงต้องล้าง margin/transform ในภาพ
        style: { margin: '0', maxWidth: 'none', width: `${width}px`, transform: 'none' },
        filter: (node) => !(node.dataset && 'html2canvasIgnore' in node.dataset),
      });
      saved.forEach(({ el: s, maxHeight, overflow }) => {
        s.style.maxHeight = maxHeight;
        s.style.overflow = overflow;
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

      <main ref={captureRef} className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
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
                    <SortHeader label="อันดับ" sortKey="rank" sort={sort} onToggle={toggleSort} align="center" />
                    <SortHeader label="หน่วยงาน" sortKey="pea" sort={sort} onToggle={toggleSort} align="left" />
                    <SortHeader label="รหัส" sortKey="code" sort={sort} onToggle={toggleSort} align="left" className="hidden sm:table-cell" />
                    <SortHeader label="คะแนน" sortKey="score" sort={sort} onToggle={toggleSort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row) => {
                    const badge = rankBadge(row.rank);
                    const highlighted = MONITOR_SET.has(row.pea);
                    return (
                      <tr key={row.raw}
                        onClick={() => setDetail({ ...row, _total: data?.total || 0 })}
                        className={`transition-all cursor-pointer group ${highlighted && !monitorOnly ? 'bg-amber-50/40 hover:bg-amber-50 hover:shadow-sm' : 'hover:bg-blue-50/60 hover:shadow-sm'}`}>
                        <td className="px-2 py-2 text-center">
                          <span className={`inline-flex items-center justify-center gap-0.5 min-w-[2rem] px-1.5 py-0.5 rounded-full text-sm font-bold group-hover:scale-110 transition-transform ${badge.cls}`}>
                            {badge.icon}
                            {row.rank}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 group-hover:underline">
                            {row.pea}
                            {highlighted && !monitorOnly && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded align-middle">
                                <Monitor className="w-2.5 h-2.5" />M
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell whitespace-nowrap">
                          <span className="text-xs text-gray-500 tabular-nums">{row.code}</span>
                        </td>
                        <td className={`px-3 py-2 text-right text-sm font-bold tabular-nums whitespace-nowrap ${scoreColor(row.score)}`}>
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
      </main>
      {detail && <DetailModal row={detail} rows={data?.rows || []} onClose={() => setDetail(null)} />}
    </div>
  );
}

function DetailModal({ row, rows, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const total = rows.length;
  const top = rows[0];
  const gapTop = top && row.score != null && top.score != null ? top.score - row.score : null;
  const passThreshold = 4.5;
  const gapPass = row.score != null ? row.score - passThreshold : null;
  const percentile = total > 0 ? Math.round(((total - row.rank + 1) / total) * 100) : 0;
  const isMonitor = MONITOR_SET.has(row.pea);
  const badge = rankBadge(row.rank);
  const gradient = row.rank === 1 ? 'from-amber-500 to-orange-500'
    : row.rank <= 3 ? 'from-orange-400 to-rose-500'
    : row.score >= 5 ? 'from-emerald-500 to-teal-500'
    : row.score >= 4.5 ? 'from-blue-500 to-indigo-500'
    : 'from-slate-500 to-slate-700';
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className={`bg-gradient-to-r ${gradient} px-6 py-5 text-white relative`}>
          <button type="button" onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/15 hover:bg-white/25" title="ปิด (Esc)">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-white/85">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 font-bold`}>
              {badge.icon}
              #{row.rank}
            </span>
            <span>จาก {total} หน่วย · กลุ่ม XS</span>
            {isMonitor && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/25 rounded text-[10px] font-semibold">
                <Monitor className="w-2.5 h-2.5" />Monitor
              </span>
            )}
          </div>
          <div className="text-2xl font-bold mt-1.5">{row.pea}</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums">{row.score != null ? row.score.toFixed(3) : '–'}</span>
            <span className="text-xl text-white/85">/ 5.000</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm text-slate-600 mb-1.5">
              <span>คะแนน</span>
              <span className="font-bold text-slate-800">{row.score != null ? ((row.score / 5) * 100).toFixed(1) : '–'}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${gradient}`} style={{ width: `${Math.min((row.score || 0) / 5 * 100, 100)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoBox icon={<Hash className="w-4 h-4" />} label="รหัสหน่วย" value={row.code || '–'} />
            <InfoBox icon={<Calendar className="w-4 h-4" />} label="รอบข้อมูล" value={row.period || '–'} />
            <InfoBox icon={<Trophy className="w-4 h-4" />} label="Percentile" value={`${percentile}%`} tint="indigo" />
            <InfoBox icon={<Target className="w-4 h-4" />} label="เทียบเกณฑ์ผ่าน" value={gapPass != null ? (gapPass >= 0 ? `+${gapPass.toFixed(3)}` : gapPass.toFixed(3)) : '–'} tint={gapPass != null && gapPass >= 0 ? 'emerald' : 'red'} />
          </div>

          {gapTop != null && gapTop > 0 && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-700">
                ห่างอันดับ 1 (<span className="font-semibold">{top.pea}</span>) อยู่ <span className="font-bold text-indigo-700">{gapTop.toFixed(3)}</span> คะแนน
              </span>
            </div>
          )}

          <button type="button" onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value, tint = 'slate' }) {
  const map = {
    slate: 'bg-slate-50 text-slate-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-3 border border-black/5 ${map[tint] || map.slate}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80">{icon}{label}</div>
      <div className="mt-0.5 text-base font-bold tabular-nums">{value}</div>
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
