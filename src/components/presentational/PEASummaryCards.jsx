import { CheckCircle2, XCircle, Trophy, Clock } from 'lucide-react';

// Color palette สำหรับ 61 PEA — ใช้ array ของ gradient แล้ว assign ตาม index
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

// Cache สำหรับ mapping PEA → color
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
 * PEASummaryCards — การ์ดสรุปผลงานสำหรับแต่ละ PEA
 * รองรับ 61 PEA ด้วย dynamic colors
 * Presentational Component — คลิกที่ตัวเลขเพื่อกรองตารางตาม PEA + สถานะ
 */
export default function PEASummaryCards({ summaries, activePEA, activeStatus, onCardClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
      {summaries.map((summary) => {
        const colors = getPEAColor(summary.pea);
        const isThisPEAActive = activePEA === summary.pea;

        const chipActive = (status) => isThisPEAActive && activeStatus === status;
        const chipClass = (status, activeColor, idleColor) =>
          `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all
           ${chipActive(status)
             ? `${activeColor} ring-2 ring-offset-1 shadow-sm`
             : `hover:bg-gray-100 ${idleColor}`
           }`;

        return (
          <div
            key={summary.pea}
            className={`bg-white rounded-xl border ${colors.border} shadow-sm
                        hover:shadow-lg transition-all duration-200 overflow-hidden
                        ${isThisPEAActive ? 'ring-2 ring-blue-400' : ''}`}
          >
            {/* Header — คลิกเพื่อกรองทั้งหมดของ PEA นี้ */}
            <button
              onClick={() => onCardClick(summary.pea, null)}
              className={`bg-gradient-to-r ${colors.gradient} px-4 py-2.5 w-full text-left flex items-center justify-between`}
            >
              <h3 className="text-white font-bold text-base truncate">{summary.pea}</h3>
              <span className="text-white/80 text-[11px] bg-white/20 px-2 py-0.5 rounded flex-shrink-0">
                ดูทั้งหมด
              </span>
            </button>

            {/* Stats */}
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* ผ่าน */}
                <button
                  onClick={() => onCardClick(summary.pea, chipActive('passed') ? null : 'passed')}
                  className={chipClass('passed', 'bg-emerald-100 text-emerald-700', 'text-gray-600')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs">ผ่าน</span>
                  <span className="font-bold ml-auto">{summary.passed}</span>
                </button>

                {/* ไม่ผ่าน */}
                <button
                  onClick={() => onCardClick(summary.pea, chipActive('failed') ? null : 'failed')}
                  className={chipClass('failed', 'bg-red-100 text-red-700', 'text-gray-600')}
                >
                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-xs">ไม่ผ่าน</span>
                  <span className="font-bold ml-auto">{summary.failed}</span>
                </button>
              </div>

              {/* รอผล */}
              <button
                onClick={() => onCardClick(summary.pea, chipActive('pending') ? null : 'pending')}
                className={chipClass('pending', 'bg-amber-100 text-amber-700', 'text-gray-600') + ' w-full'}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-xs">รอผล</span>
                <span className="font-bold ml-auto">{summary.pending}</span>
              </button>

              {/* Progress bar */}
              <div className="pt-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">อัตราผ่าน</span>
                  <span className={`font-semibold ${summary.passRate >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {summary.passRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 flex overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 transition-all duration-500"
                       style={{ width: `${(summary.passed / Math.max(summary.total, 1)) * 100}%` }} />
                  <div className="bg-red-400 h-1.5 transition-all duration-500"
                       style={{ width: `${(summary.failed / Math.max(summary.total, 1)) * 100}%` }} />
                  <div className="bg-amber-400 h-1.5 transition-all duration-500"
                       style={{ width: `${(summary.pending / Math.max(summary.total, 1)) * 100}%` }} />
                </div>
              </div>

              {/* คะแนนรวม */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 px-1">
                <div className="flex items-center gap-1 text-gray-600 text-xs">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  คะแนน
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm ${colors.text}`}>{summary.totalScoreNet}</span>
                  <span className="text-gray-400 text-[11px]"> / {summary.totalScoreFull}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
