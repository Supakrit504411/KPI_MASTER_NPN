import { useState, useEffect, useMemo, useCallback } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, Users, Wallet, CalendarDays, TrendingUp } from 'lucide-react';
import { fetchLinePeaData } from '../../services/planSheet';
import { parseLinePea, linePeaFacets, TH_MONTHS } from '../../utils/parseLinePea';
import LoadingSpinner from '../presentational/LoadingSpinner';
import ErrorMessage from '../presentational/ErrorMessage';

const baht = (n, d = 0) => Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: d });
const COLOR_PAY = '#2563eb';
const COLOR_CA = '#f59e0b';

function Card({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <span className="p-1.5 rounded-lg" style={{ background: `${color}1a`, color }}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold text-slate-800">{value}</div>
      {sub && <div className="text-sm text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, boxShadow: '0 6px 18px rgba(0,0,0,.12)' }}>
      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{d.label}</div>
      <div style={{ color: COLOR_PAY }}>รวมชำระเงิน: <b>{baht(d.payment, 2)}</b> บาท</div>
      <div style={{ color: COLOR_CA }}>จำนวน CA: <b>{baht(d.ca)}</b></div>
    </div>
  );
}

export default function PeaThailandReport({ onExit }) {
  const [csv, setCsv] = useState(null);
  const [error, setError] = useState('');
  const [office, setOffice] = useState('all');
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');

  const load = useCallback(() => {
    setError('');
    setCsv(null);
    fetchLinePeaData()
      .then((text) => {
        if (!text || text.trim().length < 40) throw new Error('ไม่พบข้อมูล Line-PEA');
        setCsv(text);
      })
      .catch((e) => setError(e.message || 'โหลดข้อมูลไม่สำเร็จ'));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  const rows = useMemo(() => (csv ? parseLinePea(csv) : []), [csv]);
  const facets = useMemo(() => linePeaFacets(rows), [rows]);

  const filtered = useMemo(() => rows.filter((r) =>
    (office === 'all' || r.office === office)
    && (year === 'all' || r.year === Number(year))
    && (month === 'all' || r.monthNo === Number(month))
  ), [rows, office, year, month]);

  const summary = useMemo(() => {
    const payment = filtered.reduce((s, r) => s + r.payment, 0);
    const ca = filtered.reduce((s, r) => s + r.ca, 0);
    const n = filtered.length;
    return { payment, ca, months: n, avgPay: n ? payment / n : 0 };
  }, [filtered]);

  const officeTitle = facets.offices.length === 1 ? facets.offices[0] : (office === 'all' ? 'ทุกหน่วยงาน' : office);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <ErrorMessage message={error} onRetry={load} />
          <button type="button" onClick={onExit} className="mt-4 w-full py-3 rounded-xl bg-white/10 text-white hover:bg-white/20">ปิด</button>
        </div>
      </div>
    );
  }
  if (!csv) {
    return <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center"><LoadingSpinner message="กำลังโหลดข้อมูล PEA Thailand..." /></div>;
  }

  const selCls = 'border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      {/* แถบหัว */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-blue-100 text-sm">รายงาน PEA Thailand · บริการ Line</div>
            <h1 className="text-xl sm:text-2xl font-bold">{officeTitle}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {facets.offices.length > 1 && (
              <select value={office} onChange={(e) => setOffice(e.target.value)} className={selCls}>
                <option value="all">ทุกหน่วยงาน</option>
                {facets.offices.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            <select value={year} onChange={(e) => setYear(e.target.value)} className={selCls}>
              <option value="all">ทุกปี</option>
              {facets.years.map((y) => <option key={y} value={y}>ปี {y}</option>)}
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className={selCls}>
              <option value="all">ทุกเดือน</option>
              {facets.months.map((m) => <option key={m} value={m}>{TH_MONTHS[m]}</option>)}
            </select>
            <button type="button" onClick={onExit} className="p-2 rounded-lg bg-white/15 hover:bg-white/25" title="ปิด (Esc)"><X className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">
        {/* การ์ดสรุป */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card icon={<Wallet className="w-5 h-5" />} color={COLOR_PAY} label="ยอดชำระเงินรวม" value={`${baht(summary.payment)} ฿`} sub={`${summary.months} เดือน`} />
          <Card icon={<Users className="w-5 h-5" />} color={COLOR_CA} label="จำนวน CA รวม" value={baht(summary.ca)} sub="ราย" />
          <Card icon={<TrendingUp className="w-5 h-5" />} color="#059669" label="เฉลี่ยชำระเงิน/เดือน" value={`${baht(summary.avgPay)} ฿`} />
          <Card icon={<CalendarDays className="w-5 h-5" />} color="#7c3aed" label="ช่วงข้อมูล" value={`${summary.months} เดือน`} sub={filtered.length ? `${filtered[0].label} – ${filtered[filtered.length - 1].label}` : '—'} />
        </div>

        {/* กราฟ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="font-semibold text-slate-800">รวมชำระเงิน และ จำนวน CA รายเดือน</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-4 h-3 rounded-sm" style={{ background: COLOR_PAY }} /> รวมชำระเงิน (บาท)</span>
              <span className="flex items-center gap-1.5"><span className="w-5 h-0 border-t-2" style={{ borderColor: COLOR_CA }} /> จำนวน CA</span>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-400">ไม่มีข้อมูลตามตัวกรอง</div>
          ) : (
            <div style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filtered} margin={{ top: 16, right: 16, left: 8, bottom: filtered.length > 10 ? 50 : 10 }}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="label" interval={0} angle={filtered.length > 10 ? -45 : 0} textAnchor={filtered.length > 10 ? 'end' : 'middle'} height={filtered.length > 10 ? 70 : 30} tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis yAxisId="pay" tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} tick={{ fontSize: 12, fill: COLOR_PAY }} width={52} />
                  <YAxis yAxisId="ca" orientation="right" tick={{ fontSize: 12, fill: COLOR_CA }} width={40} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                  <Bar yAxisId="pay" dataKey="payment" radius={[5, 5, 0, 0]} maxBarSize={44} isAnimationActive={false}>
                    {filtered.map((r) => <Cell key={`${r.year}-${r.monthNo}`} fill={COLOR_PAY} />)}
                  </Bar>
                  <Line yAxisId="ca" type="monotone" dataKey="ca" stroke={COLOR_CA} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ตาราง */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 font-semibold text-slate-800">ตารางข้อมูลรายเดือน ({filtered.length})</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-2.5 text-left">เดือน</th>
                  <th className="px-5 py-2.5 text-right">จำนวน CA</th>
                  <th className="px-5 py-2.5 text-right">รวมชำระเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={`${r.year}-${r.monthNo}`} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-2 text-slate-700">{r.label}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-slate-700">{baht(r.ca)}</td>
                    <td className="px-5 py-2 text-right tabular-nums font-medium text-slate-800">{baht(r.payment, 2)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-400">ไม่มีข้อมูลตามตัวกรอง</td></tr>}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-800">
                    <td className="px-5 py-2.5">รวม</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{baht(summary.ca)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{baht(summary.payment, 2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
