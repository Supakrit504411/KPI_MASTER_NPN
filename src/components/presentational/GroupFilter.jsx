import { useState, useCallback, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Check, X, Search } from 'lucide-react';

export default function GroupFilter({ groups, selectedGroups, onSelectGroup, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Document-level click-outside listener — only active when dropdown is open
  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    // Use mousedown for faster response
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggleAll = useCallback(() => {
    if (disabled) return;
    if (selectedGroups.length === groups.length) {
      onSelectGroup([]);
    } else {
      onSelectGroup(groups);
    }
  }, [disabled, selectedGroups.length, groups.length, groups, onSelectGroup]);

  const toggleOne = useCallback((group) => {
    if (disabled) return;
    onSelectGroup(group);
  }, [disabled, onSelectGroup]);

  const clearAll = useCallback(() => {
    if (disabled) return;
    onSelectGroup([]);
    setSearch('');
    setOpen(false);
  }, [disabled, onSelectGroup]);

  const groupColors = {
    NE1: { selected: 'bg-sky-500', active: 'bg-sky-100 text-sky-700 border-sky-300' },
    S: { selected: 'bg-purple-500', active: 'bg-purple-100 text-purple-700 border-purple-300' },
    'จุดรวมงาน': { selected: 'bg-amber-500', active: 'bg-amber-100 text-amber-700 border-amber-300' },
  };

  const isSelectedAll = selectedGroups.length === groups.length && groups.length > 0;

  const filteredGroups = search.trim()
    ? groups.filter((g) => g.toLowerCase().includes(search.toLowerCase()))
    : groups;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
        <Layers className="w-4 h-4" />
        <span>กลุ่ม:</span>
      </div>

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
          }}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all
            ${open
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100'
              : 'bg-white border-gray-300 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="text-gray-700 font-medium">
            {selectedGroups.length === 0
              ? 'ทั้งหมด'
              : `${selectedGroups.length} รายการ`}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          {selectedGroups.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <span className="font-medium">{selectedGroups.join(', ')}</span>
              {/* ใช้ span แทน button — HTML ห้ามซ้อน button ใน button */}
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
                className="hover:text-red-600 cursor-pointer"
                title="ล้างตัวกรอง"
              >
                <X className="w-3 h-3" />
              </span>
            </span>
          )}
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-64">
            <div className="px-2 py-2 border-b border-gray-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหากลุ่ม..."
                  disabled={disabled}
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-md
                             focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAll}
              disabled={disabled}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100
                ${isSelectedAll ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0
                ${isSelectedAll ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {isSelectedAll && <Check className="w-3 h-3 text-white" />}
              </span>
              ทั้งหมด ({groups.length})
            </button>

            <div className="max-h-60 overflow-y-auto">
              {filteredGroups.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400 text-center">ไม่พบข้อมูล</p>
              ) : (
                filteredGroups.map((group) => {
                  const isSelected = selectedGroups.includes(group);
                  const colors = groupColors[group] || { selected: 'bg-blue-500', active: 'bg-blue-100 text-blue-700 border-blue-300' };
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleOne(group)}
                      disabled={disabled}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
                        ${isSelected ? colors.active : 'hover:bg-gray-50 text-gray-700'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0
                        ${isSelected ? `${colors.selected} border-current` : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="font-medium">{group}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {open && (
        <span className="text-xs text-blue-600">
          กำลังกรอง: {selectedGroups.join(', ') || 'ทั้งหมด'}
        </span>
      )}
    </div>
  );
}
