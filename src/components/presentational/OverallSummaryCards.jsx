import { BarChart3, CheckCircle2, XCircle, Building2, Clock } from 'lucide-react';

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
      sub: `อัตราผ่าน ${summary.overallPassRate}%`,
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
    {
      key: 'pending',
      label: 'รอผล',
      value: summary.totalPending,
      icon: Clock,
      color: 'from-amber-500 to-yellow-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-700',
      clickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {cards.map((card) => {
        const isActive = card.clickable && activeStatus === card.key;
        const isInactiveOther = card.clickable && activeStatus !== null && activeStatus !== card.key;
        return (
          <button
            key={card.label}
            type="button"
            onClick={card.clickable ? () => onStatusClick(isActive ? null : card.key) : undefined}
            disabled={!card.clickable}
            className={`${card.bgLight} rounded-lg px-3 py-2.5 border shadow-sm text-left transition-all
                        ${card.clickable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}
                        ${isActive ? 'ring-2 ring-offset-1 ring-blue-400 border-blue-300' : 'border-white'}
                        ${isInactiveOther ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500 leading-tight">{card.label}</span>
              <div className={`bg-gradient-to-br ${card.color} p-1.5 rounded-md`}>
                <card.icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className={`text-xl font-bold ${card.textColor}`}>{card.value}</p>
            {card.sub && (
              <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
            )}
            {card.clickable && (
              <p className="text-[10px] text-gray-400 mt-1">
                {isActive ? '✓ กำลังกรอง' : 'คลิกเพื่อกรอง'}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
