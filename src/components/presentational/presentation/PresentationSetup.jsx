import { useState, useRef, useEffect } from 'react';
import { X, Search, ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { levelOf, LEVEL_STYLE, ITEM_FILTERS, toImageUrl, fileToCoverDataUrl } from '../../../utils/presentation';

const MAX_FOCUS = 6;

export default function PresentationSetup({ index, allPeas, focusPeas, deckItems, itemFilter, onChangeFilter, onChangePeas, onChangeItems, focusItems, localCover, sheetCover, onChangeLocalCover, onClose }) {
  const [q, setQ] = useState('');
  const [itemQuery, setItemQuery] = useState('');
  const itemsRef = useRef(null);
  const entries = [...index.values()];
  const peaMatches = allPeas.filter((p) => p.includes(q.trim()));
  const shownEntries = itemQuery.trim() ? entries.filter((e) => e.item.includes(itemQuery.trim()) || e.description.includes(itemQuery.trim())) : entries;

  // เปิดจากปุ่ม "เลือกข้อ" ที่ footer → เลื่อนมาที่ส่วนเลือกข้อทันที
  useEffect(() => {
    if (focusItems) itemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusItems]);

  const togglePea = (p) => {
    if (focusPeas.includes(p)) onChangePeas(focusPeas.filter((x) => x !== p));
    else if (focusPeas.length < MAX_FOCUS) onChangePeas([...focusPeas, p]);
  };
  const toggleItem = (item) => {
    const next = deckItems.includes(item) ? deckItems.filter((x) => x !== item) : [...deckItems, item];
    // คงลำดับตามชีต
    onChangeItems(entries.map((e) => e.item).filter((i) => next.includes(i)));
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      onChangeLocalCover(await fileToCoverDataUrl(file));
      toast.success('ตั้งหน้าปกจากไฟล์แล้ว');
    } catch (err) {
      toast.error(err.message);
    }
  };
  const previewSrc = localCover || toImageUrl(sheetCover);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-800">ตั้งค่าการนำเสนอ</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <h4 className="font-semibold text-slate-700 mb-2">หน้าปก</h4>
            <div className="flex gap-4">
              <div className="w-48 aspect-video rounded-lg border bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-xs text-slate-400">
                {previewSrc ? <img src={previewSrc} alt="" className="w-full h-full object-contain bg-black" referrerPolicy="no-referrer" /> : 'ปกสำเร็จรูป'}
              </div>
              <div className="flex-1 space-y-2 text-xs text-slate-600">
                <div>
                  ใช้อยู่:{' '}
                  <b>{localCover ? 'ไฟล์จากเครื่องนี้' : sheetCover ? 'ลิงก์จากชีต Config' : 'ปกสำเร็จรูป'}</b>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="px-2.5 py-1 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer flex items-center gap-1">
                    <ImagePlus className="w-3.5 h-3.5" /> เลือกไฟล์รูป
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
                  </label>
                  {localCover && (
                    <button type="button" onClick={() => onChangeLocalCover('')} className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> ลบไฟล์ในเครื่อง
                    </button>
                  )}
                </div>
                <p className="text-slate-500 leading-relaxed">
                  ไฟล์จากเครื่องจะเห็นเฉพาะเครื่องนี้ · ถ้าต้องการให้ทุกคนเห็น ใส่ลิงก์รูปในชีต <b>Config</b> คอลัมน์ A = <code>coverImage</code>, คอลัมน์ B = ลิงก์
                  (ลิงก์ Google Drive ต้องแชร์เป็น "ทุกคนที่มีลิงก์")
                </p>
              </div>
            </div>
          </section>

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

          <section ref={itemsRef} className="scroll-mt-2">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-700">ตัวชี้วัดที่นำเสนอ ({deckItems.length}/{entries.length})</h4>
              <div className="flex gap-2 text-xs">
                {Object.entries(ITEM_FILTERS).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeFilter(mode)}
                    className={`px-2.5 py-1 rounded-lg border ${itemFilter === mode ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 hover:bg-slate-50'}`}
                  >
                    {label}
                  </button>
                ))}
                <button type="button" onClick={() => onChangeItems([])} className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50">ล้าง</button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              {itemFilter === 'custom'
                ? 'เลือกเองรายข้อ'
                : itemFilter === 'passed'
                  ? 'ข้อที่ผ่าน = หน่วยงานที่เลือกได้ 5 คะแนนครบทุกหน่วย'
                  : itemFilter === 'failed'
                    ? 'ข้อที่ไม่ผ่าน = มีหน่วยงานที่เลือกได้ต่ำกว่า 5 คะแนนอย่างน้อย 1 หน่วย'
                    : 'แสดงทุกข้อ'}
              {' · ติ๊กเพิ่ม/เอาออกรายข้อได้'}
            </p>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input value={itemQuery} onChange={(e) => setItemQuery(e.target.value)} placeholder="ค้นหาข้อ เช่น 4 หรือชื่อตัวชี้วัด" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <ul className="divide-y border rounded-lg max-h-72 overflow-y-auto">
              {shownEntries.length === 0 && <li className="px-3 py-3 text-sm text-slate-400">ไม่พบข้อที่ค้นหา</li>}
              {shownEntries.map((e) => (
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
