import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Image as ImageIcon, Link2, Upload, Trash2, ArrowUp, ArrowDown, ClipboardPaste } from 'lucide-react';

let seq = 0;
const newId = () => `ins-${Date.now()}-${seq++}`;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// แผงจัดการสไลด์แทรกของ "ข้อ" ที่กำลังดูอยู่
export default function InsertPanel({ itemNo, itemTitle, inserts, onChange, onClose, onGoTo }) {
  const [tab, setTab] = useState('image'); // image | embed
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const list = inserts || [];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addImageFromDataUrl = useCallback((src) => {
    onChange([...list, { id: newId(), type: 'image', src, title: title.trim() }]);
    setTitle('');
    setError('');
  }, [list, onChange, title]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('กรุณาเลือกไฟล์รูปภาพ'); return; }
    try {
      addImageFromDataUrl(await readFileAsDataUrl(file));
    } catch {
      setError('อ่านไฟล์ไม่สำเร็จ');
    }
    e.target.value = '';
  };

  // วางรูปจากคลิปบอร์ด (Ctrl+V) — สะดวกสำหรับ capture จาก Canva
  const onPaste = useCallback(async (e) => {
    const item = [...(e.clipboardData?.items || [])].find((it) => it.type.startsWith('image/'));
    if (item) {
      e.preventDefault();
      try {
        addImageFromDataUrl(await readFileAsDataUrl(item.getAsFile()));
      } catch {
        setError('วางรูปไม่สำเร็จ');
      }
    }
  }, [addImageFromDataUrl]);

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    let normalized = v;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    try {
      new URL(normalized);
    } catch {
      setError('ลิงก์ไม่ถูกต้อง');
      return;
    }
    const type = tab === 'image' ? 'image' : 'embed';
    onChange([...list, { id: newId(), type, src: normalized, title: title.trim() }]);
    setUrl('');
    setTitle('');
    setError('');
  };

  const remove = (id) => onChange(list.filter((x) => x.id !== id));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose} onPaste={onPaste}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">แทรกหน้าประกอบข้อ {itemNo}</h3>
            {itemTitle && <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{itemTitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex gap-2">
            <TabBtn active={tab === 'image'} onClick={() => { setTab('image'); setError(''); }} icon={<ImageIcon className="w-4 h-4" />}>รูปภาพ (capture)</TabBtn>
            <TabBtn active={tab === 'embed'} onClick={() => { setTab('embed'); setError(''); }} icon={<Link2 className="w-4 h-4" />}>ฝังเว็บ / ลิงก์</TabBtn>
          </div>

          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="หัวข้อ / คำอธิบาย (ไม่บังคับ)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400" />

          {tab === 'image' ? (
            <div className="space-y-3">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-6 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Upload className="w-5 h-5" /> เลือกไฟล์รูปภาพ
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <ClipboardPaste className="w-4 h-4 shrink-0" /> หรือกด <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">V</kbd> เพื่อวางรูปที่ copy มา (เช่นจาก Canva)
              </div>
              <div className="flex gap-2">
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                  placeholder="หรือวางลิงก์รูปภาพ (URL)" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button type="button" onClick={addUrl} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">เพิ่ม</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                  placeholder="วางลิงก์เว็บไซต์ / เว็บแอป เช่น https://..." className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button type="button" onClick={addUrl} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">เพิ่ม</button>
              </div>
              <p className="text-xs text-slate-400">บางเว็บไซต์อาจไม่อนุญาตให้ฝัง — หากหน้าว่าง ใช้ปุ่ม "เปิดในแท็บใหม่" บนสไลด์แทน</p>
            </div>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

          <div>
            <div className="text-sm font-semibold text-slate-600 mb-2">หน้าที่แทรกแล้ว ({list.length})</div>
            {list.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-lg">ยังไม่มีหน้าแทรก</div>
            ) : (
              <ul className="space-y-2">
                {list.map((ins, i) => (
                  <li key={ins.id} className="flex items-center gap-3 bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                    {ins.type === 'image'
                      ? <img src={ins.src} alt="" className="w-14 h-10 object-cover rounded border border-slate-200 shrink-0" />
                      : <div className="w-14 h-10 rounded border border-slate-200 bg-blue-50 flex items-center justify-center shrink-0"><Link2 className="w-5 h-5 text-blue-500" /></div>}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{ins.title || (ins.type === 'image' ? 'รูปภาพ' : ins.src)}</div>
                      <div className="text-xs text-slate-400">{ins.type === 'image' ? 'รูปภาพ' : 'ฝังเว็บ'}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => onGoTo?.(ins.id)} className="px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100">ดู</button>
                      <IconBtn onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></IconBtn>
                      <IconBtn onClick={() => move(i, 1)} disabled={i === list.length - 1}><ArrowDown className="w-4 h-4" /></IconBtn>
                      <IconBtn onClick={() => remove(ins.id)} danger><Trash2 className="w-4 h-4" /></IconBtn>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700">เสร็จสิ้น</button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
      {icon}{children}
    </button>
  );
}

function IconBtn({ onClick, disabled, danger, children }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`p-1.5 rounded border transition-colors ${disabled ? 'opacity-30 cursor-not-allowed border-slate-200' : danger ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
      {children}
    </button>
  );
}
