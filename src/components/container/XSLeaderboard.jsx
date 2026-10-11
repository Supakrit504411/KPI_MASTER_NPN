import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { fetchXSLeaderboard } from '../../services/xsRanking';

function rankBadge(rank) {
  if (rank === 1) return { cls: 'bg-amber-100 text-amber-700 ring-2 ring-amber-300', icon: <Trophy className="w-4 h-4" /> };
  if (rank === 2) return { cls: 'bg-slate-100 text-slate-700 ring-2 ring-slate-300', icon: <Medal className="w-4 h-4" /> };
  if (rank === 3) return { cls: 'bg-orange-100 text-orange-700 ring-2 ring-orange-300', icon: <Award className="w-4 h-4" /> };
  return { cls: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200', icon: null };
}

function scoreColor(score) {
  if (score == null) return 'text-gray-400';
  if (score >= 5) return 'text-emerald-600';
  if (score >= 4.8) return 'text-blue-600';
  if (score >= 4.5) return 'text-amber-600';
  return 'text-red-600';
}

export default function XSLeaderboard({ onExit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    fetchXSLeaderboard().then((d) => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!data?.rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter((r) =>
      r.pea.toLowerCase().includes(q) ||
      (r.code && r.code.toLowerCase().includes(q)) ||
      (r.raw && r.raw.toLowerCase().includes(q))
    );
  }, [data, query]);

  const stats = useMemo(() => {
    if (!data?.rows?.length) return null;
    const scores = data.rows.map((r) => r.score).filter((s) => s != null);
    const perfect = scores.filter((s) => s >= 5).length;
    const passed = scores.filter((s) => s >= 4.5).length;
    const avg = scores.reduce((s, v) => s + v, 0) / Math.max(scores.length, 1);
    return { perfect, passed, avg, total: data.rows.length };
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-gradient-to-r from-indigo-800 to-blue-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">XS Leaderboard</h1>
              <p className="text-blue-100 text-sm">อันดับหน่วย กฟฟ. กลุ่ม XS {data?.period ? `· ${data.period}` : ''}</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="หน่วยทั้งหมด" value={stats.total} color="text-slate-700" bg="bg-white" />
            <StatCard label="คะแนนเต็ม (≥5)" value={stats.perfect} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard label="ผ่าน (≥4.5)" value={stats.passed} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="คะแนนเฉลี่ย" value={stats.avg.toFixed(3)} color="text-indigo-600" bg="bg-indigo-50" />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาหน่วยงาน หรือรหัส..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">กำลังโหลด...</div>
          ) : !filtered.length ? (
            <div className="p-10 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-20">อันดับ</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">หน่วยงาน</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">รหัส</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">คะแนน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row) => {
                    const badge = rankBadge(row.rank);
                    return (
                      <tr key={row.raw} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center justify-center gap-1 min-w-[2.5rem] px-2 py-1 rounded-full text-sm font-bold ${badge.cls}`}>
                            {badge.icon}
                            {row.rank}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-800 text-sm">{row.pea}</div>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          <span className="text-xs text-gray-500 tabular-nums">{row.code}</span>
                        </td>
                        <td className={`px-3 py-2.5 text-right text-sm font-bold tabular-nums ${scoreColor(row.score)}`}>
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
