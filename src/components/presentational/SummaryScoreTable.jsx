import { useMemo, useState } from 'react';
import { Table } from 'lucide-react';

/**
 * SummaryScoreTable — ตารางสรุปคะแนนแบบกระชับเรียงคอลัมน์
 * Col A1 = "ข้อที่", Col B1 = PEA names
 * Row A2+ = item numbers, Row B2+ = KPI scores for each selected PEA
 * Clickable item numbers to interact with ItemComparison and DataTable
 */
export default function SummaryScoreTable({ rawData, selectedPEAs, onItemSelect, highlightedItem }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const tableData = useMemo(() => {
    if (!selectedPEAs || selectedPEAs.length === 0) return null;

    // Get unique items sorted numerically
    const itemSet = new Set();
    for (const row of rawData) {
      if (selectedPEAs.includes(row.pea)) {
        itemSet.add(row.item);
      }
    }
    const items = Array.from(itemSet).sort((a, b) => {
      // Try numeric sort first
      const numA = parseFloat(String(a).replace(/[^0-9.]/g, ''));
      const numB = parseFloat(String(b).replace(/[^0-9.]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, 'th');
    });

    // Build score matrix: item → pea → score
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
        <p className="text-sm text-gray-400">
          ยังไม่มีข้อมูล | กรุณาเลือกหน่วยงานจากตัวกรองด้านบน
        </p>
      </div>
    );
  }

  const { items, peas, matrix } = tableData;

  const handleItemClick = (item) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Table className="w-4 h-4" />
          สรุปคะแนน KPIs รายข้อ ({items.length} ข้อ × {peas.length} หน่วยงาน)
        </h3>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th
                className="sticky left-0 z-20 bg-gray-100 px-3 py-3 text-center text-xs font-bold text-gray-700 border-r border-gray-300 min-w-[80px]"
                rowSpan={2}
              >
                ข้อที่
              </th>
              {peas.map((pea) => (
                <th
                  key={pea}
                  className="px-3 py-3 text-center text-xs font-bold text-gray-700 border-l border-gray-300 min-w-[100px] max-w-[150px]"
                >
                  {pea}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, itemIdx) => {
              const isHighlighted = highlightedItem === item;
              return (
              <tr
                key={item}
                className={`border-b border-gray-200 transition-colors group ${
                  itemIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } ${isHighlighted ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Item Number — sticky column, clickable */}
                <td
                  className={`sticky left-0 z-10 px-3 py-2.5 text-center font-bold text-sm border-r border-gray-300 cursor-pointer transition-colors
                    ${isHighlighted ? 'bg-blue-100 text-blue-700 shadow-[inset_0_0_0_2px_rgba(96,165,250,1)]' : ''}
                    ${!isHighlighted && hoveredItem === item ? 'bg-blue-50 text-blue-600' : ''}
                    ${!isHighlighted && hoveredItem !== item ? (itemIdx % 2 === 0 ? 'bg-white text-gray-800' : 'bg-gray-50 text-gray-800') : ''}`}
                  onClick={() => handleItemClick(item)}
                  title="คลิกเพื่อแสดงในตารางข้อมูลและเปรียบเทียบ"
                >
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold transition-colors
                    ${isHighlighted ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'}`}>
                    {item}
                  </span>
                </td>

                {/* Scores for each PEA */}
                {peas.map((pea) => {
                  const score = matrix[item]?.[pea];
                  const hasScore = score !== undefined && score !== null && score !== 0;
                  let scoreClass = 'text-gray-400';
                  let bgClass = '';

                  if (hasScore) {
                    if (score >= 5) {
                      scoreClass = 'text-emerald-600 font-bold';
                      bgClass = 'bg-emerald-50/50';
                    } else if (score >= 4.8) {
                      scoreClass = 'text-orange-600 font-semibold';
                      bgClass = 'bg-orange-50/50';
                    } else {
                      scoreClass = 'text-red-600 font-semibold';
                      bgClass = 'bg-red-50/50';
                    }
                  }

                  return (
                    <td
                      key={pea}
                      className={`px-3 py-2.5 text-center ${scoreClass} ${bgClass} border-l border-gray-100 transition-colors`}
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
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-4 flex-wrap text-xs text-gray-600">
        <span className="font-semibold text-gray-500">คำอธิบายสี:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          ≥ 5.00 (ผ่าน)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
          4.80 – 4.99 (ใกล้เคียง)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          &lt; 4.80 (ไม่ผ่าน)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          ไม่มีข้อมูล
        </span>
        <span className="flex items-center gap-1 ml-auto text-blue-600 font-medium">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          คลิกที่ข้อที่เพื่อไฮไลต์ในตารางข้อมูล
        </span>
      </div>
    </div>
  );
}
