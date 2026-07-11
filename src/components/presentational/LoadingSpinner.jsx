import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner — แสดง Loading state
 * Presentational Component
 */
export default function LoadingSpinner({ message = 'กำลังโหลดข้อมูล...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="flex items-center gap-2 mt-4 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
