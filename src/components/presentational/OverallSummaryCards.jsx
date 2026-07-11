import { BarChart3, CheckCircle2, XCircle, Building2, Clock } from 'lucide-react';

/**
 * OverallSummaryCards — การ์ดสรุปภาพรวมทุก PEA
 * Presentational Component — คลิกได้เพื่อกรองตารางตามสถานะ
 */
export default function OverallSummaryCards({ summary, activeStatus, onStatusClick }) {
  const cards = [
    {
      key: null,
      label: 'หน่วยงานทั้งหมด',
      value: summary.totalPEAs,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
      clickable: false,
    },
    {
      key: null,
      label: 'จำนวนข้อทั้งหมด',
      value: summary.totalItems,
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      clickable: false,
    },
    {
      key: 'passed',
      label: 'ผ่านเกณฑ์ 5 คะแนน',
      value: summary.totalPassed,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      clickable: true,
    },
    {
      key: 'failed',
      label: 'ไม่ผ่านเกณฑ์ 5 คะแนน',
      value: summary.totalFailed,
      icon: XCircle,
      color: 'from-red-500 to-red-600',
      bgLight: 'bg-red-50',
      textColor: 'text-red-700',
      clickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isActive = card.clickable && activeStatus === card.key;
        const isInactiveOther = card.clickable && activeStatus !== null && activeStatus !== card.key;
        return (
          <button
            key={card.label}
            type={card.clickable ? 'button' : 'button'}
            onClick={card.clickable ? () => onStatusClick(isActive ? null : card.key) : undefined}
            disabled={!card.clickable}
            className={`${card.bgLight} rounded-xl p-5 border shadow-sm text-left transition-all
                        ${card.clickable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}
                        ${isActive ? 'ring-2 ring-offset-2 ring-emerald-400 border-emerald-300' : 'border-white'}
                        ${isInactiveOther ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">{card.label}</span>
              <div className={`${card.color} p-2 rounded-lg`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
            {card.label === 'ผ่านเกณฑ์ 5 คะแนน' && (
              <p className="text-xs text-gray-500 mt-1">
                อัตราผ่าน {summary.overallPassRate}% (จากข้อที่ประเมินแล้ว)
              </p>
            )}
            {card.clickable && (
              <p className="text-xs text-gray-400 mt-2">
                {isActive ? '✓ กำลังกรอง' : 'คลิกเพื่อกรองตาราง'}
              </p>
            )}
          </button>
        );
      })}

      {/* การ์ดรอผล */}
      <button
        type="button"
        onClick={() => onStatusClick(activeStatus === 'pending' ? null : 'pending')}
        className={`bg-amber-50 rounded-xl p-5 border shadow-sm text-left transition-all
                    hover:shadow-md hover:-translate-y-0.5 cursor-pointer col-span-1 sm:col-span-2 lg:col-span-4
                    ${activeStatus === 'pending' ? 'ring-2 ring-offset-2 ring-amber-400 border-amber-300' : 'border-white'}
                    ${activeStatus !== null && activeStatus !== 'pending' ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="from-amber-500 to-yellow-500 bg-gradient-to-br p-2 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600 block">รอผล (คะแนนยังไม่ถูกกรอก)</span>
              <p className="text-3xl font-bold text-amber-700 mt-1">{summary.totalPending} ข้อ</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {activeStatus === 'pending' ? '✓ กำลังกรอง' : 'คลิกเพื่อกรองตาราง'}
          </p>
        </div>
      </button>
    </div>
  );
}
