import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';

export default function DataTable({ data, notes, onNoteChange, onSaveNote, highlightedItem, onItemSelect, highlightedItemFromComparison, lineProfile }) {
  const [selectedRow, setSelectedRow] = useState(null);
  const [onlyNoted, setOnlyNoted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tbodyRef = useRef(null);
  const containerRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  // หมายเหตุที่มีผลจริงของแถว = ค่าที่แก้ในเครื่อง (localStorage) ถ้าไม่มีใช้ค่าจากชีต (คอลัมน์ K)
  const getNoteFor = (row) => String(notes[row._rowIndex] ?? row.note ?? '').trim();

  // Filter data to show only the highlighted item's rows
  const filteredData = useMemo(() => {
    let result = highlightedItem ? data.filter((row) => row.item === highlightedItem) : data;
    if (onlyNoted) {
      result = result.filter((row) => getNoteFor(row) !== '');
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, highlightedItem, onlyNoted, notes]);

  const notedCount = useMemo(
    () => data.filter((row) => getNoteFor(row) !== '').length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, notes]
  );

  // Scroll to and highlight rows matching highlightedItemFromComparison (from SummaryScoreTable or ItemComparison)
  useEffect(() => {
    if (highlightedItemFromComparison && tbodyRef.current) {
      // Clear previous timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      const rows = tbodyRef.current.querySelectorAll('tr');
      let found = false;
      for (const row of rows) {
        const itemCell = row.querySelector('td:nth-child(2)');
        if (itemCell && itemCell.textContent.trim() === highlightedItemFromComparison) {
          found = true;
          // Use requestAnimationFrame for smoother scroll (avoids layout thrashing)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
          });
          row.classList.add('bg-yellow-50', 'ring-2', 'ring-yellow-400');
          // Remove highlight after 4 seconds
          highlightTimeoutRef.current = setTimeout(() => {
            row.classList.remove('bg-yellow-50', 'ring-2', 'ring-yellow-400');
          }, 4000);
          break; // Only scroll to the first match
        }
      }
    }

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [highlightedItemFromComparison, onItemSelect]);

  const getRowClass = (index, row) => {
    const base = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    const isHighlighted = highlightedItem && row.item === highlightedItem;
    return `${base} hover:bg-blue-50 transition-colors cursor-pointer ${isHighlighted ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`;
  };

  // Notify parent when any row is clicked (for ItemComparison linking)
  const handleRowClick = (row) => {
    if (onItemSelect) {
      onItemSelect(row.item);
    }
    setSelectedRow(row);
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  return (
    <>
      <div
        ref={containerRef}
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all
          ${isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col' : ''}`}
      >
        {/* แถบสรุป + ปุ่มกรองเฉพาะแถวที่มีหมายเหตุ + ปุ่มเต็มจอ */}
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            มีหมายเหตุแล้ว <strong className="text-amber-600">{notedCount}</strong> รายการ
            (จากทั้งหมด {data.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyNoted((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border
                ${onlyNoted
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-amber-50'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {onlyNoted ? '✓ แสดงเฉพาะที่มีหมายเหตุ' : 'แสดงเฉพาะที่มีหมายเหตุ'}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border bg-white text-gray-600 border-gray-300 hover:bg-blue-50"
              title={isFullscreen ? 'ย่อกลับ (Esc)' : 'ขยายเต็มจอ'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isFullscreen ? 'ย่อกลับ' : 'เต็มจอ'}
            </button>
          </div>
        </div>
        <div className={`overflow-x-auto ${isFullscreen ? 'flex-1 overflow-y-auto' : ''}`}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-gray-700 to-gray-600 text-white">
                <th className="px-2 py-3 text-center font-medium w-8">#</th>
                <th className="px-2 py-3 text-center font-medium w-12">ข้อ</th>
                <th className="px-2 py-3 text-left font-medium min-w-[200px]">รายละเอียด</th>
                <th className="px-2 py-3 text-center font-medium min-w-[100px]">PEA</th>
                <th className="px-2 py-3 text-center font-medium w-20">Group</th>
                <th className="px-2 py-3 text-center font-medium w-20">เป้าหมายรายปี</th>
                <th className="px-2 py-3 text-center font-medium w-20">เป้าหมายระดับ 5</th>
                <th className="px-2 py-3 text-center font-medium w-20">ผลดำเนินงาน</th>
                <th className="px-2 py-3 text-center font-medium w-16">คะแนน</th>
                <th className="px-2 py-3 text-center font-medium w-16">น้ำหนัก</th>
                <th className="px-2 py-3 text-center font-medium w-20">คะแนนสุทธิ</th>
                <th className="px-2 py-3 text-center font-medium w-16">คิดเป็น %</th>
                <th className="px-2 py-3 text-center font-medium w-12">หมายเหตุ</th>
                <th className="px-2 py-3 text-center font-medium w-10">สถานะ</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {filteredData.map((row, index) => (
                <tr
                  key={row._rowIndex ?? `${row.pea}-${row.item}-${index}`}
                  onClick={() => handleRowClick(row)}
                  className={getRowClass(index, row)}
                >
                  <td className="px-2 py-2.5 text-center text-gray-400 text-xs">{index + 1}</td>
                  <td className="px-2 py-2.5 text-center font-medium text-gray-700">{row.item}</td>
                  <td className="px-2 py-2.5 text-left text-gray-600 text-xs leading-relaxed max-w-xs">
                    <span className="line-clamp-2">{row.description}</span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium border bg-gray-50 text-gray-700 border-gray-200 truncate max-w-[90px]"
                      title={row.pea}
                    >
                      {row.pea}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium border ${
                        row.group === 'S'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : row.group === 'NE1'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : row.group === 'จุดรวมงาน'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {row.group || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-600 text-xs">
                    {row.targetYearly ?? '-'}
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-600 text-xs">
                    {row.targetLevel5 ?? '-'}
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-600 text-xs">
                    {row.result ?? '-'}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {row.status === 'pending' ? (
                      <span className="font-bold text-amber-500 text-xs">รอผล</span>
                    ) : (
                      <span className={`font-bold text-xs ${row.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                        {row.score.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-600 text-xs">{row.weight}</td>
                  <td className="px-2 py-2.5 text-center font-semibold text-gray-700 text-xs">
                    {row.scoreNet.toFixed(2)}
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-600 text-xs">
                    {row.percentage > 0 ? (
                      <span className="font-semibold text-blue-600">{row.percentage}%</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {getNoteFor(row) ? (
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600"
                        title={getNoteFor(row)}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {row.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : row.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          แสดง {filteredData.length} รายการ | คลิกแถวเพื่อดูรายละเอียด / เพิ่มหมายเหตุ | แถวที่เลือกจะไฮไลต์ใน ItemComparison | กดข้อใน ItemComparison เพื่อไฮไลต์ในตารางนี้ | กดข้อที่ในตารางสรุปคะแนนเพื่อไฮไลต์
        </div>
      </div>

      {selectedRow && (
        <DetailModal
          row={selectedRow}
          note={notes[selectedRow._rowIndex] || selectedRow.note || ''}
          onNoteChange={(value) => onNoteChange(selectedRow._rowIndex, value)}
          onSave={(userName) =>
            onSaveNote(selectedRow._rowIndex, notes[selectedRow._rowIndex] || selectedRow.note || '', {
              user: userName,
              pea: selectedRow.pea,
              item: selectedRow.item,
            })
          }
          onClose={() => setSelectedRow(null)}
          lineProfile={lineProfile}
        />
      )}
    </>
  );
}

function DetailModal({ row, note, onNoteChange, onSave, onClose, lineProfile }) {
  const lineUserName = lineProfile?.displayName || '';
  const [userName, setUserName] = useState(
    () => lineUserName || localStorage.getItem('pea-dashboard-username') || ''
  );
  const initialNoteRef = useRef(note);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSave = () => {
    const oldNote = (initialNoteRef.current || '').trim();
    // มีหมายเหตุเดิมอยู่ และค่าใหม่ต่างจากเดิม → ถามยืนยันก่อนแก้ทับ
    if (oldNote && note.trim() !== oldNote) {
      const confirmed = window.confirm(
        `รายการนี้มีหมายเหตุเดิมอยู่แล้ว:\n\n"${oldNote}"\n\nแน่ใจหรือไม่ว่าต้องการแก้ไขทับข้อมูลเดิม?`
      );
      if (!confirmed) return;
    }
    localStorage.setItem('pea-dashboard-username', userName.trim());
    onSave(userName.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-medium text-gray-500">ข้อ {row.item}</span>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
                {row.pea}
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                  row.group === 'S'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : row.group === 'NE1'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : row.group === 'จุดรวมงาน'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {row.group || '-'}
              </span>
            </div>
            <StatusBadge status={row.status} score={row.score} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="ปิด"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              รายละเอียด
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">{row.description}</p>
          </section>

          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="เป้าหมายรายปี" value={row.targetYearly} />
            <StatBox label="เป้าหมายระดับ 5" value={row.targetLevel5} />
            <StatBox label="ผลดำเนินงาน" value={row.result} />
            <StatBox label="น้ำหนัก" value={row.weight} />
          </section>

          <section className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">คะแนน KPIs</p>
              <p className={`text-2xl font-bold ${row.status === 'pending' ? 'text-amber-500' : row.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                {row.status === 'pending' ? 'รอผล' : row.score.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">คะแนนสุทธิ</p>
              <p className="text-2xl font-bold text-gray-700">
                {row.scoreNet.toFixed(2)}
                <span className="text-sm text-gray-400 font-normal"> / {row.scoreFull.toFixed(2)}</span>
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">คิดเป็น %</p>
              <p className="text-2xl font-bold text-blue-600">
                {row.percentage > 0 ? `${row.percentage}%` : '-'}
              </p>
            </div>
          </section>

          <section>
            {lineProfile ? (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                {lineProfile.pictureUrl && (
                  <img src={lineProfile.pictureUrl} alt="" className="w-7 h-7 rounded-full" />
                )}
                <span className="text-sm font-medium text-green-800">{lineProfile.displayName}</span>
                <span className="text-xs text-green-600 ml-auto">LINE Login</span>
              </div>
            ) : (
              <>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  ชื่อผู้บันทึก <span className="text-gray-300 normal-case">(ใช้เก็บประวัติว่าใครกรอก)</span>
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="พิมพ์ชื่อ-นามสกุล หรือรหัสพนักงาน..."
                  className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </>
            )}
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="พิมพ์หมายเหตุที่นี่..."
              rows={3}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                         resize-none"
            />
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            บันทึกรายการ
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, score }) {
  if (status === 'passed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านเกณฑ์ ({score.toFixed(2)})
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
        <XCircle className="w-3.5 h-3.5" /> ไม่ผ่านเกณฑ์ ({score.toFixed(2)})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200">
      <Clock className="w-3.5 h-3.5" /> รอผล
    </span>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-gray-700">{value ?? '-'}</p>
    </div>
  );
}
