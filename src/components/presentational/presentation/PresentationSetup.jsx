import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { levelOf, LEVEL_STYLE } from '../../../utils/presentation';

const MAX_FOCUS = 6;

export default function PresentationSetup({ index, allPeas, focusPeas, deckItems, onChangePeas, onChangeItems, onSelectFailed, onClose }) {
  const [q, setQ] = useState('');
  const entries = [...index.values()];
  const peaMatches = allPeas.filter((p) => p.includes(q.trim()));

  const togglePea = (p) => {
    if (focusPeas.includes(p)) onChangePeas(focusPeas.filter((x) => x !== p));
    else if (focusPeas.length < MAX_FOCUS) onChangePeas([...focusPeas, p]);
  };
  const toggleItem = (item) => {
    const next = deckItems.includes(item) ? deckItems.filter((x) => x !== item) : [...deckItems, item];
    // คงลำดับตามชีต
    onChangeItems(entries.map((e) => e.item).filter((i) => next.includes(i)));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-800">ตั้งค่าการนำเสนอ</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-700">หน่วยงานที่เปรียบเทียบ ({focusPeas.length}/{MAX_FOCUS})</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {focusPeas.map((p) => (
                <button key={p} type="button" onClick={() => togglePea(p)} className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm flex items-center gap-1">
                  {p} <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาหน่วยงาน" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {peaMatches.map((p) => {
                const on = focusPeas.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePea(p)}
                    disabled={!on && focusPeas.length >= MAX_FOCUS}
                    className={`px-2.5 py-1 rounded-lg text-xs border disabled:opacity-40 ${on ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-700">ตัวชี้วัดที่นำเสนอ ({deckItems.length}/{entries.length})</h4>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={onSelectFailed} className="px-2.5 py-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-50">เฉพาะข้อที่ยังไม่ผ่าน</button>
                <button type="button" onClick={() => onChangeItems(entries.map((e) => e.item))} className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50">ทั้งหมด</button>
                <button type="button" onClick={() => onChangeItems([])} className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50">ล้าง</button>
              </div>
            </div>
            <ul className="divide-y border rounded-lg">
              {entries.map((e) => (
                <li key={e.item}>
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={deckItems.includes(e.item)} onChange={() => toggleItem(e.item)} className="w-4 h-4 accent-blue-600" />
                    <span className="w-10 font-semibold text-slate-700 text-sm shrink-0">{e.item}</span>
                    <span className="flex-1 text-sm text-slate-600 truncate" title={e.description}>{e.description}</span>
                    <span className="flex gap-0.5 shrink-0">
                      {focusPeas.map((p) => (
                        <span key={p} title={p} className="w-3 h-3 rounded-sm" style={{ background: LEVEL_STYLE[levelOf(e.rows[p])].color }} />
                      ))}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="px-6 py-3 border-t text-xs text-slate-500">
          คีย์ลัด: ← → เปลี่ยนสไลด์ · F เต็มจอ · D สลับกราฟ 4 PEA / ทุก PEA · M แผนที่ตัวชี้วัด · Esc ออก
        </div>
      </div>
    </div>
  );
}
