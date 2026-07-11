import { CheckCircle2, XCircle, Clock, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

// Color palette สำหรับ 61 PEA
const COLOR_PALETTE = [
  { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  { gradient: 'from-rose-500 to-red-500', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' },
  { gradient: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  { gradient: 'from-sky-500 to-blue-500', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700' },
  { gradient: 'from-lime-500 to-green-500', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', badge: 'bg-lime-100 text-lime-700' },
  { gradient: 'from-fuchsia-500 to-pink-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', badge: 'bg-fuchsia-100 text-fuchsia-700' },
  { gradient: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700' },
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

/**
 * PEASummaryTable — ตารางสรุปผลงานรายหน่วยงาน
 * แสดงผลแบบตารางที่ปรับจำนวนคอลัมน์ตามจำนวน PEA ที่เลือก
 * - 4 PEA: แสดง 4 คอลัมน์
 * - 6-8 PEA: แสดง 6-8 คอลัมน์
 * - เกิน 8 PEA: แสดงแบบ scrollable table
 */
export default function PEASummaryTable({ summaries, activePEA, activeStatus, onCardClick }) {
  const count = summaries.length;
  const isTableMode = count > 8;

  if (isTableMode) {
    return <PEASummaryTableMode summaries={summaries} activePEA={activePEA} activeStatus={activeStatus} onCardClick={onCardClick} />;
  }

  return <PEASummaryGrid summaries={summaries} activePEA={activePEA} activeStatus={activeStatus} onCardClick={onCardClick} />;
}

function PEASummaryGrid({ summaries, activePEA, activeStatus, onCardClick }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">หน่วยงาน</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">ผ่าน</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">ไม่ผ่าน</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">รอผล</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">อัตราผ่าน</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">คะแนนรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summaries.map((summary) => {
              const colors = getPEAColor(summary.pea);
              const isThisPEAActive = activePEA === summary.pea;

              return (
                <tr
                  key={summary.pea}
                  className={`transition-colors ${isThisPEAActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  {/* PEA Name */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onCardClick(summary.pea, null)}
                      className={`flex items-center gap-2 w-full text-left`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors.gradient} flex-shrink-0`} />
                      <span className={`font-semibold text-sm truncate ${colors.text}`}>{summary.pea}</span>
                    </button>
                  </td>

                  {/* Passed */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onCardClick(summary.pea, activeStatus === 'passed' ? null : 'passed')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm transition-all
                        ${activeStatus === 'passed' && isThisPEAActive
                          ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                          : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold">{summary.passed}</span>
                    </button>
                  </td>

                  {/* Failed */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onCardClick(summary.pea, activeStatus === 'failed' ? null : 'failed')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm transition-all
                        ${activeStatus === 'failed' && isThisPEAActive
                          ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                          : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      <span className="font-bold">{summary.failed}</span>
                    </button>
                  </td>

                  {/* Pending */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onCardClick(summary.pea, activeStatus === 'pending' ? null : 'pending')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm transition-all
                        ${activeStatus === 'pending' && isThisPEAActive
                          ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                          : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold">{summary.pending}</span>
                    </button>
                  </td>

                  {/* Pass Rate */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${summary.passRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${(summary.passed / Math.max(summary.total, 1)) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold w-10 text-right ${summary.passRate >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {summary.passRate}%
                      </span>
                    </div>
                  </td>

                  {/* Total Score */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span className={`font-bold text-sm ${colors.text}`}>{summary.totalScoreNet}</span>
                      <span className="text-gray-400 text-xs">/{summary.totalScoreFull}</span>
                    </div>
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

function PEASummaryTableMode({ summaries, activePEA, activeStatus, onCardClick }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">หน่วยงาน</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">ผ่าน</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">ไม่ผ่าน</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">รอผล</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">อัตราผ่าน</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">คะแนนรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summaries.map((summary) => {
              const colors = getPEAColor(summary.pea);
              const isThisPEAActive = activePEA === summary.pea;

              return (
                <tr
                  key={summary.pea}
                  className={`transition-colors ${isThisPEAActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-3 py-2.5 sticky left-0 bg-white z-10">
                    <button
                      onClick={() => onCardClick(summary.pea, null)}
                      className="flex items-center gap-2 text-left"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${colors.gradient} flex-shrink-0`} />
                      <span className={`font-semibold text-xs truncate max-w-[150px] ${colors.text}`}>{summary.pea}</span>
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onCardClick(summary.pea, activeStatus === 'passed' ? null : 'passed')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all
                        ${activeStatus === 'passed' && isThisPEAActive
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 font-bold'
                          : 'text-gray-700 font-bold'}`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />{summary.passed}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onCardClick(summary.pea, activeStatus === 'failed' ? null : 'failed')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all
                        ${activeStatus === 'failed' && isThisPEAActive
                          ? 'bg-red-100 text-red-700 ring-1 ring-red-300 font-bold'
                          : 'text-gray-700 font-bold'}`}
                    >
                      <XCircle className="w-3 h-3 text-red-500" />{summary.failed}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onCardClick(summary.pea, activeStatus === 'pending' ? null : 'pending')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all
                        ${activeStatus === 'pending' && isThisPEAActive
                          ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 font-bold'
                          : 'text-gray-700 font-bold'}`}
                    >
                      <Clock className="w-3 h-3 text-amber-500" />{summary.pending}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="flex-1 max-w-[60px] bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${summary.passRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${(summary.passed / Math.max(summary.total, 1)) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${summary.passRate >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {summary.passRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-bold text-xs ${colors.text}`}>{summary.totalScoreNet}<span className="text-gray-400 font-normal">/{summary.totalScoreFull}</span></span>
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
