import { useMemo, useState } from 'react';
import { Table, Camera } from 'lucide-react';

export default function SummaryScoreTable({ rawData, selectedPEAs, onItemSelect, highlightedItem, allData, onScreenshot }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const itemDescriptions = useMemo(() => {
    const map = {};
    const source = allData || rawData;
    for (const row of source) {
      if (row.item && row.description && !map[row.item]) {
        map[row.item] = row.description;
      }
    }
    return map;
  }, [allData, rawData]);

  const tableData = useMemo(() => {
    if (!selectedPEAs || selectedPEAs.length === 0) return null;

    const itemSet = new Set();
    for (const row of rawData) {
      if (selectedPEAs.includes(row.pea)) itemSet.add(row.item);
    }
    const items = Array.from(itemSet).sort((a, b) => {
      const numA = parseFloat(String(a).replace(/[^0-9.]/g, ''));
      const numB = parseFloat(String(b).replace(/[^0-9.]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, 'th');
    });

    const matrix = {};
    for (const row of rawData) {
      if (!selectedPEAs.includes(row.pea)) continue;
      if (!matrix[row.item]) matrix[row.item] = {};
      matrix[row.item][row.pea] = row.score;
    }

    return { items, peas: selectedPEAs, matrix };
  }, [rawData, selectedPEAs]);

  if (!tableData || tableData.items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <Table className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">ยังไม่มีข้อมูล | กรุณาเลือกหน่วยงานจากตัวกรองด้านบน</p>
      </div>
    );
  }

  const { items, peas, matrix } = tableData;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 text-white flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Table className="w-4 h-4" />
          สรุปคะแนน KPIs รายข้อ ({items.length} ข้อ × {peas.length} หน่วยงาน)
        </h3>
        {onScreenshot && (
          <button
            onClick={onScreenshot}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-colors"
            title="บันทึกภาพ"
          >
            <Camera className="w-3.5 h-3.5" />
            บันทึกภาพ
          </button>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="border-collapse" style={{ tableLayout: 'auto' }}>
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-100 border-b border-gray-300">
              {/* Sticky: item + description header */}
              <th className="sticky left-0 top-0 z-30 bg-gray-100 px-3 py-2.5 text-left text-xs font-bold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[220px]">
                ข้อที่ / รายละเอียด
              </th>
              {peas.map((pea) => (
                <th
                  key={pea}
                  className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 border-l border-gray-200 whitespace-nowrap min-w-[68px]"
                >
                  {pea}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, itemIdx) => {
              const isHighlighted = highlightedItem === item;
              const desc = itemDescriptions[item] || '';
              return (
                <tr
                  key={item}
                  className={`border-b border-gray-200 transition-colors group ${
                    itemIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } ${isHighlighted ? '!bg-blue-100' : 'hover:bg-blue-50'}`}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Sticky: item badge + description */}
                  <td
                    className={`sticky left-0 z-10 px-3 py-2 border-r border-gray-300 cursor-pointer transition-colors
                      ${isHighlighted
                        ? 'bg-blue-100 shadow-[inset_0_0_0_2px_rgba(96,165,250,0.8)]'
                        : hoveredItem === item
                          ? 'bg-blue-50'
                          : itemIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    onClick={() => onItemSelect?.(item)}
                  >
                    <div className="flex items-start gap-2 min-w-[200px] max-w-[260px]">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm flex-shrink-0
                        ${isHighlighted ? 'bg-blue-300 text-blue-900' : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'}`}>
                        {item}
                      </span>
                      {desc && (
                        <span className="text-xs text-gray-500 leading-tight line-clamp-2 pt-0.5">
                          {desc}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Scores */}
                  {peas.map((pea) => {
                    const score = matrix[item]?.[pea];
                    const hasScore = score !== undefined && score !== null && score !== 0;
                    let scoreClass = 'text-gray-300';
                    let bgClass = '';

                    if (hasScore) {
                      if (score >= 5) {
                        scoreClass = 'text-emerald-700 font-bold';
                        bgClass = 'bg-emerald-50';
                      } else if (score >= 4.8) {
                        scoreClass = 'text-orange-600 font-semibold';
                        bgClass = 'bg-orange-50';
                      } else {
                        scoreClass = 'text-red-600 font-semibold';
                        bgClass = 'bg-red-50';
                      }
                    }

                    return (
                      <td
                        key={pea}
                        className={`px-2 py-2 text-center text-sm ${scoreClass} ${bgClass} border-l border-gray-100 transition-colors`}
                      >
                        {hasScore ? score.toFixed(2) : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center gap-4 flex-wrap text-xs text-gray-600">
        <span className="font-semibold text-gray-500">สี:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />≥ 5.00 ผ่าน</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />4.80–4.99 ใกล้เคียง</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" />&lt; 4.80 ไม่ผ่าน</span>
        <span className="flex items-center gap-1 ml-auto text-blue-600 font-medium">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />คลิกข้อที่เพื่อไฮไลต์
        </span>
      </div>
    </div>
  );
}
