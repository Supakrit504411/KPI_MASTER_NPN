import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorMessage — แสดงข้อความผิดพลาด
 * Presentational Component
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-red-700 mb-2">เกิดข้อผิดพลาด</h3>
      <p className="text-sm text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white 
                     rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          ลองใหม่
        </button>
      )}
    </div>
  );
}
