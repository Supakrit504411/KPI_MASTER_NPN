import { useState, useCallback, useRef, useEffect } from 'react';
import { Filter, Monitor, ChevronDown, Check, X, Search } from 'lucide-react';

export default function PEAFilter({
  peas,
  selectedPEAs,
  onSelectPEA,
  monitorMode,
  onToggleMonitor,
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelectAll = useCallback(() => {
    if (selectedPEAs.length === peas.length && peas.length > 0) {
      onSelectPEA([]);
    } else {
      onSelectPEA(peas);
    }
  }, [selectedPEAs.length, peas.length, peas, onSelectPEA]);

  const handleSelectOne = useCallback((pea) => {
    onSelectPEA(pea);
  }, [onSelectPEA]);

  const clearAll = useCallback(() => {
    onSelectPEA([]);
    setSearch('');
    setOpen(false);
  }, [onSelectPEA]);

  const isSelectedAll = selectedPEAs.length === peas.length && peas.length > 0;

  const filtered = search.trim()
    ? peas.filter((p) => p.toLowerCase().includes(search.trim().toLowerCase()))
    : peas;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
        <Filter className="w-4 h-4" />
        <span>หน่วยงาน:</span>
      </div>

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all
            ${open
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100'
              : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
        >
          <span className="text-gray-700 font-medium">
            {selectedPEAs.length === 0
              ? `ทั้งหมด (${peas.length})`
              : `${selectedPEAs.length} หน่วยงาน`}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          {selectedPEAs.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  clearAll();
                }
              }}
              className="hover:text-red-600 cursor-pointer text-gray-400"
              title="ล้างตัวกรอง"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80">
            <div className="px-2 py-2 border-b border-gray-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาหน่วยงาน..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-md
                             focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSelectAll}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100
                ${isSelectedAll ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0
                ${isSelectedAll ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {isSelectedAll && <Check className="w-3 h-3 text-white" />}
              </span>
              ทั้งหมด ({peas.length})
            </button>

            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400 text-center">ไม่พบข้อมูล</p>
              ) : (
                filtered.map((pea) => {
                  const isSelected = selectedPEAs.includes(pea);
                  return (
                    <button
                      key={pea}
                      type="button"
                      onClick={() => handleSelectOne(pea)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
                        ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0
                        ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="truncate">{pea}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleMonitor}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
          ${monitorMode
            ? 'bg-amber-500 text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
      >
        <Monitor className="w-4 h-4" />
        Monitor (4PEA)
      </button>
    </div>
  );
}
