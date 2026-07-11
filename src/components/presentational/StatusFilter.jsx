import { CheckCircle2, XCircle, Clock, LayoutGrid } from 'lucide-react';

const STATUS_OPTIONS = [
  { key: null, label: 'ทั้งหมด', icon: LayoutGrid, activeColor: 'bg-blue-600 text-white', dot: 'bg-blue-400' },
  { key: 'passed', label: 'ผ่านเกณฑ์', icon: CheckCircle2, activeColor: 'bg-emerald-600 text-white', dot: 'bg-emerald-400' },
  { key: 'failed', label: 'ไม่ผ่าน', icon: XCircle, activeColor: 'bg-red-600 text-white', dot: 'bg-red-400' },
  { key: 'pending', label: 'รอผล', icon: Clock, activeColor: 'bg-amber-500 text-white', dot: 'bg-amber-400' },
];

/**
 * StatusFilter — ตัวกรองสถานะ ผ่าน/ไม่ผ่าน/รอผล
 * Presentational Component
 */
export default function StatusFilter({ activeStatus, onSelectStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-gray-600 text-sm font-medium mr-1">สถานะ:</span>
      {STATUS_OPTIONS.map((opt) => {
        const isActive = activeStatus === opt.key;
        return (
          <button
            key={opt.label}
            onClick={() => onSelectStatus(opt.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                        transition-all duration-200 border
                        ${isActive
                          ? `${opt.activeColor} border-transparent shadow-md`
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
          >
            <opt.icon className="w-4 h-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
